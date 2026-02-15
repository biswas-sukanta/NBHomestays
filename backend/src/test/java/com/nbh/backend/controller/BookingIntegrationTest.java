package com.nbh.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nbh.backend.dto.AuthDto;
import com.nbh.backend.dto.BookingDto;
import com.nbh.backend.model.Homestay;
import com.nbh.backend.model.User;
import com.nbh.backend.repository.BookingRepository;
import com.nbh.backend.repository.HomestayRepository;
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
import java.time.LocalDate;
import java.util.UUID;

import jakarta.transaction.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ActiveProfiles("test")
public class BookingIntegrationTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private HomestayRepository homestayRepository;
    // bookingRepository not needed for verify? removed

    @Test
    void shouldCreateBooking() throws Exception {
        String bookerEmail = "booker-" + UUID.randomUUID() + "@example.com";
        String token = registerUser(bookerEmail);

        // Register a host to own the homestay
        String hostEmail = "host-" + UUID.randomUUID() + "@example.com";
        registerUser(hostEmail);
        User host = userRepository.findByEmail(hostEmail).orElseThrow();

        UUID homestayId = createHomestay(host);

        BookingDto.Request request = BookingDto.Request.builder()
                .homestayId(homestayId)
                .checkInDate(LocalDate.now().plusDays(1))
                .checkOutDate(LocalDate.now().plusDays(3))
                .guests(2)
                .build();

        mockMvc.perform(post("/api/bookings")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"));
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
                .name("Test Homestay")
                .description("Description")
                .pricePerNight(1000)
                .owner(host)
                .status(Homestay.Status.APPROVED)
                .build();
        return homestayRepository.save(homestay).getId();
    }
}
