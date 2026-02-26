package com.nbh.backend.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

import java.net.URI;

@Configuration
public class S3Config {

        private static final Logger log = LoggerFactory.getLogger(S3Config.class);

        @Value("${SUPABASE_S3_ENDPOINT}")
        private String s3Endpoint;

        @Value("${SUPABASE_S3_REGION:us-east-1}")
        private String s3Region;

        @Value("${SUPABASE_ACCESS_KEY}")
        private String accessKey;

        @Value("${SUPABASE_SECRET_KEY}")
        private String secretKey;

        @Value("${SUPABASE_BUCKET:community-images}")
        private String s3Bucket;

        @Bean
        public S3Client s3Client() {
                if (s3Endpoint == null || s3Endpoint.isBlank() || accessKey.isBlank()) {
                        // Return a dummy client to satisfy autowiring during local dev where AWS is
                        // unset
                        return S3Client.builder()
                                        .region(Region.US_EAST_1)
                                        .credentialsProvider(StaticCredentialsProvider.create(
                                                        AwsBasicCredentials.create("dummy-access-key",
                                                                        "dummy-secret-key")))
                                        .build();
                }

                // SUPABASE S3 Proxy compatibility: Force us-east-1 for the signing region
                // even if the database is in another region.
                String region = (s3Region == null || s3Region.isBlank()) ? "us-east-1" : s3Region.trim();

                return S3Client.builder()
                                .endpointOverride(URI.create(s3Endpoint.trim()))
                                .region(Region.of(region))
                                .credentialsProvider(StaticCredentialsProvider.create(
                                                AwsBasicCredentials.create(accessKey.trim(), secretKey.trim())))
                                .serviceConfiguration(S3Configuration.builder()
                                                .pathStyleAccessEnabled(true)
                                                .build())
                                .httpClientBuilder(UrlConnectionHttpClient.builder())
                                .build();
        }

        @PostConstruct
        public void startupDiagnostic() {
                if (s3Endpoint == null || s3Endpoint.isBlank() || accessKey.isBlank()) {
                        log.warn("[SUPABASE S3 DIAGNOSTIC] SKIPPED: Missing environment variables.");
                        return;
                }

                S3Client client = s3Client();
                try {
                        log.info("[SUPABASE S3 DIAGNOSTIC] Attempting to test bucket access on bucket: {} at {}",
                                        s3Bucket, s3Endpoint);
                        HeadBucketRequest headBucketRequest = HeadBucketRequest.builder()
                                        .bucket(s3Bucket)
                                        .build();
                        client.headBucket(headBucketRequest);

                        log.info("[SUPABASE S3 DIAGNOSTIC] SUCCESS: Connected to Supabase and verified access to bucket: {}",
                                        s3Bucket);
                } catch (S3Exception e) {
                        log.error("[SUPABASE S3 DIAGNOSTIC] FATAL ERROR: Supabase S3 connection failed (S3Exception). Message: {}, HTTP Status: {}, AWS Error Code: {}",
                                        e.getMessage(), e.statusCode(), e.awsErrorDetails().errorCode(), e);
                } catch (Exception e) {
                        log.error("[SUPABASE S3 DIAGNOSTIC] FATAL ERROR: Initializing S3 connection failed (General Exception): {}",
                                        e.getMessage(), e);
                }
        }
}
