package com.nbh.backend.config;

import com.nbh.backend.model.User;
import com.nbh.backend.model.Homestay;
import com.nbh.backend.repository.UserRepository;
import com.nbh.backend.repository.HomestayRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "application.data-seeding.enabled", havingValue = "true", matchIfMissing = true)
public class DataInitializer {

        private final UserRepository userRepository;
        private final HomestayRepository homestayRepository;
        private final PasswordEncoder passwordEncoder;

        @Bean
        public CommandLineRunner commandLineRunner() {
                return args -> {
                        // Seed Admin
                        var admin = userRepository.findByEmail("admin@nbh.com")
                                        .orElseGet(() -> User.builder()
                                                        .firstName("Admin")
                                                        .lastName("User")
                                                        .email("admin@nbh.com")
                                                        .enabled(true)
                                                        .build());
                        admin.setPassword(passwordEncoder.encode("admin123"));
                        admin.setRole(User.Role.ROLE_ADMIN);
                        userRepository.save(admin);
                        log.info("Seeded/Updated admin: admin@nbh.com");

                        // Seed Host
                        var host = userRepository.findByEmail("host@nbh.com")
                                        .orElseGet(() -> User.builder()
                                                        .firstName("Host")
                                                        .lastName("User")
                                                        .email("host@nbh.com")
                                                        .enabled(true)
                                                        .build());
                        host.setPassword(passwordEncoder.encode("host123"));
                        host.setRole(User.Role.ROLE_HOST);
                        userRepository.save(host);
                        log.info("Seeded/Updated host: host@nbh.com");

                        // Seed Regular User
                        var user = userRepository.findByEmail("user@nbh.com")
                                        .orElseGet(() -> User.builder()
                                                        .firstName("Regular")
                                                        .lastName("User")
                                                        .email("user@nbh.com")
                                                        .enabled(true)
                                                        .build());
                        user.setPassword(passwordEncoder.encode("user123"));
                        user.setRole(User.Role.ROLE_USER);
                        userRepository.save(user);
                        log.info("Seeded/Updated user: user@nbh.com");

                        // Seed Homestays
                        if (homestayRepository.count() == 0) {
                                homestayRepository.save(createSeedHomestay(
                                                "Misty Mountain Retreat",
                                                "A beautiful stay in Darjeeling with view of Kanchenjunga.",
                                                "Darjeeling, West Bengal",
                                                2500,
                                                host,
                                                Homestay.Status.APPROVED,
                                                27.0360,
                                                88.2627,
                                                "full"));

                                homestayRepository.save(createSeedHomestay(
                                                "River View Kalimpong",
                                                "Peaceful stay near Teesta river.",
                                                "Kalimpong, West Bengal",
                                                1800,
                                                host,
                                                Homestay.Status.APPROVED,
                                                27.0667,
                                                88.4667,
                                                "partial"));

                                homestayRepository.save(createSeedHomestay(
                                                "Mirik Lake Homestay",
                                                "Cozy cottage near the lake. Needs approval.",
                                                "Mirik, West Bengal",
                                                1200,
                                                host,
                                                Homestay.Status.PENDING,
                                                26.8833,
                                                88.1833,
                                                "minimal"));

                                log.info("Seeded 3 homestays");
                        }
                };
        }

        private Homestay createSeedHomestay(String name, String description, String address, int pricePerNight,
                        User owner, Homestay.Status status, double latitude, double longitude, String variant) {
                Homestay homestay = Homestay.builder()
                                .name(name)
                                .description(description)
                                .address(address)
                                .pricePerNight(pricePerNight)
                                .owner(owner)
                                .status(status)
                                .latitude(latitude)
                                .longitude(longitude)
                                .mediaFiles(new java.util.ArrayList<>())
                                .build();

                if ("full".equals(variant)) {
                                homestay.setSpaces(java.util.List.of(java.util.Map.of(
                                                "type", "room",
                                                "name", "Sunrise Suite",
                                                "description", "Main guest room with a reading nook and valley-facing windows.",
                                                "media", java.util.List.of(java.util.Map.of(
                                                                "url", "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85",
                                                                "caption", "Primary suite view")))));
                                homestay.setVideos(java.util.List.of(java.util.Map.of(
                                                "url", "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                                                "title", "Property Tour",
                                                "type", "property")));
                                homestay.setAttractions(java.util.List.of(
                                                java.util.Map.of(
                                                                "name", "Tiger Hill",
                                                                "distance", "12 km",
                                                                "time", "35 min",
                                                                "type", "nature",
                                                                "highlight", true),
                                                java.util.Map.of(
                                                                "name", "Chowrasta",
                                                                "distance", "3 km",
                                                                "time", "10 min",
                                                                "type", "cafe",
                                                                "highlight", false)));
                                homestay.setOffers(java.util.Map.of(
                                                "type", "DEAL",
                                                "title", "Launch Offer",
                                                "description", "10 percent off for the first five bookings.",
                                                "validity", "2026-04-30",
                                                "tags", java.util.List.of("launch", "starter")));
                } else if ("partial".equals(variant)) {
                                homestay.setSpaces(java.util.List.of(java.util.Map.of(
                                                "type", "common",
                                                "name", "Riverside Deck",
                                                "description", "Open deck for tea and slow evenings.",
                                                "media", java.util.List.of())));
                                homestay.setAttractions(java.util.List.of(java.util.Map.of(
                                                "name", "Teesta Viewpoint",
                                                "distance", "4 km",
                                                "time", "15 min",
                                                "type", "nature",
                                                "highlight", true)));
                }

                return homestay;
        }
}
