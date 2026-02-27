package com.nbh.backend.service;

import com.nbh.backend.dto.CommentDto;
import com.nbh.backend.model.Comment;
import com.nbh.backend.model.Post;
import com.nbh.backend.model.User;
import com.nbh.backend.repository.CommentRepository;
import com.nbh.backend.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import com.nbh.backend.repository.UserRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {

        private final CommentRepository commentRepository;
        private final PostRepository postRepository;
        private final UserRepository userRepository;

        // ── Add top-level comment ──────────────────────────────────
        @Transactional
        @CacheEvict(value = "postComments", allEntries = true)
        public CommentDto addComment(UUID postId, CommentDto.Request request, User currentUser) {
                Post post = postRepository.findById(postId)
                                .orElseThrow(() -> new IllegalArgumentException("Post not found: " + postId));
                User user = userRepository.findById(currentUser.getId())
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "User not found: " + currentUser.getId()));

                Comment comment = Comment.builder()
                                .post(post)
                                .user(user)
                                .body(request.getBody() != null ? request.getBody().trim() : "")
                                .imageUrls(request.getImageUrls() != null ? request.getImageUrls() : new ArrayList<>())
                                .build();

                return toDto(commentRepository.save(comment), true);
        }

        // ── Add reply ──────────────────────────────────────────────
        @Transactional
        @CacheEvict(value = "postComments", allEntries = true)
        public CommentDto addReply(UUID postId, UUID parentId, CommentDto.Request request, User currentUser) {
                Post post = postRepository.findById(postId)
                                .orElseThrow(() -> new IllegalArgumentException("Post not found: " + postId));
                Comment parent = commentRepository.findById(parentId)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Parent comment not found: " + parentId));
                User user = userRepository.findById(currentUser.getId())
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "User not found: " + currentUser.getId()));

                Comment reply = Comment.builder()
                                .post(post)
                                .user(user)
                                .parent(parent)
                                .body(request.getBody() != null ? request.getBody().trim() : "")
                                .imageUrls(request.getImageUrls() != null ? request.getImageUrls() : new ArrayList<>())
                                .build();

                return toDto(commentRepository.save(reply), false);
        }

        // ── Get paginated top-level comments (with embedded replies) ──
        @Transactional(readOnly = true)
        @Cacheable(value = "postComments", sync = true)
        public Page<CommentDto> getComments(UUID postId, int page, int size) {
                return commentRepository
                                .findTopLevelByPostId(postId, PageRequest.of(page, size))
                                .map(c -> toDto(c, true));
        }

        // ── Delete (owner or admin) ────────────────────────────────
        @Transactional
        @CacheEvict(value = "postComments", allEntries = true)
        public void deleteComment(UUID commentId, User currentUser) {
                Comment comment = commentRepository.findById(commentId)
                                .orElseThrow(() -> new IllegalArgumentException("Comment not found: " + commentId));

                boolean isOwner = comment.getUser().getId().equals(currentUser.getId());
                boolean isAdmin = currentUser.getRole().name().equals("ROLE_ADMIN");

                if (!isOwner && !isAdmin) {
                        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot delete this comment");
                }
                commentRepository.delete(comment);
        }

        // ── Mapping ────────────────────────────────────────────────
        private CommentDto toDto(Comment c, boolean includeReplies) {
                List<CommentDto> replies = List.of();
                if (includeReplies && c.getReplies() != null) {
                        replies = c.getReplies().stream()
                                        .map(r -> toDto(r, false))
                                        .collect(Collectors.toList());
                }

                User author = c.getUser();
                String authorName = (author.getFirstName() != null ? author.getFirstName() : "")
                                + (author.getLastName() != null ? " " + author.getLastName() : "");

                return CommentDto.builder()
                                .id(c.getId())
                                .postId(c.getPost().getId())
                                .parentId(c.getParent() != null ? c.getParent().getId() : null)
                                .authorId(author.getId())
                                .authorName(authorName.isBlank() ? "Anonymous" : authorName.trim())
                                .authorAvatarUrl(null) // TODO: wire when User.avatarUrl is populated
                                .body(c.getBody())
                                .imageUrls(c.getImageUrls() != null ? c.getImageUrls() : new ArrayList<>())
                                .createdAt(c.getCreatedAt())
                                .replies(replies)
                                .replyCount(replies.size())
                                .build();
        }
}
