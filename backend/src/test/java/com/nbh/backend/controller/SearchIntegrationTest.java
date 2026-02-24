package com.nbh.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nbh.backend.dto.HomestayDto;
import com.nbh.backend.model.Homestay;
import com.nbh.backend.repository.HomestayRepository;
import com.nbh.backend.service.HomestayService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class SearchIntegrationTest {

        @Autowired
        private MockMvc mockMvc;

        @MockBean
        private HomestayRepository homestayRepository;

        @Test
        public void shouldSearchHomestays() throws Exception {
                UUID id = UUID.randomUUID();
                // Create a mock user for owner
                com.nbh.backend.model.User owner = new com.nbh.backend.model.User();
                owner.setId(UUID.randomUUID());

                Homestay homestay = Homestay.builder()
                                .id(id)
                                .name("Test Stay")
                                .description("Desc")
                                .pricePerNight(100)
                                .status(Homestay.Status.APPROVED)
                                .owner(owner)
                                .build();

                when(homestayRepository.search(anyString(), any(), any(), any(), any()))
                                .thenReturn(new PageImpl<>(List.of(homestay), PageRequest.of(0, 20), 1));

                mockMvc.perform(get("/api/homestays/search")
                                .param("q", "Test"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.content[0].name").value("Test Stay"));

                verify(homestayRepository).search(eq("Test"), any(), eq(null), eq(null), eq(PageRequest.of(0, 20)));
        }

        @Test
        @WithMockUser(roles = "ADMIN")
        public void shouldApproveHomestay() throws Exception {
                UUID id = UUID.randomUUID();
                Homestay homestay = Homestay.builder()
                                .id(id)
                                .name("Pending Stay")
                                .status(Homestay.Status.PENDING)
                                .build();

                when(homestayRepository.findById(id)).thenReturn(Optional.of(homestay));

                mockMvc.perform(put("/api/homestays/" + id + "/approve"))
                                .andExpect(status().isOk());

                verify(homestayRepository).save(argThat(h -> h.getStatus() == Homestay.Status.APPROVED));
        }
}
