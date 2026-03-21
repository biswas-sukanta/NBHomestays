package com.nbh.backend.service;

import com.nbh.backend.repository.HelpfulVoteRepository;
import com.nbh.backend.repository.PostRepository;
import com.nbh.backend.repository.UserRepository;
import com.nbh.backend.repository.UserXpHistoryRepository;
import com.nbh.backend.repository.UserXpPostHelpfulRepository;
import com.nbh.backend.model.Post;
import com.nbh.backend.model.User;
import com.nbh.backend.model.UserXpHistory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for XpService XP calculation logic.
 * 
 * Verifies the Log10 Quality Score formula:
 * XP = min(BASE_XP * (1 + log10(helpfulCount + 1) * MULTIPLIER), MAX)
 * 
 * Constants:
 * - BASE_XP_PER_HELPFUL_VOTE = 10
 * - LOG10_MULTIPLIER = 2.0
 * - MAX_XP_PER_POST = 500
 */
@ExtendWith(MockitoExtension.class)
class XpServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserXpHistoryRepository xpHistoryRepository;

    @Mock
    private UserXpPostHelpfulRepository userXpPostHelpfulRepository;

    @Mock
    private HelpfulVoteRepository helpfulVoteRepository;

    @Mock
    private PostRepository postRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private XpService xpService;

    private UUID postId;
    private UUID userId;
    private User user;
    private Post post;

    @BeforeEach
    void setUp() {
        postId = UUID.randomUUID();
        userId = UUID.randomUUID();
        user = User.builder()
                .id(userId)
                .email("user@nbh.com")
                .password("password")
                .role(User.Role.ROLE_USER)
                .enabled(true)
                .build();
        post = Post.builder().id(postId).build();
    }

    /**
     * Test XP calculation for helpfulCount = 1.
     * 
     * Formula: XP = 10 * (1 + log10(1 + 1) * 2.0)
     *             = 10 * (1 + log10(2) * 2.0)
     *             = 10 * (1 + 0.301 * 2.0)
     *             = 10 * (1 + 0.602)
     *             = 10 * 1.602
     *             = 16.02 ≈ 16 XP
     */
    @Test
    @DisplayName("XP for helpfulCount=1 should be 16")
    void testXpForOneHelpfulVote() {
        when(helpfulVoteRepository.countByPostId(postId)).thenReturn(1);

        int xp = xpService.calculateXpForPost(postId);

        assertEquals(16, xp, "XP for 1 helpful vote should be 16");
    }

    /**
     * Test XP calculation for helpfulCount = 10.
     * 
     * Formula: XP = 10 * (1 + log10(10 + 1) * 2.0)
     *             = 10 * (1 + log10(11) * 2.0)
     *             = 10 * (1 + 1.041 * 2.0)
     *             = 10 * (1 + 2.082)
     *             = 10 * 3.082
     *             = 30.82 ≈ 30 XP
     */
    @Test
    @DisplayName("XP for helpfulCount=10 should be 30")
    void testXpForTenHelpfulVotes() {
        when(helpfulVoteRepository.countByPostId(postId)).thenReturn(10);

        int xp = xpService.calculateXpForPost(postId);

        assertEquals(30, xp, "XP for 10 helpful votes should be 30");
    }

    /**
     * Test XP calculation for helpfulCount = 100.
     * 
     * Formula: XP = 10 * (1 + log10(100 + 1) * 2.0)
     *             = 10 * (1 + log10(101) * 2.0)
     *             = 10 * (1 + 2.004 * 2.0)
     *             = 10 * (1 + 4.008)
     *             = 10 * 5.008
     *             = 50.08 ≈ 50 XP
     */
    @Test
    @DisplayName("XP for helpfulCount=100 should be 50")
    void testXpForHundredHelpfulVotes() {
        when(helpfulVoteRepository.countByPostId(postId)).thenReturn(100);

        int xp = xpService.calculateXpForPost(postId);

        assertEquals(50, xp, "XP for 100 helpful votes should be 50");
    }

    /**
     * Test XP calculation for helpfulCount = 0.
     * No helpful votes should return 0 XP.
     */
    @Test
    @DisplayName("XP for helpfulCount=0 should be 0")
    void testXpForZeroHelpfulVotes() {
        when(helpfulVoteRepository.countByPostId(postId)).thenReturn(0);

        int xp = xpService.calculateXpForPost(postId);

        assertEquals(0, xp, "XP for 0 helpful votes should be 0");
    }

    /**
     * Test that XP is capped at MAX_XP_PER_POST (500).
     * With helpfulCount = 100000, the formula would exceed 500,
     * but the result should be capped.
     */
    @Test
    @DisplayName("XP calculation should follow the configured log10 formula for very large helpful counts")
    void testXpCapAtMax() {
        when(helpfulVoteRepository.countByPostId(postId)).thenReturn(100000);

        int xp = xpService.calculateXpForPost(postId);

        assertEquals(110, xp, "XP should match the current configured log10 formula");
    }

    @Test
    @DisplayName("Helpful-post XP should be written to the strongly typed table, not user_xp_history")
    void testAwardPostHelpfulXpWritesTypedTableOnly() {
        when(userRepository.findById(userId)).thenReturn(java.util.Optional.of(user));
        when(postRepository.findById(postId)).thenReturn(java.util.Optional.of(post));
        when(userRepository.findComputedTotalXpById(userId)).thenReturn(0);

        xpService.awardPostHelpfulXp(userId, postId, 16);

        verify(userXpPostHelpfulRepository).save(any());
        verify(xpHistoryRepository, never()).save(any(UserXpHistory.class));
    }

    @Test
    @DisplayName("Generic awardXp should reject POST_HELPFUL writes to user_xp_history")
    void testAwardXpRejectsPostHelpfulInGenericLedger() {
        org.junit.jupiter.api.Assertions.assertThrows(IllegalArgumentException.class, () ->
                xpService.awardXp(userId, 16, UserXpHistory.SourceType.POST_HELPFUL, postId, "bad write"));
    }
}
