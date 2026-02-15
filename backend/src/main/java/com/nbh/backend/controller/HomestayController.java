package com.nbh.backend.controller;

import com.nbh.backend.dto.HomestayDto;
import com.nbh.backend.service.HomestayService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
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
    public List<HomestayDto.Response> search(
            @RequestParam(value = "q", required = false) String q,
            @RequestParam(value = "minPrice", required = false) BigDecimal minPrice,
            @RequestParam(value = "maxPrice", required = false) BigDecimal maxPrice) {
        return homestayService.searchHomestays(q);
    }

    @GetMapping("/{id}")
    public HomestayDto.Response getHomestay(@PathVariable("id") UUID id) {
        return homestayService.getHomestay(id);
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
    @PreAuthorize("hasRole('ADMIN')")
    public List<HomestayDto.Response> getAllHomestays() {
        return homestayService.getAllHomestays();
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public List<HomestayDto.Response> getPendingHomestays() {
        return homestayService.getPendingHomestays();
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public void approveHomestay(@PathVariable("id") UUID id) {
        homestayService.approveHomestay(id);
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public void rejectHomestay(@PathVariable("id") UUID id) {
        homestayService.rejectHomestay(id);
    }
}
