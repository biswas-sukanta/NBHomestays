package com.nbh.backend.service;

import com.nbh.backend.dto.HostProfileDto;
import com.nbh.backend.model.User;
import com.nbh.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final HomestayService homestayService;
    private final PostService postService;

    @Transactional(readOnly = true)
    public HostProfileDto getHostProfile(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        // Auto-assign badges based on points if not already present
        boolean updated = false;
        if (user.getCommunityPoints() >= 500 && !user.getBadges().contains("Vibe Keeper")) {
            user.getBadges().add("Vibe Keeper");
            updated = true;
        }
        if (user.getCommunityPoints() >= 1000 && !user.getBadges().contains("Master Scout")) {
            user.getBadges().add("Master Scout");
            updated = true;
        }
        if (updated) {
            userRepository.save(user);
        }

        return HostProfileDto.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .bio(user.getBio())
                .communityPoints(user.getCommunityPoints())
                .badges(user.getBadges())
                .homestays(homestayService.getHomestaysByOwner(user.getEmail()))
                .posts(postService.getPostsByUser(user.getEmail()))
                .build();
    }

    @Transactional
    public void updateProfile(String email, Map<String, String> updates) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (updates.containsKey("bio")) {
            user.setBio(updates.get("bio"));
        }
        userRepository.save(user);
    }
}
