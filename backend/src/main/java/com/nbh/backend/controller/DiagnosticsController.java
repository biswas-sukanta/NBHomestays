package com.nbh.backend.controller;

import com.nbh.backend.service.InfrastructureDetailsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * Diagnostic probe to verify integrations are working in production.
 */
@RestController
@RequestMapping("/api/diagnostics")
@RequiredArgsConstructor
public class DiagnosticsController {

    private final InfrastructureDetailsService detailsService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> runDiagnostics() {
        Map<String, Object> report = new HashMap<>();
        report.put("redis", detailsService.checkRedis());
        report.put("supabase_s3", detailsService.checkS3());
        return ResponseEntity.ok(report);
    }
}
