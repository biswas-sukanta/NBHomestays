package com.nbh.backend.service;

import com.nbh.backend.model.MediaResource;

import io.imagekit.sdk.ImageKit;
import io.imagekit.sdk.models.FileCreateRequest;
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
        List<MediaResource> mediaResources = new ArrayList<>();

        if (files == null || files.isEmpty()) {
            return mediaResources;
        }

        for (MultipartFile file : files) {
            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null || originalFilename.isBlank()) {
                originalFilename = "upload_" + System.currentTimeMillis();
            }

            FileCreateRequest fileCreateRequest = new FileCreateRequest(file.getBytes(), originalFilename);
            fileCreateRequest.setFolder("/homestays");

            try {
                Result result = ImageKit.getInstance().upload(fileCreateRequest);
                String cdnUrl = result.getUrl();
                String fileId = result.getFileId();
                log.info("[IMAGEKIT UPLOAD] Successfully uploaded file. CDN URL: {} (File ID: {})", cdnUrl, fileId);
                mediaResources.add(MediaResource.builder().url(cdnUrl).fileId(fileId).build());
            } catch (Exception e) {
                log.error("[IMAGEKIT UPLOAD] FATAL ERROR: Failed to upload file {}", originalFilename, e);
                throw new IOException("Failed to upload file to ImageKit", e);
            }
        }

        return mediaResources;
    }

    public void deleteFile(String fileId) {
        if (fileId == null || fileId.isBlank()) {
            return;
        }
        try {
            Result result = ImageKit.getInstance().deleteFile(fileId);
            log.info("[IMAGEKIT DELETE] Successfully deleted fileId {}. Result: {}", fileId, result.toString());
        } catch (Exception e) {
            log.error("[IMAGEKIT DELETE] FATAL ERROR: Failed to delete fileId {}", fileId, e);
            // Non-blocking in case of external CDN failure
        }
    }
}
