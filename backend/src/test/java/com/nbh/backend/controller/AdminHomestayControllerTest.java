package com.nbh.backend.controller;

import com.nbh.backend.model.Homestay;
import com.nbh.backend.model.User;
import com.nbh.backend.repository.HomestayRepository;
import com.nbh.backend.repository.UserRepository;
import com.nbh.backend.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AdminHomestayControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private HomestayRepository homestayRepository;

    @Autowired
    private JwtService jwtService;

    private String adminToken;
    private UUID homestayId;

    @BeforeEach
    void setUp() {
        homestayRepository.deleteAll();
        userRepository.deleteAll();

        // Create Admin User
        User admin = User.builder()
                .firstName("Admin")
                .lastName("User")
                .email("admin@test.com")
                .password("password")
                .role(User.Role.ROLE_ADMIN)
                .enabled(true)
                .build();
        userRepository.save(admin);

        // Generate Admin Token
        adminToken = jwtService.generateToken(Map.of("role", admin.getRole().name()), admin);

        // Create a test Homestay
        Homestay homestay = Homestay.builder()
                .name("Test Homestay")
                .description("Test description")
                .pricePerNight(1000)
                .owner(admin)
                .status(Homestay.Status.APPROVED)
                .featured(false)
                .build();
        homestayRepository.save(homestay);
        homestayId = homestay.getId();
    }

    @Test
    void testToggleFeatured_AsAdmin_ShouldReturnOk() throws Exception {
        mockMvc.perform(put("/api/admin/homestays/" + homestayId + "/feature")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    void testToggleFeatured_WithoutToken_ShouldReturnForbiddenOrUnauthorized() throws Exception {
        mockMvc.perform(put("/api/admin/homestays/" + homestayId + "/feature")
                .contentType(MediaType.APPLICATION_JSON))
                // Spring security might return 401 or 403 depending on configuration
                .andExpect(status().is4xxClientError());
    }
}
