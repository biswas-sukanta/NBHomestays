package com.nbh.backend.service;

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

    public List<String> uploadFiles(List<MultipartFile> files) throws IOException {
        List<String> urls = new ArrayList<>();

        if (files == null || files.isEmpty()) {
            return urls;
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
                log.info("[IMAGEKIT UPLOAD] Successfully uploaded file. CDN URL: {}", cdnUrl);
                urls.add(cdnUrl);
            } catch (Exception e) {
                log.error("[IMAGEKIT UPLOAD] FATAL ERROR: Failed to upload file {}", originalFilename, e);
                throw new IOException("Failed to upload file to ImageKit", e);
            }
        }

        return urls;
    }
}
