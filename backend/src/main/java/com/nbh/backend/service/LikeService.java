package com.nbh.backend.service;

import com.nbh.backend.model.PostLike;
import com.nbh.backend.repository.PostLikeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LikeService {

    private final PostLikeRepository postLikeRepository;

    @Transactional
    public boolean toggle(UUID postId, UUID userId) {
        PostLike.PostLikePk pk = new PostLike.PostLikePk(userId, postId);
        if (postLikeRepository.existsById(pk)) {
            postLikeRepository.deleteById(pk);
            return false; // unliked
        } else {
            postLikeRepository.save(PostLike.builder()
                    .userId(userId)
                    .postId(postId)
                    .build());
            return true; // liked
        }
    }

    @Transactional(readOnly = true)
    public long countLikes(UUID postId) {
        return postLikeRepository.countByPostId(postId);
    }

    @Transactional(readOnly = true)
    public boolean isLikedByUser(UUID postId, UUID userId) {
        return postLikeRepository.existsByUserIdAndPostId(userId, postId);
    }

    @Transactional(readOnly = true)
    public List<UUID> getLikedPostIds(UUID userId) {
        return postLikeRepository.findLikedPostIdsByUserId(userId);
    }
}
