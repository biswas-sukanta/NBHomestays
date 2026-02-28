package com.nbh.backend.service;

import com.nbh.backend.dto.AuthDto;
import com.nbh.backend.model.User;
import com.nbh.backend.repository.UserRepository;
import com.nbh.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

        private final UserRepository repository;
        private final PasswordEncoder passwordEncoder;
        private final JwtService jwtService;
        private final AuthenticationManager authenticationManager;

        public AuthDto.AuthenticationResponse register(AuthDto.RegisterRequest request) {
                var user = User.builder()
                                .firstName(request.getFirstname())
                                .lastName(request.getLastname())
                                .email(request.getEmail())
                                .password(passwordEncoder.encode(request.getPassword()))
                                .role(request.getRole() != null ? request.getRole() : User.Role.ROLE_USER)
                                .enabled(true)
                                .build();
                if (repository.findByEmail(request.getEmail()).isPresent()) {
                        throw new RuntimeException("User already exists with email: " + request.getEmail());
                }
                repository.save(user);
                var jwtToken = jwtService.generateToken(java.util.Map.of(
                                "role", user.getRole().name(),
                                "userId", user.getId().toString()), user);
                return AuthDto.AuthenticationResponse.builder()
                                .accessToken(jwtToken)
                                .build();
        }

        public AuthDto.AuthenticationResponse authenticate(AuthDto.AuthenticationRequest request) {
                authenticationManager.authenticate(
                                new UsernamePasswordAuthenticationToken(
                                                request.getEmail(),
                                                request.getPassword()));
                var user = repository.findByEmail(request.getEmail())
                                .orElseThrow();
                var jwtToken = jwtService.generateToken(java.util.Map.of(
                                "role", user.getRole().name(),
                                "userId", user.getId().toString()), user);
                return AuthDto.AuthenticationResponse.builder()
                                .accessToken(jwtToken)
                                .build();
        }
}
