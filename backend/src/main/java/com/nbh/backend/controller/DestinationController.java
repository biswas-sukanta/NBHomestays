package com.nbh.backend.controller;

import com.nbh.backend.dto.DestinationDto;
import com.nbh.backend.dto.HomestayDto;
import com.nbh.backend.service.DestinationService;
import com.nbh.backend.service.HomestayService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/destinations")
@RequiredArgsConstructor
public class DestinationController {

    private final DestinationService destinationService;
    private final HomestayService homestayService;

    @GetMapping
    public ResponseEntity<List<DestinationDto>> getAll() {
        return ResponseEntity.ok(destinationService.getAllDestinations());
    }

    @GetMapping("/{slug}")
    public ResponseEntity<DestinationDto> getBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(destinationService.getBySlug(slug));
    }

    @GetMapping("/{slug}/homestays")
    public ResponseEntity<Page<HomestayDto.Response>> getHomestays(
            @PathVariable String slug,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return ResponseEntity.ok(homestayService.getHomestaysByDestinationSlug(slug, PageRequest.of(page, size)));
    }
}
