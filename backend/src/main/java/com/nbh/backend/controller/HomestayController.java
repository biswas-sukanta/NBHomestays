package com.nbh.backend.controller;

import com.nbh.backend.dto.HomestayDto;
import com.nbh.backend.service.HomestayService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import org.springframework.data.domain.Page;
import java.util.UUID;

@RestController
@RequestMapping("/api/homestays")
@RequiredArgsConstructor
public class HomestayController {

    private final HomestayService homestayService;

    @PostMapping
    public HomestayDto.Response createHomestay(@RequestBody HomestayDto.Request request,
            Authentication authentication) {
        // Extract owner email from Security Context
        String userEmail = authentication.getName();
        return homestayService.createHomestay(request, userEmail);
    }

    @GetMapping("/search")
    public Page<HomestayDto.Response> search(
            @RequestParam(value = "q", required = false) String q,
            @RequestParam(value = "tag", required = false) String tag,
            @RequestParam(value = "minPrice", required = false) BigDecimal minPrice,
            @RequestParam(value = "maxPrice", required = false) BigDecimal maxPrice,
            @RequestParam(value = "size", defaultValue = "20") int size,
            @RequestParam(value = "page", defaultValue = "0") int page) {
        return homestayService.searchHomestays(q, tag, size, page);
    }

    @GetMapping("/{id}")
    public org.springframework.http.ResponseEntity<HomestayDto.Response> getHomestay(@PathVariable("id") UUID id) {
        try {
            return org.springframework.http.ResponseEntity.ok(homestayService.getHomestay(id));
        } catch (org.springframework.web.server.ResponseStatusException e) {
            return org.springframework.http.ResponseEntity.status(e.getStatusCode()).build();
        }
    }

    @PutMapping("/{id}")
    public HomestayDto.Response updateHomestay(
            @PathVariable("id") UUID id,
            @RequestBody HomestayDto.Request request,
            Authentication authentication) {
        String userEmail = authentication.getName();
        return homestayService.updateHomestay(id, request, userEmail);
    }

    @DeleteMapping("/{id}")
    public void deleteHomestay(@PathVariable("id") UUID id, Authentication authentication) {
        String userEmail = authentication.getName();
        homestayService.deleteHomestay(id, userEmail);
    }

    @GetMapping("/my-listings")
    public List<HomestayDto.Response> getMyListings(Authentication authentication) {
        String userEmail = authentication.getName();
        return homestayService.getHomestaysByOwner(userEmail);
    }

    @GetMapping("/all")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public List<HomestayDto.Response> getAllHomestays() {
        return homestayService.getAllHomestays();
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public List<HomestayDto.Response> getPendingHomestays() {
        return homestayService.getPendingHomestays();
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public void approveHomestay(@PathVariable("id") UUID id) {
        homestayService.approveHomestay(id);
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public void rejectHomestay(@PathVariable("id") UUID id) {
        homestayService.rejectHomestay(id);
    }
}
