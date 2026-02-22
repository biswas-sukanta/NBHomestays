package com.nbh.backend.config;

import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Response;

import java.net.URI;

public class S3Test {
    public static void main(String[] args) {
        String accessKeyRef = "qedomjhuepcbjjpskvoq";
        String secretKeyJWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlZG9tamh1ZXBjYmpqcHNrdm9xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE3MzMwNSwiZXhwIjoyMDg2NzQ5MzA1fQ.-IhUptc7E7xqO6jeNDFfz1gzCMiW2lv2o1agrfNVzuQ";
        String secretKeyHex = "6ee07c2a1eecd11febe1c416afb13b8d";
        String endpoint = "https://qedomjhuepcbjjpskvoq.supabase.co/storage/v1/s3";
        String bucket = "community-images";

        System.out.println("Testing S3 Connectivity with various configurations...");

        test(accessKeyRef, secretKeyJWT, endpoint, bucket, "ap-south-1", "Ref + JWT + ap-south-1");
        test(accessKeyRef, secretKeyJWT, endpoint, bucket, "us-east-1", "Ref + JWT + us-east-1");
        test(accessKeyRef, secretKeyHex, endpoint, bucket, "ap-south-1", "Ref + Hex + ap-south-1");
        test("5f1b61ebedaabcfcc1202fd7827470d0910e27b8ec37b71b74bce7f71ec95fe9", secretKeyHex, endpoint, bucket,
                "ap-south-1", "LongHex + Hex + ap-south-1");
    }

    private static void test(String access, String secret, String ep, String b, String r, String label) {
        System.out.println("\n--- Testing: " + label + " (Region: " + r + ") ---");
        try (S3Client s3 = S3Client.builder()
                .endpointOverride(URI.create(ep))
                .region(Region.of(r))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(access, secret)))
                .serviceConfiguration(S3Configuration.builder()
                        .pathStyleAccessEnabled(true)
                        .build())
                .build()) {

            ListObjectsV2Response res = s3.listObjectsV2(ListObjectsV2Request.builder()
                    .bucket(b).maxKeys(1).build());

            System.out.println("SUCCESS: Found " + res.keyCount() + " objects.");
        } catch (Exception e) {
            System.err.println("FAILED: " + e.getMessage());
        }
    }
}
