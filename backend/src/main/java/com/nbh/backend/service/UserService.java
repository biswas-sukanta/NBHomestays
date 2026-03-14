package com.nbh.backend.service;

import com.nbh.backend.model.User;
import com.nbh.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final AvatarUrlResolver avatarUrlResolver;

    @Transactional(readOnly = true)
    public java.util.UUID findUserIdByEmail(String email) {
        return userRepository.findByEmail(email).map(User::getId).orElse(null);
    }

    @Transactional
    public void updateProfile(String email, Map<String, String> updates) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (updates.containsKey("bio")) {
            user.setBio(updates.get("bio"));
        }
        if (updates.containsKey("avatarUrl")) {
            user.setAvatarUrl(updates.get("avatarUrl"));
        }
        userRepository.save(user);
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
