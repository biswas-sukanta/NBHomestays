package com.nbh.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nbh.backend.model.User;
import com.nbh.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final AvatarUrlResolver avatarUrlResolver;
    private final ObjectMapper objectMapper;

    // Allowed fields for profile update (security allowlist)
    private static final Set<String> ALLOWED_PROFILE_FIELDS = Set.of(
        "bio",
        "avatarUrl",
        "displayName",
        "location",
        "languages",
        "interests",
        "travellerType",
        "showEmail",
        "allowMessages",
        "marketingOptIn",
        "socialLinks"
    );

    @Transactional(readOnly = true)
    public java.util.UUID findUserIdByEmail(String email) {
        return userRepository.findByEmail(email).map(User::getId).orElse(null);
    }

    @Transactional
    public void updateProfile(String email, Map<String, String> updates) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        // Process only allowed fields - ignore everything else
        if (updates.containsKey("bio") && updates.get("bio") != null) {
            user.setBio(updates.get("bio"));
        }
        if (updates.containsKey("avatarUrl") && updates.get("avatarUrl") != null) {
            user.setAvatarUrl(updates.get("avatarUrl"));
        }
        if (updates.containsKey("displayName") && updates.get("displayName") != null) {
            user.setDisplayName(updates.get("displayName"));
        }
        if (updates.containsKey("location") && updates.get("location") != null) {
            user.setLocation(updates.get("location"));
        }
        if (updates.containsKey("travellerType") && updates.get("travellerType") != null) {
            try {
                user.setTravellerType(User.TravellerType.valueOf(updates.get("travellerType").toUpperCase()));
            } catch (IllegalArgumentException e) {
                log.warn("Invalid travellerType value: {}", updates.get("travellerType"));
            }
        }
        if (updates.containsKey("showEmail") && updates.get("showEmail") != null) {
            user.setShowEmail(Boolean.parseBoolean(updates.get("showEmail")));
        }
        if (updates.containsKey("allowMessages") && updates.get("allowMessages") != null) {
            user.setAllowMessages(Boolean.parseBoolean(updates.get("allowMessages")));
        }
        if (updates.containsKey("marketingOptIn") && updates.get("marketingOptIn") != null) {
            user.setMarketingOptIn(Boolean.parseBoolean(updates.get("marketingOptIn")));
        }
        if (updates.containsKey("languages") && updates.get("languages") != null) {
            List<String> languages = parseCommaSeparated(updates.get("languages"));
            user.setLanguages(languages);
        }
        if (updates.containsKey("interests") && updates.get("interests") != null) {
            List<String> interests = parseCommaSeparated(updates.get("interests"));
            user.setInterests(interests);
        }
        if (updates.containsKey("socialLinks") && updates.get("socialLinks") != null) {
            try {
                Map<String, String> socialLinks = objectMapper.readValue(
                        updates.get("socialLinks"), 
                        new TypeReference<Map<String, String>>() {});
                user.setSocialLinks(socialLinks);
            } catch (JsonProcessingException e) {
                log.warn("Invalid socialLinks JSON: {}", updates.get("socialLinks"));
            }
        }
        
        userRepository.save(user);
    }

    private List<String> parseCommaSeparated(String value) {
        if (value == null || value.isBlank()) {
            return new ArrayList<>();
        }
        return Arrays.stream(value.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .collect(Collectors.toList());
    }

    /**
     * Get top contributors by post count.
     * Returns list of contributors with resolved avatar URLs.
     */
    @Transactional(readOnly = true)
    public List<TopContributorDto> getTopContributors(int limit) {
        return userRepository.findTopContributors(limit).stream()
                .map(p -> {
                    String name = buildName(p.getFirstName(), p.getLastName(), p.getEmail());
                    String avatarUrl = avatarUrlResolver.resolveUserAvatar(p.getId(), p.getAvatarUrl(), name);
                    return new TopContributorDto(
                            p.getId(),
                            name,
                            avatarUrl,
                            p.getRole(),
                            Boolean.TRUE.equals(p.getVerifiedHost()),
                            p.getPostCount()
                    );
                })
                .collect(Collectors.toList());
    }

    private String buildName(String firstName, String lastName, String email) {
        StringBuilder name = new StringBuilder();
        if (firstName != null && !firstName.isBlank()) {
            name.append(firstName);
        }
        if (lastName != null && !lastName.isBlank()) {
            if (name.length() > 0) name.append(" ");
            name.append(lastName);
        }
        return name.length() > 0 ? name.toString() : email;
    }

    public static class TopContributorDto {
        private final java.util.UUID id;
        private final String name;
        private final String avatarUrl;
        private final String role;
        private final boolean verifiedHost;
        private final long postCount;

        public TopContributorDto(java.util.UUID id, String name, String avatarUrl, String role, boolean verifiedHost, long postCount) {
            this.id = id;
            this.name = name;
            this.avatarUrl = avatarUrl;
            this.role = role;
            this.verifiedHost = verifiedHost;
            this.postCount = postCount;
        }

        public java.util.UUID getId() { return id; }
        public String getName() { return name; }
        public String getAvatarUrl() { return avatarUrl; }
        public String getRole() { return role; }
        public boolean isVerifiedHost() { return verifiedHost; }
        public long getPostCount() { return postCount; }
    }
}
