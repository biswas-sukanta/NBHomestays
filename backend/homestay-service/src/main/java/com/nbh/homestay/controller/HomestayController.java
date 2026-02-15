package com.nbh.homestay.controller;

import com.nbh.homestay.model.Homestay;
import com.nbh.homestay.service.HomestayService;
import lombok.RequiredArgsConstructor;
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
    public Homestay createHomestay(@RequestBody Homestay homestay) {
        // In real app, extract Owner ID from Security Context
        homestay.setOwnerId("demo-owner");
        return homestayService.createHomestay(homestay);
    }

    @GetMapping("/search")
    public List<Homestay> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice) {
        return homestayService.search(q, minPrice, maxPrice);
    }

    @GetMapping("/{id}")
    public Homestay getHomestay(@PathVariable UUID id) {
        return homestayService.getHomestay(id);
    }
}
