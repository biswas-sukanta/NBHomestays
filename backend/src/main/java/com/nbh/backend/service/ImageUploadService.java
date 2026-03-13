package com.nbh.backend.service;

import com.nbh.backend.model.MediaResource;

import io.imagekit.sdk.ImageKit;
import io.imagekit.sdk.models.GetFileListRequest;
import io.imagekit.sdk.models.FileCreateRequest;
import io.imagekit.sdk.models.MoveFileRequest;
import io.imagekit.sdk.models.results.Result;
import io.imagekit.sdk.models.results.ResultList;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
@Slf4j
public class ImageUploadService {

    private static final long MAX_FILE_SIZE_BYTES = 5L * 1024 * 1024;
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );

    @Value("${IMAGEKIT_PUBLIC_KEY:}")
    private String imageKitPublicKey;

    @Value("${IMAGEKIT_PRIVATE_KEY:}")
    private String imageKitPrivateKey;

    @Value("${IMAGEKIT_URL_ENDPOINT:}")
    private String imageKitUrlEndpoint;

    public List<MediaResource> uploadFiles(List<MultipartFile> files) throws IOException {
        return uploadFiles(files, "/uploads");
    }

    public List<String> listFileIdsOlderThan(String folder, OffsetDateTime cutoff) {
        if (folder == null || folder.isBlank() || cutoff == null) {
            return List.of();
        }

        String normalizedFolder = folder.startsWith("/") ? folder : "/" + folder;
        String cutoffUtc = cutoff.withOffsetSameInstant(ZoneOffset.UTC)
                .format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);

        try {
            GetFileListRequest request = new GetFileListRequest();
            request.setSearchQuery("path = '" + normalizedFolder + "' AND createdAt < '" + cutoffUtc + "'");
            request.setLimit("100");
            request.setSkip("0");

            ResultList resultList = ImageKit.getInstance().getFileList(request);
            if (resultList == null || resultList.getResults() == null) {
                return List.of();
            }
            return resultList.getResults().stream()
                    .map(r -> {
                        try {
                            // SDK returns BaseFile (not a Map). Prefer getter.
                            java.lang.reflect.Method m = r.getClass().getMethod("getFileId");
                            Object val = m.invoke(r);
                            return val == null ? null : val.toString();
                        } catch (Exception ignored) {
                            return null;
                        }
                    })
                    .filter(id -> id != null && !id.isBlank())
                    .distinct()
                    .toList();
        } catch (Exception e) {
            log.error("[IMAGEKIT LIST] Failed to list files for folder={} cutoff={}", normalizedFolder, cutoffUtc, e);
            return List.of();
        }
    }

    public List<MediaResource> uploadFiles(List<MultipartFile> files, String folder) throws IOException {
        List<MediaResource> mediaResources = new ArrayList<>();

        if (files == null || files.isEmpty()) {
            return mediaResources;
        }

        if (imageKitPublicKey == null || imageKitPublicKey.isBlank()
                || imageKitPrivateKey == null || imageKitPrivateKey.isBlank()
                || imageKitUrlEndpoint == null || imageKitUrlEndpoint.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Image upload service not configured");
        }

        String resolvedFolder = (folder == null || folder.isBlank()) ? "/uploads" : folder;
        if (!resolvedFolder.startsWith("/")) {
            resolvedFolder = "/" + resolvedFolder;
        }

        for (MultipartFile file : files) {
            validateFile(file);
            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null || originalFilename.isBlank()) {
                originalFilename = "upload_" + System.currentTimeMillis();
            }

            FileCreateRequest fileCreateRequest = new FileCreateRequest(file.getBytes(), originalFilename);
            fileCreateRequest.setFolder(resolvedFolder);

            try {
                Result result = ImageKit.getInstance().upload(fileCreateRequest);
                String cdnUrl = optimizeImageKitUrl(result.getUrl());
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

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Empty file");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported image type");
        }

        long size = file.getSize();
        if (size > MAX_FILE_SIZE_BYTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Each image must be under 5MB");
        }
    }

    private String optimizeImageKitUrl(String url) {
        if (url == null || url.isBlank()) {
            return url;
        }
        String transform = "tr=f-auto,q-80,w-1200";
        if (url.contains("tr=")) {
            return url;
        }
        return url.contains("?") ? (url + "&" + transform) : (url + "?" + transform);
    }
}
