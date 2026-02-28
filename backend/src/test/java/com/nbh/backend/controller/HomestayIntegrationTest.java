package com.nbh.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nbh.backend.dto.AuthDto;
import com.nbh.backend.dto.HomestayDto;
import com.nbh.backend.model.Destination;
import com.nbh.backend.model.User;
import com.nbh.backend.repository.DestinationRepository;
import com.nbh.backend.repository.HomestayRepository;
import com.nbh.backend.repository.UserRepository;
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
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ActiveProfiles("test")
public class HomestayIntegrationTest {

        @Autowired
        private MockMvc mockMvc;

        @Autowired
        private UserRepository userRepository;

        @Autowired
        private HomestayRepository homestayRepository;

        @Autowired
        private DestinationRepository destinationRepository;

        @Autowired
        private ObjectMapper objectMapper;

        @Test
        void shouldCreateHomestay_WhenHost() throws Exception {
                // Register Host
                String email = "host-" + java.util.UUID.randomUUID() + "@example.com";
                String token = registerUser(email, User.Role.ROLE_HOST);

                HomestayDto.Request request = HomestayDto.Request.builder()
                                .name("Cozy Cabin")
                                .description("A nice cabin in the woods")
                                .pricePerNight(1500)
                                .latitude(27.0)
                                .longitude(88.0)
                                .locationName("Darjeeling")
                                .build();

                mockMvc.perform(post("/api/homestays")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andDo(print())
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.id").exists())
                                .andExpect(jsonPath("$.name").value("Cozy Cabin"))
                                .andExpect(jsonPath("$.status").value("PENDING"));
        }

        @Test
        void shouldSearchHomestays() throws Exception {
                // Register Host
                String email = "host-" + java.util.UUID.randomUUID() + "@example.com";
                registerUser(email, User.Role.ROLE_HOST);
                User host = userRepository.findByEmail(email).orElseThrow();

                // Create an APPROVED homestay directly in Repo for search test
                com.nbh.backend.model.Homestay h = com.nbh.backend.model.Homestay.builder()
                                .name("Mountain View UniqueTestXyz789")
                                .description("Best view of UniqueTestXyz789 landscape")
                                .pricePerNight(2000)
                                .owner(host)
                                .address("UniqueTestXyz789 Location")
                                .status(com.nbh.backend.model.Homestay.Status.APPROVED)
                                .build();
                homestayRepository.save(h);

                mockMvc.perform(get("/api/homestays/search")
                                .param("q", "UniqueTestXyz789"))
                                .andDo(print())
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.content[0].name").value("Mountain View UniqueTestXyz789"));
        }

        private String registerUser(String email, User.Role role) throws Exception {
                AuthDto.RegisterRequest registerRequest = AuthDto.RegisterRequest.builder()
                                .firstname("Test")
                                .lastname("User")
                                .email(email)
                                .password("password")
                                .role(role)
                                .build();

                String response = mockMvc.perform(post("/api/auth/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(registerRequest)))
                                .andReturn().getResponse().getContentAsString();

                AuthDto.AuthenticationResponse authResponse = objectMapper.readValue(response,
                                AuthDto.AuthenticationResponse.class);
                return authResponse.getAccessToken();
        }
}
