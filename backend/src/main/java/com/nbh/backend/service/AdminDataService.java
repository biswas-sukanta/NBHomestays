package com.nbh.backend.service;

import com.nbh.backend.model.Homestay;
import com.nbh.backend.model.Post;
import com.nbh.backend.model.Comment;
import com.nbh.backend.model.MediaResource;
import com.nbh.backend.model.User;
import com.nbh.backend.model.Destination;
import com.nbh.backend.repository.HomestayRepository;
import com.nbh.backend.repository.PostRepository;
import com.nbh.backend.repository.UserRepository;
import com.nbh.backend.repository.DestinationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminDataService {

        private final HomestayRepository homestayRepository;
        private final PostRepository postRepository;
        private final UserRepository userRepository;
        private final DestinationRepository destinationRepository;
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
                jdbcTemplate.execute("DELETE FROM media_resources");
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

                // Fetch destinations for linking
                List<Destination> destinations = destinationRepository.findAll();
                Map<String, Destination> destinationMap = destinations.stream()
                                .collect(Collectors.toMap(Destination::getName, d -> d, (a, b) -> a));

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

                        Destination destEntity = destinationMap.get(destination);
                        
                        seedData.add(createHomestay(owner, title, description, price, lat, lng,
                                        destination + ", West Bengal",
                                        dynamicTags,
                                        photos,
                                        destEntity));
                }

                homestayRepository.saveAllAndFlush(seedData);
                return seedData.size();
        }

        private Homestay createHomestay(User owner, String name, String desc, int price, double lat, double lng,
                        String locName, List<String> tags, List<String> photos, Destination destination) {
                Homestay h = Homestay.builder()
                                .owner(owner)
                                .name(name)
                                .description(desc)
                                .pricePerNight(price)
                                .latitude(lat)
                                .longitude(lng)
                                .address(locName)
                                .tags(tags)
                                .destination(destination)
                                .amenities(
                                                Map.of("Free Wi-Fi", true, "Hot water", true, "Mountain View", true,
                                                                "Parking (public)", true, "Room Service", true, "Bonfire Area", true))
                                .policies(
                                                List.of("Check-in: 1 PM", "Check-out: 10 AM", "Govt ID required",
                                                                "No loud music after 10 PM", "Pets allowed on request"))
                                .quickFacts(Map.of("Check-in", "13:00", "Check-out", "10:00", "Location",
                                                "Roadside accessible",
                                                "Mobile Network", "Good Connectivity", "Altitude", "1500m"))
                                .hostDetails(Map.of("reviewsCount", 15, "rating", 4.8, "yearsHosting", 3, "languages",
                                                List.of("English", "Hindi", "Bengali")))
                                .mealConfig(Map.of(
                                                "breakfastIncluded", true,
                                                "dinnerAvailable", true,
                                                "cuisineTypes", List.of("Local Bengali", "North Indian", "Tibetan"),
                                                "mealPrice", "300-500 per person"))
                                .meta(Map.of(
                                                "lastUpdated", java.time.LocalDateTime.now().toString(),
                                                "source", "admin_seed",
                                                "qualityScore", 85 + new Random().nextInt(15)))
                                .status(Homestay.Status.APPROVED)
                                .featured(tags.contains("Featured Stays"))
                                .vibeScore(Math.random() * 5 + 90) // 90 to 95 vibe score
                                .build();

                List<com.nbh.backend.model.MediaResource> media = photos.stream()
                                .map(url -> com.nbh.backend.model.MediaResource.builder().url(url).homestay(h).build())
                                .collect(Collectors.toList());
                h.setMediaFiles(media);
                return h;
        }

        // ═══════════════════════════════════════════════════════════════════════════
        // POST SEEDING
        // ═══════════════════════════════════════════════════════════════════════════

        private static final String[] POST_LOCATIONS = {
                "Darjeeling", "Kalimpong", "Kurseong", "Mirik", "Siliguri", 
                "Gangtok", "Pelling", "Ravangla", "Lachung", "Lolegaon"
        };

        private static final String[] POST_TAGS = {
                "Question", "Trip Report", "Review", "Alert", "Hidden Gem", 
                "Offbeat", "Transport", "Featured", "Editorial"
        };

        private static final String[] POST_STORY_TEMPLATES = {
                "Just returned from an amazing trip to %s! The views were absolutely breathtaking. Stayed at a lovely homestay with the most welcoming hosts. Highly recommend visiting during %s for the best experience. Anyone else been there recently?",
                "Planning a trip to %s next month. Looking for recommendations on homestays with mountain views. Also curious about the road conditions - is it safe to drive? Any tips would be greatly appreciated!",
                "Hidden gem alert! 🌟 Found this incredible spot near %s that most tourists miss. The local food was amazing and the sunrise views were unreal. Drop a comment if you want exact location details.",
                "Quick question for the community: Has anyone visited %s during monsoon? I've heard mixed reviews about road accessibility. Planning a trip and need advice on what to expect.",
                "Just experienced the most surreal sunrise at %s! Woke up at 4 AM and it was totally worth it. The homestay arranged a guided trek to the viewpoint. Sharing some photos from the trip.",
                "Transport update: The road to %s is currently under maintenance. Expect 1-2 hour delays. Suggest taking the alternate route via the highway. Stay safe everyone!",
                "Review time! ⭐⭐⭐⭐⭐ Stayed at a homestay in %s last week. The food, hospitality, and views exceeded all expectations. Will definitely be returning. Ask me anything about the place!",
                "Offbeat destination recommendation: %s is a must-visit if you want to escape the crowds. Pristine nature, friendly locals, and zero tourist traps. Perfect for a peaceful getaway."
        };

        private static final String[] COMMENT_TEMPLATES = {
                "Thanks for sharing! This is super helpful for my upcoming trip.",
                "Great post! I was there last year and completely agree with your recommendations.",
                "Quick question - which homestay did you stay at? Looking for recommendations.",
                "Beautiful photos! Adding this to my bucket list right now.",
                "I've been wanting to visit! How many days would you recommend for a first trip?",
                "The road conditions info is really useful. Thanks for the update!",
                "Hidden gem indeed! Visited last month and it was magical.",
                "Did you face any issues with mobile network? Planning to work remotely from there."
        };

        private static final String[] REPLY_TEMPLATES = {
                "Happy to help! Feel free to DM if you need more details.",
                "I stayed at Mountain View Homestay - highly recommend it!",
                "Network was decent for calls but patchy for data. BSNB works best there.",
                "3-4 days is ideal to cover the main spots without rushing."
        };

        @Transactional
        public int seedPosts(int count) {
                log.info("Seeding {} hyper-realistic community posts...", count);

                // Get or create admin user as post author
                User author = userRepository.findByEmail("admin@nbh.com")
                                .orElseThrow(() -> new RuntimeException("Admin user not found"));

                // Get available homestays for linking
                List<Homestay> homestays = homestayRepository.findAll();
                Random random = new Random();

                List<Post> posts = new ArrayList<>();

                for (int i = 0; i < count; i++) {
                        String location = POST_LOCATIONS[random.nextInt(POST_LOCATIONS.length)];
                        String storyTemplate = POST_STORY_TEMPLATES[random.nextInt(POST_STORY_TEMPLATES.length)];
                        String textContent = String.format(storyTemplate, location, 
                                        random.nextBoolean() ? "spring" : "autumn");

                        // Random tags (2-4 tags per post)
                        List<String> postTags = new ArrayList<>();
                        int tagCount = 2 + random.nextInt(3);
                        while (postTags.size() < tagCount) {
                                String tag = POST_TAGS[random.nextInt(POST_TAGS.length)];
                                if (!postTags.contains(tag)) {
                                        postTags.add(tag);
                                }
                        }

                        // Randomly link to a homestay (30% chance)
                        Homestay linkedHomestay = null;
                        if (!homestays.isEmpty() && random.nextDouble() < 0.3) {
                                linkedHomestay = homestays.get(random.nextInt(homestays.size()));
                        }

                        // Create post
                        Post post = Post.builder()
                                        .user(author)
                                        .homestay(linkedHomestay)
                                        .locationName(location)
                                        .textContent(textContent)
                                        .tags(postTags)
                                        .loveCount(random.nextInt(50))
                                        .shareCount(random.nextInt(10))
                                        .createdAt(java.time.LocalDateTime.now()
                                                        .minusDays(random.nextInt(30)))
                                        .build();

                        // Add media resources (1-3 images)
                        int mediaCount = 1 + random.nextInt(3);
                        List<MediaResource> mediaList = new ArrayList<>();
                        for (int m = 0; m < mediaCount; m++) {
                                mediaList.add(MediaResource.builder()
                                                .url(IMAGE_POOL[random.nextInt(IMAGE_POOL.length)])
                                                .post(post)
                                                .build());
                        }
                        post.setMediaFiles(mediaList);

                        // Add comments (0-5 per post)
                        int commentCount = random.nextInt(6);
                        List<Comment> comments = new ArrayList<>();
                        for (int c = 0; c < commentCount; c++) {
                                Comment comment = Comment.builder()
                                                .post(post)
                                                .user(author)
                                                .body(COMMENT_TEMPLATES[random.nextInt(COMMENT_TEMPLATES.length)])
                                                .build();

                                // 30% chance of having a reply
                                if (random.nextDouble() < 0.3) {
                                        Comment reply = Comment.builder()
                                                        .post(post)
                                                        .user(author)
                                                        .body(REPLY_TEMPLATES[random.nextInt(REPLY_TEMPLATES.length)])
                                                        .parent(comment)
                                                        .build();
                                        comment.setReplies(List.of(reply));
                                }

                                comments.add(comment);
                        }
                        post.setComments(comments);

                        posts.add(post);
                }

                postRepository.saveAllAndFlush(posts);
                log.info("Successfully seeded {} posts with {} comments", posts.size(),
                                posts.stream().mapToInt(p -> p.getComments() != null ? p.getComments().size() : 0).sum());
                return posts.size();
        }
}
