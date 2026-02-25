package com.nbh.backend.controller;

import com.nbh.backend.dto.HostProfileDto;
import com.nbh.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/{id}/profile")
    public HostProfileDto getPublicProfile(@PathVariable("id") UUID id) {
        return userService.getHostProfile(id);
    }

    @PutMapping("/profile")
    public void updateProfile(@RequestBody Map<String, String> updates, Authentication authentication) {
        userService.updateProfile(authentication.getName(), updates);
    }
}
