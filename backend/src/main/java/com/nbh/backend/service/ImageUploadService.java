package com.nbh.backend.service;

import com.nbh.backend.model.MediaResource;

import io.imagekit.sdk.ImageKit;
import io.imagekit.sdk.models.GetFileListRequest;
import io.imagekit.sdk.models.FileCreateRequest;
import io.imagekit.sdk.models.MoveFileRequest;
import io.imagekit.sdk.models.results.Result;
import io.imagekit.sdk.models.results.ResultList;
import lombok.RequiredArgsConstructor;
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
@RequiredArgsConstructor
public class ImageUploadService {

    private final MediaUploadTrackingService mediaUploadTrackingService;

    @Value("${imagekit.max-file-size-bytes:5242880}")
    private long maxFileSizeBytes;

    @Value("${imagekit.allowed-content-types:image/jpeg,image/png,image/webp}")
    private String allowedContentTypesConfig;

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
        List<String> uploadedFileIds = new ArrayList<>(); // Track for rollback

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

        try {
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
                    uploadedFileIds.add(fileId); // Track for potential rollback
                    // Track for orphan detection
                    mediaUploadTrackingService.recordPendingUpload(fileId, cdnUrl);
                } catch (Exception e) {
                    log.error("[IMAGEKIT UPLOAD] FATAL ERROR: Failed to upload file {}", originalFilename, e);
                    // Compensating transaction: delete already uploaded files
                    rollbackUploads(uploadedFileIds);
                    throw new IOException("Failed to upload file to ImageKit", e);
                }
            }
        } catch (IOException e) {
            throw e;
        }

        return mediaResources;
    }

    /**
     * Compensating transaction to clean up orphaned files when batch upload fails.
     */
    private void rollbackUploads(List<String> uploadedFileIds) {
        if (uploadedFileIds == null || uploadedFileIds.isEmpty()) {
            return;
        }
        log.warn("[IMAGEKIT ROLLBACK] Cleaning up {} orphaned files due to batch upload failure", uploadedFileIds.size());
        for (String fileId : uploadedFileIds) {
            try {
                deleteFileById(fileId);
                log.info("[IMAGEKIT ROLLBACK] Deleted orphaned file: {}", fileId);
            } catch (Exception e) {
                log.error("[IMAGEKIT ROLLBACK] Failed to delete orphaned file {}: {}", fileId, e.getMessage());
            }
        }
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
        String normalizedFolder = folder.trim().replace('\\', '/');
        while (normalizedFolder.startsWith("/")) {
            normalizedFolder = normalizedFolder.substring(1);
        }
        while (normalizedFolder.endsWith("/")) {
            normalizedFolder = normalizedFolder.substring(0, normalizedFolder.length() - 1);
        }
        if (normalizedFolder.isBlank()) {
            return;
        }
        String sourceFolderPrefix = "/" + normalizedFolder + "/";

        try {
            Result details = ImageKit.getInstance().getFileDetail(fileId);
            String sourcePath = details.getFilePath();
            if (sourcePath == null || sourcePath.isBlank()) {
                return;
            }
            if (sourcePath.startsWith(sourceFolderPrefix)) {
                return;
            }

            MoveFileRequest request = new MoveFileRequest();
            request.setSourceFilePath(sourcePath);
            request.setDestinationPath(normalizedFolder);
            ImageKit.getInstance().moveFile(request);
            log.info("[IMAGEKIT MOVE] Moved fileId {} to /{}", fileId, normalizedFolder);
        } catch (Exception e) {
            if (isNotFound(e)) {
                // File may already be deleted; no retry needed.
                log.info("[IMAGEKIT MOVE] File not found for move, treating as no-op. fileId={}", fileId);
                return;
            }
            if (isRecoverableMoveFailure(e)) {
                log.warn("[IMAGEKIT MOVE] Recoverable move failure for fileId {} to /{}: {}", fileId, normalizedFolder,
                        e.getMessage());
                return;
            }
            throw new RuntimeException("Failed to move ImageKit fileId " + fileId + " to /" + normalizedFolder, e);
        }
    }

    private boolean isNotFound(Exception e) {
        String className = e.getClass().getSimpleName();
        String message = e.getMessage();
        return "NotFoundException".equals(className) || (message != null && message.contains("404"));
    }

    private boolean isRecoverableMoveFailure(Exception e) {
        String message = e.getMessage();
        if (message == null || message.isBlank()) {
            return false;
        }

        return message.contains("Versions Limit Exceeded");
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Empty file");
        }

        String contentType = file.getContentType();
        Set<String> allowedTypes = Set.of(allowedContentTypesConfig.split(","));
        if (contentType == null || !allowedTypes.contains(contentType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                    "Unsupported image type. Allowed: " + allowedContentTypesConfig);
        }

        long size = file.getSize();
        if (size > maxFileSizeBytes) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                    "Each image must be under " + (maxFileSizeBytes / (1024 * 1024)) + "MB");
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

    /**
     * Upload a local file from filesystem to ImageKit.
     * Used for seeding operations where we upload static assets to CDN.
     * 
     * @param localPath Absolute path to the local file
     * @param folder ImageKit folder to upload to (e.g., "/seed-images")
     * @return MediaResource with CDN URL and fileId
     */
    public MediaResource uploadLocalFile(String localPath, String folder) throws IOException {
        if (imageKitPublicKey == null || imageKitPublicKey.isBlank()
                || imageKitPrivateKey == null || imageKitPrivateKey.isBlank()
                || imageKitUrlEndpoint == null || imageKitUrlEndpoint.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Image upload service not configured");
        }

        java.io.File file = new java.io.File(localPath);
        if (!file.exists()) {
            throw new IOException("Local file not found: " + localPath);
        }

        String fileName = file.getName();
        String resolvedFolder = (folder == null || folder.isBlank()) ? "/uploads" : folder;
        if (!resolvedFolder.startsWith("/")) {
            resolvedFolder = "/" + resolvedFolder;
        }

        byte[] fileBytes = java.nio.file.Files.readAllBytes(file.toPath());
        
        FileCreateRequest fileCreateRequest = new FileCreateRequest(fileBytes, fileName);
        fileCreateRequest.setFolder(resolvedFolder);

        try {
            Result result = ImageKit.getInstance().upload(fileCreateRequest);
            String cdnUrl = optimizeImageKitUrl(result.getUrl());
            String fileId = result.getFileId();
            log.info("[IMAGEKIT UPLOAD LOCAL] Successfully uploaded {} to {}. CDN URL: {} (File ID: {})",
                    localPath, resolvedFolder, cdnUrl, fileId);
            return MediaResource.builder().url(cdnUrl).fileId(fileId).build();
        } catch (Exception e) {
            log.error("[IMAGEKIT UPLOAD LOCAL] Failed to upload local file {}", localPath, e);
            throw new IOException("Failed to upload local file to ImageKit: " + localPath, e);
        }
    }

    /**
     * Upload multiple local files to ImageKit and return MediaResources.
     * 
     * @param localPaths List of absolute paths to local files
     * @param folder ImageKit folder to upload to
     * @return List of MediaResources with CDN URLs
     */
    public List<MediaResource> uploadLocalFiles(List<String> localPaths, String folder) throws IOException {
        List<MediaResource> results = new ArrayList<>();
        for (String path : localPaths) {
            try {
                results.add(uploadLocalFile(path, folder));
            } catch (IOException e) {
                log.warn("[IMAGEKIT UPLOAD LOCAL] Skipping failed file: {}", path);
            }
        }
        return results;
    }

    /**
     * Upload raw bytes to ImageKit. Used for seeding from classpath resources.
     * 
     * @param bytes Image file bytes
     * @param fileName Name for the file in ImageKit
     * @param folder ImageKit folder to upload to
     * @return MediaResource with CDN URL and fileId
     */
    public MediaResource uploadBytes(byte[] bytes, String fileName, String folder) throws IOException {
        if (imageKitPublicKey == null || imageKitPublicKey.isBlank()
                || imageKitPrivateKey == null || imageKitPrivateKey.isBlank()
                || imageKitUrlEndpoint == null || imageKitUrlEndpoint.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Image upload service not configured");
        }

        String resolvedFolder = (folder == null || folder.isBlank()) ? "/uploads" : folder;
        if (!resolvedFolder.startsWith("/")) {
            resolvedFolder = "/" + resolvedFolder;
        }

        FileCreateRequest fileCreateRequest = new FileCreateRequest(bytes, fileName);
        fileCreateRequest.setFolder(resolvedFolder);

        try {
            Result result = ImageKit.getInstance().upload(fileCreateRequest);
            String cdnUrl = optimizeImageKitUrl(result.getUrl());
            String fileId = result.getFileId();
            log.info("[IMAGEKIT UPLOAD BYTES] Successfully uploaded {} to {}. CDN URL: {} (File ID: {})",
                    fileName, resolvedFolder, cdnUrl, fileId);
            return MediaResource.builder().url(cdnUrl).fileId(fileId).build();
        } catch (Exception e) {
            log.error("[IMAGEKIT UPLOAD BYTES] Failed to upload bytes for {}", fileName, e);
            throw new IOException("Failed to upload bytes to ImageKit: " + fileName, e);
        }
    }
}
