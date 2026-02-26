package com.nbh.backend.controller;

import com.nbh.backend.service.InfrastructureDetailsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
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
        report.put("imageKit", detailsService.checkImageKit());
        return ResponseEntity.ok(report);
    }

    @DeleteMapping("/cache")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Map<String, String>> clearCache() {
        detailsService.clearAllCaches();
        return ResponseEntity.ok(Map.of("message", "All caches cleared successfully"));
    }
}
