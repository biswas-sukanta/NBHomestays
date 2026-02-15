package com.nbh.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nbh.backend.dto.AuthDto;
import com.nbh.backend.dto.ReviewDto;
import com.nbh.backend.model.Homestay;
import com.nbh.backend.model.User;
import com.nbh.backend.repository.HomestayRepository;
import com.nbh.backend.repository.ReviewRepository;
import com.nbh.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class ReviewIntegrationTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private HomestayRepository homestayRepository;
    @Autowired
    private ReviewRepository reviewRepository;

    @BeforeEach
    void tearDown() {
        reviewRepository.deleteAll();
        homestayRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void shouldAddReview() throws Exception {
        String token = registerUser("reviewer@example.com");

        // Register host
        registerUser("host@example.com");
        User host = userRepository.findByEmail("host@example.com").orElseThrow();

        UUID homestayId = createHomestay(host);

        ReviewDto.Request request = ReviewDto.Request.builder()
                .homestayId(homestayId)
                .rating(5)
                .comment("Great place!")
                .build();

        mockMvc.perform(post("/api/reviews")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.comment").value("Great place!"));
    }

    private String registerUser(String email) throws Exception {
        AuthDto.RegisterRequest registerRequest = AuthDto.RegisterRequest.builder()
                .firstname("Test")
                .lastname("User")
                .email(email)
                .password("password")
                .role(User.Role.ROLE_USER)
                .build();
        String response = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readValue(response, AuthDto.AuthenticationResponse.class).getAccessToken();
    }

    private UUID createHomestay(User host) {
        Homestay homestay = Homestay.builder()
                .name("Reviewed Homestay")
                .description("Description")
                .pricePerNight(1000)
                .owner(host)
                .status(Homestay.Status.APPROVED)
                .build();
        return homestayRepository.save(homestay).getId();
    }
}
