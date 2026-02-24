package com.nbh.backend.service;

import com.nbh.backend.model.Homestay;
import com.nbh.backend.model.User;
import com.nbh.backend.repository.HomestayRepository;
import com.nbh.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminDataService {

        private final HomestayRepository homestayRepository;
        private final UserRepository userRepository;
        private final PasswordEncoder passwordEncoder;
        private final com.nbh.backend.repository.TripBoardSaveRepository tripBoardSaveRepository;
        private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;
        private final jakarta.persistence.EntityManager entityManager;
        private final org.springframework.cache.CacheManager cacheManager;

        private static final String[] DESTINATIONS = { "Darjeeling", "Kalimpong", "Kurseong", "Mirik", "Siliguri" };

        private static final String[] IMAGE_POOL = {
                        "https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&q=80&w=800",
                        "https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?auto=format&fit=crop&q=80&w=800",
                        "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&q=80&w=800",
                        "https://images.unsplash.com/photo-1626621341517-bbf3e99c0b2c?auto=format&fit=crop&q=80&w=800",
                        "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=800",
                        "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&q=80&w=800",
                        "https://images.unsplash.com/photo-1587595431973-160d0d94add1?auto=format&fit=crop&q=80&w=800",
                        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=800",
                        "https://images.unsplash.com/photo-1542314831-c53cd3816002?auto=format&fit=crop&q=80&w=800",
                        "https://plus.unsplash.com/premium_photo-1697729606869-e58f00db11ee?auto=format&fit=crop&q=80&w=800",
                        "https://images.unsplash.com/photo-1502672260266-1c1e521154fc?auto=format&fit=crop&q=80&w=800",
                        "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&q=80&w=800",
                        "https://images.unsplash.com/photo-1681285312384-cbca6f2d5930?auto=format&fit=crop&q=80&w=800"
        };

        private static final String[] TITLE_TEMPLATES = {
                        "%s Mountain Retreat", "The %s Heritage Stay", "Cloud 9 %s Villa", "%s Valley Attic",
                        "%s Eco Resort",
                        "Serene %s Hideaway"
        };

        @Transactional
        public int deleteHomestays(int limit) {
                log.info("Deleting {} homestays...", limit);
                Page<Homestay> page = homestayRepository.findAll(PageRequest.of(0, limit));
                List<Homestay> toDelete = page.getContent();

                // Explicitly delete orphan references before homestays
                for (Homestay h : toDelete) {
                        tripBoardSaveRepository.deleteByHomestayId(h.getId());
                        // Cleanup likes for posts referencing this homestay
                        jdbcTemplate.update(
                                        "DELETE FROM post_likes WHERE post_id IN (SELECT id FROM posts WHERE homestay_id = ?)",
                                        h.getId());
                }

                homestayRepository.deleteAll(toDelete);
                log.info("Successfully deleted {} homestays.", toDelete.size());
                return toDelete.size();
        }

        @Transactional
        public void deleteAllHomestays() {
                log.info("Purging all homestays using failsafe DML...");
                // Nuclear wipe using DELETE to avoid locking and handle legacy tables
                jdbcTemplate.execute("DELETE FROM post_likes");
                jdbcTemplate.execute("DELETE FROM trip_board_saves");
                jdbcTemplate.execute("DELETE FROM homestay_photos");
                jdbcTemplate.execute("DELETE FROM homestay_answers");
                jdbcTemplate.execute("DELETE FROM homestay_questions");
                jdbcTemplate.execute("DELETE FROM comments");
                jdbcTemplate.execute("DELETE FROM post_images");
                jdbcTemplate.execute("DELETE FROM posts");
                jdbcTemplate.execute("DELETE FROM review_photos");
                jdbcTemplate.execute("DELETE FROM reviews");
                jdbcTemplate.execute("DELETE FROM questions");
                jdbcTemplate.execute("DELETE FROM homestays");

                entityManager.clear(); // Sync persistence context

                // Clear all caches to avoid ghosting in the UI
                cacheManager.getCacheNames().forEach(cacheName -> {
                        org.springframework.cache.Cache cache = cacheManager.getCache(cacheName);
                        if (cache != null) {
                                cache.clear();
                        }
                });

                log.info("Database strictly purged of all homestay-related entities and caches flushed.");
        }

        @Transactional
        public int seedHomestays(int count) {
                log.info("Seeding {} hyper-realistic homestays...", count);

                User owner = userRepository.findByEmail("admin@nbh.com")
                                .orElseGet(() -> {
                                        User newAdmin = User.builder()
                                                        .email("admin@nbh.com")
                                                        .password(passwordEncoder.encode("admin123"))
                                                        .firstName("System")
                                                        .lastName("Admin")
                                                        .role(User.Role.ROLE_ADMIN)
                                                        .enabled(true)
                                                        .build();
                                        return userRepository.save(newAdmin);
                                });

                List<Homestay> seedData = new ArrayList<>();
                Random random = new Random();

                for (int i = 0; i < count; i++) {
                        String destination = DESTINATIONS[i % DESTINATIONS.length]; // Round-robin assignment
                        String template = TITLE_TEMPLATES[random.nextInt(TITLE_TEMPLATES.length)];
                        String title = String.format(template, destination);
                        String description = String.format(
                                        "Experience the pristine beauty of %s with panoramic views, local organic food, and premium comfort in this hyper-realistic property.",
                                        destination);

                        // 3 to 5 images per stay
                        int photoCount = 3 + random.nextInt(3);
                        List<String> photos = new ArrayList<>();
                        for (int p = 0; p < photoCount; p++) {
                                photos.add(IMAGE_POOL[random.nextInt(IMAGE_POOL.length)]);
                        }

                        int price = 1500 + random.nextInt(7000);

                        // Random coordinates around North Bengal
                        double lat = 26.5 + (random.nextDouble() * 0.8);
                        double lng = 88.0 + (random.nextDouble() * 0.5);

                        List<String> dynamicTags = new ArrayList<>(List.of(destination, "Verified"));
                        if (random.nextDouble() > 0.7)
                                dynamicTags.add("Trending Now");
                        if (random.nextDouble() > 0.7)
                                dynamicTags.add("Explore Offbeat");
                        if (random.nextDouble() > 0.8)
                                dynamicTags.add("Featured Stays");

                        seedData.add(createHomestay(owner, title, description, price, lat, lng,
                                        destination + ", West Bengal",
                                        dynamicTags,
                                        photos));
                }

                homestayRepository.saveAllAndFlush(seedData);
                return seedData.size();
        }

        private Homestay createHomestay(User owner, String name, String desc, int price, double lat, double lng,
                        String locName, List<String> tags, List<String> photos) {
                return Homestay.builder()
                                .owner(owner)
                                .name(name)
                                .description(desc)
                                .pricePerNight(price)
                                .latitude(lat)
                                .longitude(lng)
                                .address(locName)
                                .tags(tags)
                                .photoUrls(photos)
                                .amenities(
                                                Map.of("Free Wi-Fi", true, "Hot water", true, "Mountain View", true,
                                                                "Parking (public)", true))
                                .policies(
                                                List.of("Check-in: 1 PM", "Check-out: 10 AM", "Govt ID required",
                                                                "No loud music after 10 PM"))
                                .quickFacts(Map.of("Check-in", "13:00", "Check-out", "10:00", "Location",
                                                "Roadside accessible",
                                                "Mobile Network", "Good Connectivity"))
                                .hostDetails(Map.of("reviewsCount", 15, "rating", 4.8, "yearsHosting", 3, "languages",
                                                List.of("English", "Hindi", "Bengali")))
                                .status(Homestay.Status.APPROVED)
                                .featured(tags.contains("Featured Stays"))
                                .vibeScore(Math.random() * 5 + 90) // 90 to 95 vibe score
                                .build();
        }
}
