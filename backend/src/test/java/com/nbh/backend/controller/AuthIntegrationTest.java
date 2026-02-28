package com.nbh.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nbh.backend.dto.AuthDto;
import com.nbh.backend.model.User;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ActiveProfiles("test")
public class AuthIntegrationTest {

        @Autowired
        private MockMvc mockMvc;

        @Autowired
        private ObjectMapper objectMapper;

        @Test
        void shouldRegisterUser() throws Exception {
                AuthDto.RegisterRequest request = AuthDto.RegisterRequest.builder()
                                .firstname("John")
                                .lastname("Doe")
                                .email("john@example.com")
                                .password("password")
                                .role(User.Role.ROLE_USER)
                                .build();

                mockMvc.perform(post("/api/auth/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.accessToken").exists());
        }

        @Test
        void shouldAuthenticateUser() throws Exception {
                // First register
                AuthDto.RegisterRequest registerRequest = AuthDto.RegisterRequest.builder()
                                .firstname("Jane")
                                .lastname("Doe")
                                .email("jane@example.com")
                                .password("password")
                                .role(User.Role.ROLE_USER)
                                .build();

                mockMvc.perform(post("/api/auth/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(registerRequest)))
                                .andExpect(status().isOk());

                // Then authenticate
                AuthDto.AuthenticationRequest authRequest = AuthDto.AuthenticationRequest.builder()
                                .email("jane@example.com")
                                .password("password")
                                .build();

                mockMvc.perform(post("/api/auth/authenticate")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(authRequest)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.accessToken").exists());
        }

        @Test
        void shouldLoginUser_UsingAlias() throws Exception {
                // First register
                AuthDto.RegisterRequest registerRequest = AuthDto.RegisterRequest.builder()
                                .firstname("Login")
                                .lastname("User")
                                .email("login@example.com")
                                .password("password")
                                .role(User.Role.ROLE_USER)
                                .build();

                mockMvc.perform(post("/api/auth/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(registerRequest)))
                                .andExpect(status().isOk());

                // Then login
                AuthDto.AuthenticationRequest authRequest = AuthDto.AuthenticationRequest.builder()
                                .email("login@example.com")
                                .password("password")
                                .build();

                mockMvc.perform(post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(authRequest)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.accessToken").exists());
        }

        @Test
        void shouldAccessProtectedEndpoint_WhenAuthenticated() throws Exception {
                // Register and get token
                AuthDto.RegisterRequest registerRequest = AuthDto.RegisterRequest.builder()
                                .firstname("Admin")
                                .lastname("User")
                                .email("admin@example.com")
                                .password("password")
                                .role(User.Role.ROLE_ADMIN)
                                .build();

                String response = mockMvc.perform(post("/api/auth/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(registerRequest)))
                                .andReturn().getResponse().getContentAsString();

                AuthDto.AuthenticationResponse authResponse = objectMapper.readValue(response,
                                AuthDto.AuthenticationResponse.class);
                String token = authResponse.getAccessToken();

                // Access protected endpoint
                mockMvc.perform(get("/api/admin/hello")
                                .header("Authorization", "Bearer " + token))
                                .andExpect(status().isOk());
        }

        @Test
        void shouldReturn403_WhenAccessingProtectedEndpoint_WithoutToken() throws Exception {
                mockMvc.perform(get("/api/admin/hello"))
                                .andExpect(status().isForbidden());
        }
}
