package com.nbh.backend.service;

import com.nbh.backend.repository.HelpfulVoteRepository;
import com.nbh.backend.repository.UserRepository;
import com.nbh.backend.repository.UserXpHistoryRepository;
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
    private HelpfulVoteRepository helpfulVoteRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private XpService xpService;

    private UUID postId;

    @BeforeEach
    void setUp() {
        postId = UUID.randomUUID();
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
    @DisplayName("XP should be capped at MAX_XP_PER_POST (500)")
    void testXpCapAtMax() {
        when(helpfulVoteRepository.countByPostId(postId)).thenReturn(100000);

        int xp = xpService.calculateXpForPost(postId);

        assertEquals(500, xp, "XP should be capped at 500");
    }
}
