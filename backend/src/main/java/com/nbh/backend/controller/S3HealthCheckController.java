package com.nbh.backend.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Client;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/health")
@RequiredArgsConstructor
@Slf4j
public class S3HealthCheckController {

    private final S3Client s3Client;

    @Value("${SUPABASE_S3_ENDPOINT:}")
    private String s3Endpoint;

    @GetMapping("/s3")
    public ResponseEntity<Map<String, String>> checkS3Health() {
        Map<String, String> response = new HashMap<>();
        try {
            s3Client.listBuckets();
            response.put("status", "connected");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "failed");
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}
