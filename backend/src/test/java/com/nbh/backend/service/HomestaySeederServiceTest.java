package com.nbh.backend.service;

import com.nbh.backend.model.Homestay;
import com.nbh.backend.repository.HomestayRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("test")
public class HomestaySeederServiceTest {

    @Autowired
    private HomestaySeederService homestaySeederService;

    @Autowired
    private HomestayRepository homestayRepository;

    @Test
    @Transactional
    public void testSeedHomestays_purgesAndInjects8RealisticEntries() {
        // Run seeder
        homestaySeederService.seedHomestays();

        // 1. Assert exactly 8 homestays
        long count = homestayRepository.count();
        assertEquals(8, count, "Seeder should inject exactly 8 top destinations.");

        // 2. Query for Darjeeling specifically
        Page<Homestay> darjeelingStays = homestayRepository.search(
                "", new HashMap<>(), "Darjeeling", null, null, null, null, null, PageRequest.of(0, 10));

        assertEquals(2, darjeelingStays.getTotalElements(), "Should have exactly 2 Darjeeling tags.");
        assertTrue(darjeelingStays.getContent().stream().anyMatch(h -> h.getName().contains("Cloud 9")));

        // 3. Query for Mirik specifically (verifying tag casing logic)
        Page<Homestay> mirikStays = homestayRepository.search(
                "", new HashMap<>(), "Mirik", null, null, null, null, null, PageRequest.of(0, 10));

        assertEquals(2, mirikStays.getTotalElements(), "Should have exactly 2 Mirik tags.");
        assertTrue(mirikStays.getContent().stream().anyMatch(h -> h.getName().contains("Lakeview")));
    }
}
