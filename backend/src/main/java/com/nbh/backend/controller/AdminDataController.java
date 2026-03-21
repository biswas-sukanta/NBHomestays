package com.nbh.backend.controller;

import com.nbh.backend.dto.HomestayDto;
import com.nbh.backend.model.Homestay;
import com.nbh.backend.service.HomestayService;
import com.nbh.backend.service.AdminDataService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
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
    private final HomestayService homestayService;

    @GetMapping("/all")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<java.util.List<HomestayDto.Response>> getAllHomestays() {
        return ResponseEntity.ok(homestayService.getAllHomestays());
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<java.util.List<HomestayDto.Response>> getPendingHomestays() {
        return ResponseEntity.ok(homestayService.getPendingHomestays(
                org.springframework.data.domain.Pageable.unpaged()).getContent());
    }

    @GetMapping("/approved")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<java.util.List<HomestayDto.Response>> getApprovedHomestays() {
        return ResponseEntity.ok(homestayService.getHomestaysByStatus(Homestay.Status.APPROVED));
    }

    @DeleteMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> deleteHomestays(
            @RequestParam(name = "limit", defaultValue = "1") int limit) {
        if (limit <= 0) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "deletedCount", 0,
                    "error", "limit must be greater than 0"));
        }
        try {
            int deleted = adminDataService.deleteHomestays(limit);
            return ResponseEntity.ok(
                    Map.of("success", true, "deletedCount", deleted, "message", "Deleted " + deleted + " records."));
        } catch (Exception e) {
            log.error("Failed to delete homestays", e);
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(Map.of(
                    "success", false,
                    "deletedCount", 0,
                    "error", "Failed to delete homestays"));
        }
    }

    @DeleteMapping("/all")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> deleteAllHomestays(
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails) {
        String actor = userDetails != null ? userDetails.getUsername() : "unknown-admin";
        log.info("REST: DELETE /api/admin/homestays/all - Entry (by {})", actor);
        try {
            adminDataService.deleteAllHomestays();
            log.info("REST: DELETE /api/admin/homestays/all - Success return");
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            log.error("REST: DELETE /api/admin/homestays/all - ERROR", e);
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(Map.of(
                    "success", false,
                    "error", "Failed to delete all homestays"));
        }
    }

    @PostMapping("/seed")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> seedHomestays(
            @RequestParam(name = "count", defaultValue = "5") int count) {
        if (count <= 0) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "insertedCount", 0,
                    "error", "count must be greater than 0"));
        }
        try {
            int inserted = adminDataService.seedHomestays(count);
            return ResponseEntity.ok(Map.of("success", true, "insertedCount", inserted, "message",
                    "Successfully seeded " + inserted + " records."));
        } catch (Exception e) {
            log.error("Failed to seed homestays", e);
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(Map.of(
                    "success", false,
                    "insertedCount", 0,
                    "error", "Failed to seed homestays"));
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
        if (count <= 0) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "insertedCount", 0,
                    "error", "count must be greater than 0"));
        }
        try {
            int inserted = adminDataService.seedPosts(count);
            return ResponseEntity.ok(Map.of("success", true, "insertedCount", inserted, "message",
                    "Successfully seeded " + inserted + " posts."));
        } catch (Exception e) {
            log.error("Failed to seed posts", e);
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(Map.of(
                    "success", false,
                    "insertedCount", 0,
                    "error", "Failed to seed posts"));
        }
    }
}
