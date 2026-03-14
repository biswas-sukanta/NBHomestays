package com.nbh.backend.controller;

import com.nbh.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/community")
@RequiredArgsConstructor
public class CommunityController {

    private final UserService userService;

    /**
     * Get top contributors by post count.
     * Independent of feed filters - always returns global top contributors.
     */
    @GetMapping("/top-contributors")
    public ResponseEntity<List<UserService.TopContributorDto>> getTopContributors(
            @RequestParam(value = "limit", defaultValue = "3") int limit) {
        return ResponseEntity.ok(userService.getTopContributors(limit));
    }
}
