package com.nbh.backend.service;

import com.nbh.backend.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ViewTrackingService {

    private final PostRepository postRepository;

    @Transactional
    public void incrementPostView(UUID postId) {
        if (postId != null) {
            postRepository.incrementViewCount(postId);
        }
    }
}

