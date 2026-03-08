package com.nbh.backend.service;

import com.nbh.backend.model.MediaResource;

import io.imagekit.sdk.ImageKit;
import io.imagekit.sdk.models.FileCreateRequest;
import io.imagekit.sdk.models.MoveFileRequest;
import io.imagekit.sdk.models.results.Result;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class ImageUploadService {

    public List<MediaResource> uploadFiles(List<MultipartFile> files) throws IOException {
        return uploadFiles(files, "/uploads");
    }

    public List<MediaResource> uploadFiles(List<MultipartFile> files, String folder) throws IOException {
        List<MediaResource> mediaResources = new ArrayList<>();

        if (files == null || files.isEmpty()) {
            return mediaResources;
        }

        String resolvedFolder = (folder == null || folder.isBlank()) ? "/uploads" : folder;
        if (!resolvedFolder.startsWith("/")) {
            resolvedFolder = "/" + resolvedFolder;
        }

        for (MultipartFile file : files) {
            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null || originalFilename.isBlank()) {
                originalFilename = "upload_" + System.currentTimeMillis();
            }

            FileCreateRequest fileCreateRequest = new FileCreateRequest(file.getBytes(), originalFilename);
            fileCreateRequest.setFolder(resolvedFolder);

            try {
                Result result = ImageKit.getInstance().upload(fileCreateRequest);
                String cdnUrl = result.getUrl();
                String fileId = result.getFileId();
                log.info("[IMAGEKIT UPLOAD] Successfully uploaded file to {}. CDN URL: {} (File ID: {})",
                        resolvedFolder, cdnUrl, fileId);
                mediaResources.add(MediaResource.builder().url(cdnUrl).fileId(fileId).build());
            } catch (Exception e) {
                log.error("[IMAGEKIT UPLOAD] FATAL ERROR: Failed to upload file {}", originalFilename, e);
                throw new IOException("Failed to upload file to ImageKit", e);
            }
        }

        return mediaResources;
    }

    public void deleteFile(String fileId) {
        deleteFileById(fileId);
    }

    public void deleteFileById(String fileId) {
        if (fileId == null || fileId.isBlank()) {
            return;
        }
        try {
            Result result = ImageKit.getInstance().deleteFile(fileId);
            log.info("[IMAGEKIT DELETE] Deleted fileId {}. Result: {}", fileId, result);
        } catch (Exception e) {
            if (isNotFound(e)) {
                // Idempotent delete: treat missing file as success.
                log.info("[IMAGEKIT DELETE] File already deleted or missing for fileId {}", fileId);
                return;
            }
            throw new RuntimeException("Failed to delete fileId from ImageKit: " + fileId, e);
        }
    }

    public void moveToFolder(String fileId, String folder) {
        if (fileId == null || fileId.isBlank() || folder == null || folder.isBlank()) {
            return;
        }
        String normalizedFolder = folder.startsWith("/") ? folder : "/" + folder;

        try {
            Result details = ImageKit.getInstance().getFileDetail(fileId);
            String sourcePath = details.getFilePath();
            if (sourcePath == null || sourcePath.isBlank()) {
                return;
            }
            if (sourcePath.startsWith(normalizedFolder + "/")) {
                return;
            }

            int slashIndex = sourcePath.lastIndexOf('/');
            String fileName = slashIndex >= 0 ? sourcePath.substring(slashIndex + 1) : sourcePath;

            MoveFileRequest request = new MoveFileRequest();
            request.setSourceFilePath(sourcePath);
            request.setDestinationPath(normalizedFolder + "/" + fileName);
            ImageKit.getInstance().moveFile(request);
            log.info("[IMAGEKIT MOVE] Moved fileId {} to {}", fileId, normalizedFolder);
        } catch (Exception e) {
            if (isNotFound(e)) {
                // File may already be deleted; no retry needed.
                log.info("[IMAGEKIT MOVE] File not found for move, treating as no-op. fileId={}", fileId);
                return;
            }
            throw new RuntimeException("Failed to move ImageKit fileId " + fileId + " to " + normalizedFolder, e);
        }
    }

    private boolean isNotFound(Exception e) {
        String className = e.getClass().getSimpleName();
        String message = e.getMessage();
        return "NotFoundException".equals(className) || (message != null && message.contains("404"));
    }
}
