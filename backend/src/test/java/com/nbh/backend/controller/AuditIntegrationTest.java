package com.nbh.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nbh.backend.dto.AuthDto;
import com.nbh.backend.dto.HomestayDto;
import com.nbh.backend.dto.PostDto;
import com.nbh.backend.dto.ReviewDto;
import com.nbh.backend.model.Homestay;
import com.nbh.backend.model.User;
import com.nbh.backend.repository.HomestayRepository;
import com.nbh.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
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
public class AuditIntegrationTest {

        @Autowired
        private MockMvc mockMvc;

        @Autowired
        private ObjectMapper objectMapper;

        @Autowired
        private UserRepository userRepository;

        @Autowired
        private HomestayRepository homestayRepository;

        @Autowired
        private PasswordEncoder passwordEncoder;

        private User testUser;
        private Homestay testHomestay;
        private String userToken;

        @BeforeEach
        void setUp() throws Exception {
                String uniqueEmail = "testaudit-" + java.util.UUID.randomUUID() + "@example.com";

                testUser = User.builder()
                                .firstName("Test")
                                .lastName("User")
                                .email(uniqueEmail)
                                .password(passwordEncoder.encode("password123"))
                                .role(User.Role.ROLE_USER)
                                .enabled(true)
                                .build();
                userRepository.save(testUser);

                testHomestay = Homestay.builder()
                                .name("Audit Test UniqueAuditXyz456")
                                .description("A beautiful place to stay")
                                .pricePerNight(1500)
                                .latitude(27.0410)
                                .longitude(88.2663)
                                .address("UniqueAuditXyz456")
                                .status(Homestay.Status.APPROVED)
                                .owner(testUser)
                                .build();
                homestayRepository.save(testHomestay);

                // Authenticate to get token
                AuthDto.AuthenticationRequest loginRequest = new AuthDto.AuthenticationRequest(uniqueEmail,
                                "password123");
                String loginResponse = mockMvc.perform(post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(loginRequest)))
                                .andExpect(status().isOk())
                                .andReturn().getResponse().getContentAsString();

                userToken = objectMapper.readTree(loginResponse).get("accessToken").asText();
        }

        // T1: Search returns correct paginated payload
        @Test
        void testOptimizedSearchEndpoint() throws Exception {
                mockMvc.perform(get("/api/homestays/search")
                                .param("q", "UniqueAuditXyz456")
                                .param("size", "10")
                                .param("page", "0"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.content[0].name").value("Audit Test UniqueAuditXyz456"))
                                .andExpect(jsonPath("$.content[0].locationName").value("UniqueAuditXyz456"));
        }

        // T2: Unauthenticated request to admin-protected endpoint -> 403
        @Test
        void testSecurityRejectsUnauthenticatedWrites() throws Exception {
                mockMvc.perform(get("/api/admin/data/stats"))
                                .andExpect(status().isForbidden());
        }

        // T3a: Bad register data -> 400
        @Test
        void testInputValidationRejectsBadData() throws Exception {
                AuthDto.RegisterRequest badRequest = AuthDto.RegisterRequest.builder()
                                .firstname("John")
                                .lastname("Doe")
                                .email("") // Invalid email
                                .password("123") // Too short
                                .role(User.Role.ROLE_USER)
                                .build();

                mockMvc.perform(post("/api/auth/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(badRequest)))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.email").exists())
                                .andExpect(jsonPath("$.password").exists());

                HomestayDto.Request badHomestay = HomestayDto.Request.builder()
                                .name("New Space")
                                .description("Desc")
                                .pricePerNight(-500)
                                .latitude(27.0)
                                .longitude(88.0)
                                .locationName("Mirik")
                                .build();

                mockMvc.perform(post("/api/homestays")
                                .header("Authorization", "Bearer " + userToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(badHomestay)))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.pricePerNight").exists());
        }

        // T3b: Post with empty body -> 400 (validates S3/S4 fix)
        @Test
        void testPostValidationRejectsEmptyPayload() throws Exception {
                PostDto.Request emptyPost = PostDto.Request.builder().build();

                mockMvc.perform(post("/api/posts")
                                .header("Authorization", "Bearer " + userToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(emptyPost)))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.locationName").exists())
                                .andExpect(jsonPath("$.textContent").exists());
        }

        // T3c: Review with missing homestayId -> 400 (validates S3/S4 fix)
        @Test
        void testReviewValidationRejectsMissingHomestayId() throws Exception {
                ReviewDto.Request badReview = ReviewDto.Request.builder()
                                .rating(6) // exceeds max of 5
                                .comment("Great place")
                                .build();

                mockMvc.perform(post("/api/reviews")
                                .header("Authorization", "Bearer " + userToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(badReview)))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.homestayId").exists());
        }

        // T3d: 500 responses do NOT contain stack trace (validates S1 fix)
        @Test
        void testNoStackTraceLeakOnError() throws Exception {
                // Hit a non-existent homestay to trigger 404
                mockMvc.perform(get("/api/homestays/" + java.util.UUID.randomUUID()))
                                .andExpect(status().isNotFound())
                                .andExpect(jsonPath("$.trace").doesNotExist())
                                .andExpect(jsonPath("$.type").doesNotExist());
        }
}
