package com.nbh.backend.controller;

import com.nbh.backend.service.AdminDataService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/homestays")
@RequiredArgsConstructor
@Slf4j
public class AdminDataController {

    private final AdminDataService adminDataService;
    private final com.nbh.backend.service.PostService postService;

    @DeleteMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> deleteHomestays(
            @RequestParam(name = "limit", defaultValue = "1") int limit) {
        try {
            int deleted = adminDataService.deleteHomestays(limit);
            return ResponseEntity.ok(
                    Map.of("success", true, "deletedCount", deleted, "message", "Deleted " + deleted + " records."));
        } catch (Exception e) {
            log.error("Failed to delete homestays", e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/all")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> deleteAllHomestays(
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails) {
        log.info("REST: DELETE /api/admin/homestays/all - Entry (by {})", userDetails.getUsername());
        try {
            postService.wipeAllPosts(userDetails.getUsername());
            log.info("REST: DELETE /api/admin/homestays/all - Success return");
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            log.error("REST: DELETE /api/admin/homestays/all - ERROR", e);
            throw e; 
        }
    }

    @PostMapping("/seed")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> seedHomestays(
            @RequestParam(name = "count", defaultValue = "5") int count) {
        try {
            int inserted = adminDataService.seedHomestays(count);
            return ResponseEntity.ok(Map.of("success", true, "insertedCount", inserted, "message",
                    "Successfully seeded " + inserted + " records."));
        } catch (Exception e) {
            log.error("Failed to seed homestays", e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// POST DATA MANAGEMENT CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════

@RestController
@RequestMapping("/api/admin/posts")
@RequiredArgsConstructor
@Slf4j
class AdminPostDataController {

    private final AdminDataService adminDataService;

    @PostMapping("/seed")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> seedPosts(
            @RequestParam(name = "count", defaultValue = "5") int count) {
        try {
            int inserted = adminDataService.seedPosts(count);
            return ResponseEntity.ok(Map.of("success", true, "insertedCount", inserted, "message",
                    "Successfully seeded " + inserted + " posts."));
        } catch (Exception e) {
            log.error("Failed to seed posts", e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}
