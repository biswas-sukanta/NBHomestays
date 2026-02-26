package com.nbh.backend.runner;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

@Component
@Slf4j
public class S3DiagnosticRunner implements CommandLineRunner {

    private final S3Client s3Client;

    @Value("${SUPABASE_BUCKET:community-images}")
    private String s3Bucket;

    public S3DiagnosticRunner(S3Client s3Client) {
        this.s3Client = s3Client;
    }

    @Override
    public void run(String... args) {
        if (s3Client == null) {
            log.warn("[SUPABASE S3 DIAGNOSTIC] SKIPPED: S3Client is null");
            return;
        }

        try {
            log.info("[SUPABASE S3 DIAGNOSTIC] Attempting to test bucket access on bucket: {}", s3Bucket);
            HeadBucketRequest headBucketRequest = HeadBucketRequest.builder()
                    .bucket(s3Bucket)
                    .build();
            s3Client.headBucket(headBucketRequest);

            log.info("[SUPABASE S3 DIAGNOSTIC] SUCCESS: Connected to Supabase and verified access to bucket: {}",
                    s3Bucket);
        } catch (S3Exception e) {
            log.error(
                    "[SUPABASE S3 DIAGNOSTIC] FATAL ERROR: Supabase S3 connection failed (S3Exception). Message: {}, HTTP Status: {}, AWS Error Code: {}",
                    e.getMessage(), e.statusCode(), e.awsErrorDetails().errorCode(), e);
        } catch (Exception e) {
            log.error("[SUPABASE S3 DIAGNOSTIC] FATAL ERROR: Initializing S3 connection failed (General Exception): {}",
                    e.getMessage(), e);
        }
    }
}
