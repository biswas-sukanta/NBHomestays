package com.nbh.backend.controller;

import com.nbh.backend.dto.AuthDto;
import com.nbh.backend.service.AuthenticationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationService service;

    @PostMapping("/register")
    public ResponseEntity<AuthDto.AuthenticationResponse> register(
            @Valid @RequestBody AuthDto.RegisterRequest request) {
        return ResponseEntity.ok(service.register(request));
    }

    @PostMapping("/authenticate")
    public ResponseEntity<AuthDto.AuthenticationResponse> authenticate(
            @Valid @RequestBody AuthDto.AuthenticationRequest request) {
        return ResponseEntity.ok(service.authenticate(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthDto.AuthenticationResponse> login(
            @Valid @RequestBody AuthDto.AuthenticationRequest request) {
        return ResponseEntity.ok(service.authenticate(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthDto.AuthenticationResponse> refresh(
            @Valid @RequestBody AuthDto.RefreshTokenRequest request) {
        return ResponseEntity.ok(service.refreshToken(request.getRefreshToken()));
    }
}
