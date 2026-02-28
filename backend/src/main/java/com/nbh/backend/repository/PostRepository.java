package com.nbh.backend.repository;

import com.nbh.backend.model.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface PostRepository extends JpaRepository<Post, UUID> {

        org.springframework.data.domain.Page<Post> findAll(org.springframework.data.domain.Pageable pageable);

        org.springframework.data.domain.Page<Post> findByLocationNameContainingIgnoreCase(String locationName,
                        org.springframework.data.domain.Pageable pageable);

        org.springframework.data.domain.Page<Post> findByUser(com.nbh.backend.model.User user,
                        org.springframework.data.domain.Pageable pageable);
}
