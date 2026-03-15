package com.nbh.backend.controller;

import com.nbh.backend.model.MediaResource;

import com.nbh.backend.service.ImageUploadService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/images")
@RequiredArgsConstructor
public class ImageController {

    private final ImageUploadService imageUploadService;

    @PostMapping(value = "/upload-multiple", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<MediaResource>> uploadImages(@RequestPart("files") List<MultipartFile> files) {
        try {
            if (files == null || files.isEmpty() || files.size() > 5) {
                return ResponseEntity.badRequest().build();
            }
            List<MediaResource> urls = imageUploadService.uploadFiles(files);
            return ResponseEntity.ok(urls);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Rollback endpoint: Delete uploaded media files when post creation fails.
     * This prevents orphaned files in ImageKit when the frontend post submission fails.
     */
    @DeleteMapping("/rollback")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> rollbackMedia(@RequestBody List<String> fileIds) {
        if (fileIds == null || fileIds.isEmpty()) {
            return ResponseEntity.ok(Map.of("deleted", 0, "message", "No fileIds provided"));
        }

        int deleted = 0;
        int failed = 0;
        for (String fileId : fileIds) {
            try {
                imageUploadService.deleteFileById(fileId);
                deleted++;
            } catch (Exception e) {
                failed++;
            }
        }

        return ResponseEntity.ok(Map.of(
                "deleted", deleted,
                "failed", failed,
                "total", fileIds.size()
        ));
    }
}
