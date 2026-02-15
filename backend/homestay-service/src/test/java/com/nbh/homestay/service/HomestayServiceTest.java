package com.nbh.homestay.service;

import com.nbh.homestay.model.Homestay;
import com.nbh.homestay.repository.HomestayRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class HomestayServiceTest {

    @Mock
    private HomestayRepository homestayRepository;

    @InjectMocks
    private HomestayService homestayService;

    private Homestay homestay1;
    private Homestay homestay2;

    @BeforeEach
    void setUp() {
        homestay1 = new Homestay();
        homestay1.setId(java.util.UUID.randomUUID());
        homestay1.setTitle("Cloud 9");
        homestay1.setPricePerNight(new BigDecimal("2500"));

        homestay2 = new Homestay();
        homestay2.setId(java.util.UUID.randomUUID());
        homestay2.setTitle("River View");
        homestay2.setPricePerNight(new BigDecimal("1500"));
    }

    @Test
    void search_ShouldReturnResults_WhenQueryIsValid() {
        // Arrange
        String query = "darjeeling";
        when(homestayRepository.searchHomestays("darjeeling", null, null))
                .thenReturn(Arrays.asList(homestay1));

        // Act
        List<Homestay> results = homestayService.search("darjeeling", null, null);

        // Assert
        assertEquals(1, results.size());
        assertEquals("Cloud 9", results.get(0).getTitle());
        verify(homestayRepository).searchHomestays("darjeeling", null, null);
    }

    @Test
    void search_ShouldHandleEmptyQuery_ByPassingNullToRepo() {
        // Arrange
        when(homestayRepository.searchHomestays(null, null, null))
                .thenReturn(Arrays.asList(homestay1, homestay2));

        // Act
        List<Homestay> results = homestayService.search("", null, null);

        // Assert
        assertEquals(2, results.size());
        verify(homestayRepository).searchHomestays(null, null, null);
    }

    @Test
    void search_ShouldFormatQuery_ByReplacingSpacesWithAmpersand() {
        // Arrange
        String rawQuery = "darjeeling hills";
        String expectedFormatted = "darjeeling & hills";
        when(homestayRepository.searchHomestays(expectedFormatted, null, null))
                .thenReturn(Arrays.asList(homestay1));

        // Act
        homestayService.search(rawQuery, null, null);

        // Assert
        verify(homestayRepository).searchHomestays(expectedFormatted, null, null);
    }
}
