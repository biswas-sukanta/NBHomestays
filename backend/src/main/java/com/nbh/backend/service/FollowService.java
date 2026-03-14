package com.nbh.backend.service;

import com.nbh.backend.model.User;
import com.nbh.backend.model.UserFollow;
import com.nbh.backend.repository.UserFollowRepository;
import com.nbh.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FollowService {

    private final UserRepository userRepository;
    private final UserFollowRepository userFollowRepository;

    @Transactional
    public void followUser(UUID currentUserId, UUID targetUserId) {
        if (currentUserId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found");
        }
        User follower = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        User followed = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (follower.getId().equals(followed.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Users cannot follow themselves");
        }

        if (userFollowRepository.isFollowing(follower.getId(), followed.getId())) {
            return;
        }

        try {
            userFollowRepository.save(UserFollow.builder()
                    .followerUserId(follower.getId())
                    .followedUserId(followed.getId())
                    .createdAt(OffsetDateTime.now(ZoneOffset.UTC))
                    .build());
        } catch (DataIntegrityViolationException ex) {
            // Composite PK guarantees uniqueness. Concurrent duplicate follows are treated as idempotent success.
            if (!userFollowRepository.isFollowing(follower.getId(), followed.getId())) {
                throw ex;
            }
        }
    }

    @Transactional
    public void unfollowUser(UUID currentUserId, UUID targetUserId) {
        if (currentUserId == null || !userRepository.existsById(currentUserId)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found");
        }
        userFollowRepository.deleteByFollowerUserIdAndFollowedUserId(currentUserId, targetUserId);
    }

    @Transactional(readOnly = true)
    public boolean isFollowing(UUID followerUserId, UUID followedUserId) {
        if (followerUserId == null || followedUserId == null) {
            return false;
        }
        return userFollowRepository.isFollowing(followerUserId, followedUserId);
    }

    @Transactional(readOnly = true)
    public long countFollowers(UUID userId) {
        return userFollowRepository.countByFollowedUserId(userId);
    }

    @Transactional(readOnly = true)
    public long countFollowing(UUID userId) {
        return userFollowRepository.countByFollowerUserId(userId);
    }
}
