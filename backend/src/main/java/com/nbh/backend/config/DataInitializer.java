package com.nbh.backend.config;

import com.nbh.backend.model.User;
import com.nbh.backend.model.Homestay;
import com.nbh.backend.repository.UserRepository;
import com.nbh.backend.repository.HomestayRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
@Slf4j
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
                                Homestay h1 = Homestay.builder()
                                                .name("Misty Mountain Retreat")
                                                .description("A beautiful stay in Darjeeling with view of Kanchenjunga.")
                                                .address("Darjeeling, West Bengal")
                                                .pricePerNight(2500)
                                                .owner(host)
                                                .status(Homestay.Status.APPROVED)
                                                .latitude(27.0360)
                                                .longitude(88.2627)
                                                .photoUrls(java.util.List.of(
                                                                "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"))
                                                .build();
                                homestayRepository.save(h1);

                                Homestay h2 = Homestay.builder()
                                                .name("River View Kalimpong")
                                                .description("Peaceful stay near Teesta river.")
                                                .address("Kalimpong, West Bengal")
                                                .pricePerNight(1800)
                                                .owner(host)
                                                .status(Homestay.Status.APPROVED)
                                                .latitude(27.0667)
                                                .longitude(88.4667)
                                                .photoUrls(java.util.List.of(
                                                                "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80"))
                                                .build();
                                homestayRepository.save(h2);

                                Homestay h3 = Homestay.builder()
                                                .name("Mirik Lake Homestay")
                                                .description("Cozy cottage near the lake. Needs approval.")
                                                .address("Mirik, West Bengal")
                                                .pricePerNight(1200)
                                                .owner(host)
                                                .status(Homestay.Status.PENDING)
                                                .latitude(26.8833)
                                                .longitude(88.1833)
                                                .photoUrls(java.util.List.of(
                                                                "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=800&q=80"))
                                                .build();
                                homestayRepository.save(h3);

                                log.info("Seeded 3 homestays");
                        }
                };
        }
}
