package com.nbh.backend.dto;

import com.nbh.backend.model.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class AuthDto {

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class RegisterRequest {
        @NotBlank(message = "First name is mandatory")
        private String firstname;

        @NotBlank(message = "Last name is mandatory")
        private String lastname;

        @NotBlank(message = "Email is mandatory")
        @Email(message = "Email should be valid")
        private String email;

        @NotBlank(message = "Password is mandatory")
        @Size(min = 6, message = "Password must be at least 6 characters")
        private String password;

        private User.Role role;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class AuthenticationRequest {
        @NotBlank(message = "Email is mandatory")
        @Email(message = "Email should be valid")
        private String email;

        @NotBlank(message = "Password is mandatory")
        private String password;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class AuthenticationResponse {
        private String accessToken;
        private String refreshToken; // Simplified for now
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class RefreshTokenRequest {
        @NotBlank(message = "Refresh token is mandatory")
        private String refreshToken;
    }
}
