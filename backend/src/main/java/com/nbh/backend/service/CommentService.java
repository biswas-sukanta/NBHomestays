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
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;

    // ── Add top-level comment ──────────────────────────────────
    @Transactional
    public CommentDto addComment(UUID postId, String body, User currentUser) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found: " + postId));

        Comment comment = Comment.builder()
                .post(post)
                .user(currentUser)
                .body(body.trim())
                .build();

        return toDto(commentRepository.save(comment), true);
    }

    // ── Add reply ──────────────────────────────────────────────
    @Transactional
    public CommentDto addReply(UUID postId, UUID parentId, String body, User currentUser) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found: " + postId));
        Comment parent = commentRepository.findById(parentId)
                .orElseThrow(() -> new RuntimeException("Parent comment not found: " + parentId));

        Comment reply = Comment.builder()
                .post(post)
                .user(currentUser)
                .parent(parent)
                .body(body.trim())
                .build();

        return toDto(commentRepository.save(reply), false);
    }

    // ── Get paginated top-level comments (with embedded replies) ──
    @Transactional(readOnly = true)
    public Page<CommentDto> getComments(UUID postId, int page, int size) {
        return commentRepository
                .findTopLevelByPostId(postId, PageRequest.of(page, size))
                .map(c -> toDto(c, true));
    }

    // ── Delete (owner or admin) ────────────────────────────────
    @Transactional
    public void deleteComment(UUID commentId, User currentUser) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found: " + commentId));

        boolean isOwner = comment.getUser().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole().name().equals("ROLE_ADMIN");

        if (!isOwner && !isAdmin) {
            throw new AccessDeniedException("You cannot delete this comment");
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
                .createdAt(c.getCreatedAt())
                .replies(replies)
                .replyCount(replies.size())
                .build();
    }
}
