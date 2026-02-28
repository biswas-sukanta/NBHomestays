package com.nbh.backend.controller;

import com.nbh.backend.model.MediaResource;

import com.nbh.backend.service.ImageUploadService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/images")
@RequiredArgsConstructor
public class ImageController {

    private final ImageUploadService imageUploadService;

    @PostMapping(value = "/upload-multiple", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<MediaResource>> uploadImages(@RequestPart("files") List<MultipartFile> files) {
        try {
            if (files == null || files.isEmpty() || files.size() > 10) {
                return ResponseEntity.badRequest().build();
            }
            List<MediaResource> urls = imageUploadService.uploadFiles(files);
            return ResponseEntity.ok(urls);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
