package com.nbh.backend.repository;

import com.nbh.backend.model.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PostRepository extends JpaRepository<Post, UUID> {

    List<Post> findAllByOrderByCreatedAtDesc();

    List<Post> findByLocationNameContainingIgnoreCaseOrderByCreatedAtDesc(String locationName);

    List<Post> findByUser(com.nbh.backend.model.User user);
}
