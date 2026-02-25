package com.nbh.backend.controller;

import com.nbh.backend.model.Homestay;
import com.nbh.backend.model.User;
import com.nbh.backend.service.TripBoardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/saves")
@RequiredArgsConstructor
public class TripBoardController {

    private final TripBoardService tripBoardService;

    /** Get saved homestay IDs for the authenticated user (lightweight sync). */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<UUID>> getSavedIds(
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(tripBoardService.getSavedHomestayIds(currentUser.getId()));
    }

    /** Toggle save/unsave. Returns { saved: bool }. */
    @PostMapping("/{homestayId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Boolean>> toggleSave(
            @PathVariable("homestayId") UUID homestayId,
            @AuthenticationPrincipal User currentUser) {
        boolean saved = tripBoardService.toggleSave(homestayId, currentUser.getId());
        return ResponseEntity.ok(Map.of("saved", saved));
    }

    /** Get check if a single homestay is saved. */
    @GetMapping("/{homestayId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Boolean>> isSaved(
            @PathVariable("homestayId") UUID homestayId,
            @AuthenticationPrincipal User currentUser) {
        boolean saved = tripBoardService.isSaved(homestayId, currentUser.getId());
        return ResponseEntity.ok(Map.of("saved", saved));
    }

    /** Full homestay objects for Trip Board display. */
    @GetMapping("/homestays")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<com.nbh.backend.dto.HomestayDto.Response>> getSavedHomestays(
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(tripBoardService.getSavedHomestays(currentUser.getId()));
    }
}
