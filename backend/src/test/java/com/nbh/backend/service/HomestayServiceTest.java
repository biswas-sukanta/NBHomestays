package com.nbh.backend.service;

import com.nbh.backend.dto.HomestayDto;
import com.nbh.backend.model.Homestay;
import com.nbh.backend.repository.DestinationRepository;
import com.nbh.backend.repository.HomestayRepository;
import com.nbh.backend.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class HomestayServiceTest {

    @Mock
    private HomestayRepository homestayRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ImageUploadService imageUploadService;

    @Mock
    private AsyncJobService asyncJobService;

    @Mock
    private DestinationRepository destinationRepository;

    @Mock
    private DestinationService destinationService;

    @Test
    @DisplayName("Admin list reads should skip broken homestays instead of failing the whole response")
    void getAllHomestaysSkipsBrokenRecords() {
        Homestay valid = Homestay.builder().id(UUID.randomUUID()).build();
        Homestay broken = Homestay.builder().id(UUID.randomUUID()).build();

        HomestayDto.Response validResponse = HomestayDto.Response.builder()
                .id(valid.getId())
                .name("Valid stay")
                .build();

        HomestayService service = spy(new HomestayService(
                homestayRepository,
                userRepository,
                imageUploadService,
                asyncJobService,
                destinationRepository,
                destinationService));

        when(homestayRepository.findAll()).thenReturn(List.of(valid, broken));
        doReturn(validResponse).when(service).mapToResponse(valid);
        doThrow(new IllegalStateException("broken owner relation")).when(service).mapToResponse(broken);

        List<HomestayDto.Response> responses = service.getAllHomestays();

        assertEquals(1, responses.size());
        assertEquals(valid.getId(), responses.get(0).getId());
    }

    @Test
    @DisplayName("Pending homestay page should drop broken rows and stay serializable")
    void getPendingHomestaysSkipsBrokenRecords() {
        Homestay valid = Homestay.builder().id(UUID.randomUUID()).build();
        Homestay broken = Homestay.builder().id(UUID.randomUUID()).build();

        HomestayDto.Response validResponse = HomestayDto.Response.builder()
                .id(valid.getId())
                .name("Pending stay")
                .build();

        HomestayService service = spy(new HomestayService(
                homestayRepository,
                userRepository,
                imageUploadService,
                asyncJobService,
                destinationRepository,
                destinationService));

        when(homestayRepository.findByStatus(Homestay.Status.PENDING, Pageable.unpaged()))
                .thenReturn(new PageImpl<>(List.of(valid, broken)));
        doReturn(validResponse).when(service).mapToResponse(valid);
        doThrow(new IllegalStateException("broken destination relation")).when(service).mapToResponse(broken);

        var page = service.getPendingHomestays(Pageable.unpaged());

        assertEquals(1, page.getContent().size());
        assertEquals(valid.getId(), page.getContent().get(0).getId());
    }

    @Test
    @DisplayName("DTO mapping should tolerate a missing owner and destination")
    void mapToResponseHandlesMissingOwnerAndDestination() {
        Homestay homestay = Homestay.builder()
                .id(UUID.randomUUID())
                .name("Safe stay")
                .description("desc")
                .pricePerNight(2200)
                .featured(null)
                .status(Homestay.Status.APPROVED)
                .build();

        HomestayService service = new HomestayService(
                homestayRepository,
                userRepository,
                imageUploadService,
                asyncJobService,
                destinationRepository,
                destinationService);

        HomestayDto.Response response = service.mapToResponse(homestay);

        assertEquals("Unknown host", response.getHost().getName());
        assertNull(response.getOwnerId());
        assertNull(response.getDestination());
        assertFalse(Boolean.TRUE.equals(response.getFeatured()));
        assertTrue(response.getMedia().isEmpty());
    }
}
