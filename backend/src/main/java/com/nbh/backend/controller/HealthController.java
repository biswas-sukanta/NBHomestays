package com.nbh.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    @GetMapping("/ping")
    public ResponseEntity<String> ping() {
        // Extremely lightweight response. No DB calls. No heavy logic.
        return ResponseEntity.ok("pong");
    }
}
