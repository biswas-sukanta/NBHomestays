package com.nbh.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.ObjectCannedACL;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.net.URI;
import java.util.UUID;

/**
 * Uploads files to Supabase Storage using the S3-compatible API.
 *
 * Required env vars (set in Koyeb app config):
 * SUPABASE_S3_ENDPOINT e.g. https://<project>.supabase.co/storage/v1/s3
 * SUPABASE_S3_REGION e.g. ap-south-1
 * SUPABASE_ACCESS_KEY service_role key from Supabase dashboard → Settings → API
 * SUPABASE_SECRET_KEY same as access key for Supabase S3 compat
 * SUPABASE_BUCKET e.g. community-images
 * SUPABASE_PUBLIC_URL e.g.
 * https://<project>.supabase.co/storage/v1/object/public
 */
@Service
@RequiredArgsConstructor
public class UploadService {

    @Value("${SUPABASE_S3_ENDPOINT:}")
    private String s3Endpoint;

    @Value("${SUPABASE_S3_REGION:ap-south-1}")
    private String s3Region;

    @Value("${SUPABASE_ACCESS_KEY:}")
    private String accessKey;

    @Value("${SUPABASE_SECRET_KEY:}")
    private String secretKey;

    @Value("${SUPABASE_BUCKET:community-images}")
    private String bucket;

    @Value("${SUPABASE_PUBLIC_URL:}")
    private String publicBaseUrl;

    /**
     * Uploads a multipart file and returns the public URL.
     *
     * Falls back gracefully if env vars aren't set (returns a placeholder).
     */
    public String upload(MultipartFile file) throws IOException {
        if (s3Endpoint.isBlank() || accessKey.isBlank()) {
            // Fallback for dev: return a placeholder Unsplash URL
            return "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=800&q=80";
        }

        String key = "posts/" + UUID.randomUUID() + "_" + sanitize(file.getOriginalFilename());

        S3Client s3 = S3Client.builder()
                .endpointOverride(URI.create(s3Endpoint))
                .region(Region.of(s3Region))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)))
                .serviceConfiguration(sc -> sc.pathStyleAccessEnabled(true))
                .build();

        s3.putObject(
                PutObjectRequest.builder()
                        .bucket(bucket)
                        .key(key)
                        .contentType(file.getContentType())
                        .acl(ObjectCannedACL.PUBLIC_READ)
                        .build(),
                RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

        return publicBaseUrl + "/" + bucket + "/" + key;
    }

    private String sanitize(String filename) {
        if (filename == null)
            return "upload";
        return filename.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
