package com.nbh.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nbh.backend.model.Destination;
import com.nbh.backend.repository.DestinationRepository;
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
            } catch (Exception e) {
                log.error("Failed to seed destinations: {}", e.getMessage(), e);
            }
        } else {
            log.info("Destinations already present, skipping seeding.");
        }
    }
}
