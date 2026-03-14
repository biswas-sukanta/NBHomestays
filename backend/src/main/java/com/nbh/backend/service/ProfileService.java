package com.nbh.backend.service;

import com.nbh.backend.dto.HostProfileDto;
import com.nbh.backend.model.User;
import com.nbh.backend.repository.PostRepository;
import com.nbh.backend.repository.UserFollowRepository;
import com.nbh.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;
    private final UserFollowRepository userFollowRepository;
    private final PostRepository postRepository;
    private final HomestayService homestayService;
    private final PostService postService;

    @Transactional(readOnly = true)
    public HostProfileDto getProfile(UUID userId, UUID viewerUserId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        long followersCount = userFollowRepository.countByFollowedUserId(userId);
        long followingCount = userFollowRepository.countByFollowerUserId(userId);
        long postCount = postRepository.countByUser_IdAndIsDeletedFalse(userId);
        var postsPage = postService.getPostsByUser(user.getEmail(), PageRequest.of(0, 20));

        return HostProfileDto.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .username(buildUsername(user))
                .avatar(user.getAvatarUrl())
                .bio(user.getBio())
                .communityPoints(user.getCommunityPoints())
                .badges(user.getBadges())
                .verifiedHost(user.isVerifiedHost())
                .followersCount(followersCount)
                .followingCount(followingCount)
                .postCount(postCount)
                .isFollowing(viewerUserId != null
                        && userFollowRepository.isFollowing(viewerUserId, userId))
                .homestays(homestayService.getHomestaysByOwner(user.getEmail(), PageRequest.of(0, 10)).getContent())
                .posts(postsPage.getContent())
                .build();
    }

    private String buildUsername(User user) {
        String firstName = user.getFirstName() == null ? "" : user.getFirstName().trim().toLowerCase().replace(' ', '-');
        String lastName = user.getLastName() == null ? "" : user.getLastName().trim().toLowerCase().replace(' ', '-');
        String combined = (firstName + (lastName.isBlank() ? "" : "-" + lastName)).replaceAll("^-+|-+$", "");
        if (!combined.isBlank()) {
            return combined;
        }
        String email = user.getEmail() == null ? "" : user.getEmail();
        int at = email.indexOf('@');
        return at > 0 ? email.substring(0, at) : email;
    }
}
