package com.nbh.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nbh.backend.model.Destination;
import com.nbh.backend.model.Homestay;
import com.nbh.backend.repository.DestinationRepository;
import com.nbh.backend.repository.HomestayRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DestinationDataSeeder implements CommandLineRunner {

    private final DestinationRepository destinationRepository;
    private final HomestayRepository homestayRepository;
    private final ResourceLoader resourceLoader;
    private final ObjectMapper objectMapper;

    @Override
    public void run(String... args) throws Exception {
        if (destinationRepository.count() == 0) {
            log.info("Seeding destinations from JSON...");
            Resource resource = resourceLoader.getResource("classpath:seed/destinations.json");
            try (InputStream inputStream = resource.getInputStream()) {
                List<Destination> destinations = objectMapper.readValue(inputStream,
                        new TypeReference<List<Destination>>() {
                        });
                destinationRepository.saveAll(destinations);
                log.info("Successfully seeded {} destinations.", destinations.size());

                // Perform Data Backfill: Link existing homestays to the newly seeded
                // destinations
                backfillHomestayDestinations(destinations);

            } catch (Exception e) {
                log.error("Failed to seed destinations: {}", e.getMessage(), e);
            }
        } else {
            log.info("Destinations already present, skipping seeding.");
            // Even if seeded, ensure we backfill any unlinked homestays created during
            // migrations
            List<Destination> destinations = destinationRepository.findAll();
            backfillHomestayDestinations(destinations);
        }
    }

    private void backfillHomestayDestinations(List<Destination> destinations) {
        log.info("Checking for Homestays with missing Destination links...");
        List<Homestay> unlinkedHomestays = homestayRepository.findByDestinationIsNull();

        if (unlinkedHomestays.isEmpty()) {
            log.info("No unlinked Homestays found - Data Model is clean.");
            return;
        }

        log.info("Found {} unlinked Homestays. Attempting to match based on address/location string...",
                unlinkedHomestays.size());
        int matchCount = 0;

        for (Homestay homestay : unlinkedHomestays) {
            if (homestay.getAddress() == null)
                continue;

            String addressLower = homestay.getAddress().toLowerCase();

            for (Destination dest : destinations) {
                if (addressLower.contains(dest.getName().toLowerCase()) ||
                        addressLower.contains(dest.getDistrict().toLowerCase())) {

                    homestay.setDestination(dest);
                    matchCount++;
                    break; // Matched, move to next homestay
                }
            }
        }

        if (matchCount > 0) {
            homestayRepository.saveAll(unlinkedHomestays);
            log.info("Successfully backfilled {} out of {} Homestays to Destinations.", matchCount,
                    unlinkedHomestays.size());
        } else {
            log.warn("Could not find Destination matches for any of the {} unlinked Homestays based on address string.",
                    unlinkedHomestays.size());
        }
    }
}
