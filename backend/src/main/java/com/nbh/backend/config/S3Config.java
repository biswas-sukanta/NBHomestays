package com.nbh.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;

import java.net.URI;

@Configuration
public class S3Config {

    @Value("${SUPABASE_S3_ENDPOINT:}")
    private String s3Endpoint;

    @Value("${SUPABASE_S3_REGION:us-east-1}")
    private String s3Region;

    @Value("${SUPABASE_ACCESS_KEY:}")
    private String accessKey;

    @Value("${SUPABASE_SECRET_KEY:}")
    private String secretKey;

    @Bean
    public S3Client s3Client() {
        if (s3Endpoint == null || s3Endpoint.isBlank() || accessKey.isBlank()) {
            return null;
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
                .build();
    }
}
