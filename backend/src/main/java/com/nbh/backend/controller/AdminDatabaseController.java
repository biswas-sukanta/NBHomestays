package com.nbh.backend.controller;

import com.nbh.backend.service.HomestaySeederService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/database")
@RequiredArgsConstructor
@Slf4j
public class AdminDatabaseController {

    private final HomestaySeederService homestaySeederService;

    @PostMapping("/seed")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Map<String, String>> seedDatabase() {
        log.info("Received request to seed database...");
        try {
            homestaySeederService.seedHomestays();
            return ResponseEntity.ok(Map.of("message", "Database wiped and seeded with hyper-realistic homestays."));
        } catch (Exception e) {
            log.error("Failed to seed database.", e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}
