package com.nbh.backend.service;

import com.nbh.backend.model.Homestay;
import com.nbh.backend.model.User;
import com.nbh.backend.repository.HomestayRepository;
import com.nbh.backend.repository.MediaResourceRepository;
import com.nbh.backend.repository.PostRepository;
import com.nbh.backend.repository.ReviewRepository;
import com.nbh.backend.repository.TimelineRepository;
import com.nbh.backend.repository.TripBoardSaveRepository;
import com.nbh.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "application.data-seeding.enabled", havingValue = "true", matchIfMissing = true)
public class HomestaySeederService {

        private final HomestayRepository homestayRepository;
        private final MediaResourceRepository mediaResourceRepository;
        private final PostRepository postRepository;
        private final ReviewRepository reviewRepository;
        private final TimelineRepository timelineRepository;
        private final TripBoardSaveRepository tripBoardSaveRepository;
        private final UserRepository userRepository;
        private final PasswordEncoder passwordEncoder;

        @Transactional(rollbackFor = Exception.class)
        public void seedHomestays() {
                log.info("Starting hard-purge of existing homestays...");

                // FIX (Issue E+F): Replace JPA deleteAll() which triggers @SQLDelete soft-delete.
                // Correct order: delete children without CASCADE first, then hard-delete homestays.
                //
                // media_resources.homestay_id → homestays(id) has NO ON DELETE CASCADE (V26)
                int deletedMedia = mediaResourceRepository.deleteByHomestayIdIsNotNull();
                log.info("Hard-deleted {} media_resources linked to homestays", deletedMedia);

                // reviews.homestay_id → homestays(id) has NO ON DELETE CASCADE (V3)
                int deletedReviews = reviewRepository.hardDeleteAll();
                log.info("Hard-deleted {} reviews", deletedReviews);

                List<java.util.UUID> homestayIds = homestayRepository.findAll().stream()
                                .map(Homestay::getId)
                                .toList();
                postRepository.clearAllHomestayReferences();
                timelineRepository.clearAllHomestayReferences();
                homestayIds.forEach(tripBoardSaveRepository::deleteByHomestayId);
                log.info("Cleared homestay references from posts, timeline, and {} trip board saves", homestayIds.size());

                // Hard delete homestays — bypasses @SQLDelete(sql = "UPDATE homestays SET is_deleted = true WHERE id=?")
                // Uses native DELETE FROM homestays, preventing soft-deleted row accumulation.
                int deletedHomestays = homestayRepository.hardDeleteAll();
                log.info("Hard-deleted {} homestays (no soft-delete accumulation)", deletedHomestays);

                log.info("Fetching or creating system admin owner...");
                User owner = userRepository.findByEmail("admin@nbhomestays.com")
                                .orElseGet(() -> {
                                        User newAdmin = User.builder()
                                                        .email("admin@nbhomestays.com")
                                                        .password(passwordEncoder.encode("Securepassword123!"))
                                                        .firstName("System")
                                                        .lastName("Admin")
                                                        .role(User.Role.ROLE_ADMIN)
                                                        .build();
                                        return userRepository.save(newAdmin);
                                });

                log.info("Generating hyper-realistic homestays...");
                List<Homestay> seedData = new ArrayList<>();

                // Darjeeling Stays
                seedData.add(createHomestay(owner, "full", "Cloud 9 Heritage Villa",
                                "Experience the colonial charm of Darjeeling in this 100-year-old heritage villa. Wake up to unobstructed views of the Kanchenjunga.",
                                6500, 27.0410, 88.2663, "Darjeeling, West Bengal",
                                List.of("Darjeeling", "Trending Now", "Heritage", "Premium"),
                                List.of("https://images.unsplash.com/photo-1596484552834-6a58f850e0a1",
                                                "https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c")));

                seedData.add(createHomestay(owner, "partial", "Happy Valley Attic",
                                "A cozy wooden attic near the Happy Valley Tea Estate. Perfect for couples seeking a quiet retreat amidst the tea gardens.",
                                3500, 27.0500, 88.2600, "Near Happy Valley, Darjeeling",
                                List.of("Darjeeling", "Couples Getaway", "Budget Friendly"),
                                List.of("https://images.unsplash.com/photo-1544644181-1484b3fdfc62",
                                                "https://images.unsplash.com/photo-1521401830884-6c03c1c87ebb")));

                // Kalimpong Stays
                seedData.add(createHomestay(owner, "minimal", "Deolo Hill Retreat",
                                "Situated close to Deolo Hill, this homestay offers panoramic views of the Teesta river and the Himalayan range. Includes home-cooked organic meals.",
                                4200, 27.0594, 88.4695, "Deolo Hill, Kalimpong",
                                List.of("Kalimpong", "Mountain View", "Nature & Eco"),
                                List.of("https://images.unsplash.com/photo-1626621341517-bbf3e99c0b2c",
                                                "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4")));

                seedData.add(createHomestay(owner, "full", "Pine Vista Kalimpong",
                                "A modern homestay surrounded by pine trees, featuring dedicated workspaces and blazing fast fiber internet for remote workers.",
                                2800, 27.0650, 88.4710, "Upper Cart Road, Kalimpong",
                                List.of("Kalimpong", "Workation", "Long Stays"),
                                List.of("https://images.unsplash.com/photo-1510798831971-661eb04b3739",
                                                "https://images.unsplash.com/photo-1513694203232-719a280e022f")));

                // Mirik Stays
                seedData.add(createHomestay(owner, "partial", "Lakeview Serenity",
                                "Just 5 minutes from Mirik Lake (Sumendu Lake). Enjoy boating during the day and bonfire evenings under the stars.",
                                3000, 26.8844, 88.1818, "Mirik Lake Area",
                                List.of("Mirik", "Trending Now", "Family Friendly"),
                                List.of("https://images.unsplash.com/photo-1587595431973-160d0d94add1",
                                                "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267")));

                seedData.add(createHomestay(owner, "minimal", "Orange Orchard Farmstay",
                                "Located in the orange orchards of Mirik. Pluck fresh oranges (in season) and enjoy farm-to-table organic Nepali cuisine.",
                                2500, 26.8900, 88.1900, "Bungkulung, near Mirik",
                                List.of("Mirik", "Explore Offbeat", "Nature & Eco"),
                                List.of("https://images.unsplash.com/photo-1542314831-c53cd3816002",
                                                "https://images.unsplash.com/photo-1566073771259-6a8506099945")));

                // Kurseong Stays
                seedData.add(createHomestay(owner, "full", "Eagle's Craig Viewpoint Homestay",
                                "Overlooking the plains of Siliguri from Kurseong, this homestay offers the best sunrise and night city light views.",
                                3800, 26.8800, 88.2800, "Eagle's Craig, Kurseong",
                                List.of("Kurseong", "Featured Stays", "Mountain View"),
                                List.of("https://plus.unsplash.com/premium_photo-1697729606869-e58f00db11ee",
                                                "https://images.unsplash.com/photo-1502672260266-1c1e521154fc")));

                seedData.add(createHomestay(owner, "partial", "Makaibari Estate Bungalow",
                                "Stay inside the world-famous Makaibari Tea Estate. Experience tea tasting sessions and walks through the century-old estate.",
                                5500, 26.8750, 88.2650, "Makaibari, Kurseong",
                                List.of("Kurseong", "Heritage", "Premium"),
                                List.of("https://images.unsplash.com/photo-1540541338287-41700207dee6",
                                                "https://images.unsplash.com/photo-1582719508461-905c673771fd")));

                homestayRepository.saveAll(seedData);
                log.info("Successfully seeded {} hyper-realistic homestays.", seedData.size());
        }

        private Homestay createHomestay(User owner, String variant, String name, String desc, int price, double lat, double lng,
                        String locName, List<String> tags, List<String> photos) {
                Homestay h = Homestay.builder()
                                .owner(owner)
                                .name(name)
                                .description(desc)
                                .pricePerNight(price)
                                .latitude(lat)
                                .longitude(lng)
                                .address(locName)
                                .tags(tags)
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
                                .featured(tags.contains("Featured Stays") || tags.contains("Trending Now"))
                                .vibeScore(Math.random() * 5 + 90) // 90 to 95 vibe score
                                .build();

                List<com.nbh.backend.model.MediaResource> media = photos.stream()
                                .map(url -> com.nbh.backend.model.MediaResource.builder().url(url).homestay(h).build())
                                .collect(Collectors.toList());
                h.setMediaFiles(media);
                applySeedVariant(h, photos, variant);
                return h;
        }

        private void applySeedVariant(Homestay homestay, List<String> photos, String variant) {
                String primaryPhoto = photos == null || photos.isEmpty() ? null : photos.get(0);

                if ("full".equals(variant)) {
                        homestay.setSpaces(List.of(
                                        Map.of(
                                                        "type", "room",
                                                        "name", "Kanchenjunga Suite",
                                                        "description", "Main guest room with window seating and wide valley views.",
                                                        "media", primaryPhoto == null ? List.of()
                                                                        : List.of(Map.of(
                                                                                        "url", primaryPhoto,
                                                                                        "caption", "Primary suite view"))),
                                        Map.of(
                                                        "type", "common",
                                                        "name", "Tea Deck",
                                                        "description", "Shared deck for breakfast and sunrise tea.",
                                                        "media", List.of())));
                        homestay.setVideos(List.of(Map.of(
                                        "url", "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                                        "title", "Property Tour",
                                        "type", "property")));
                        homestay.setAttractions(List.of(
                                        Map.of(
                                                        "name", "Viewpoint Trail",
                                                        "distance", "4 km",
                                                        "time", "12 min",
                                                        "type", "nature",
                                                        "highlight", true),
                                        Map.of(
                                                        "name", "Town Cafe Strip",
                                                        "distance", "2 km",
                                                        "time", "8 min",
                                                        "type", "cafe",
                                                        "highlight", false)));
                        homestay.setOffers(Map.of(
                                        "type", "DEAL",
                                        "title", "Season Starter Offer",
                                        "description", "10 percent off for weekday stays.",
                                        "validity", "2026-05-15",
                                        "tags", List.of("seed", "weekday")));
                        return;
                }

                if ("partial".equals(variant)) {
                        homestay.setSpaces(List.of(Map.of(
                                        "type", "outdoor",
                                        "name", "Bonfire Court",
                                        "description", "Open outdoor court for cold-weather evenings.",
                                        "media", List.of())));
                        homestay.setAttractions(List.of(Map.of(
                                        "name", "Tea Estate Walk",
                                        "distance", "3 km",
                                        "time", "10 min",
                                        "type", "culture",
                                        "highlight", true)));
                        return;
                }

                homestay.setSpaces(null);
                homestay.setVideos(null);
                homestay.setAttractions(null);
                homestay.setOffers(null);
        }
}
