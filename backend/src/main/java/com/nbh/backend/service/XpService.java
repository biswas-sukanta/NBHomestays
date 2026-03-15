package com.nbh.backend.service;

import com.nbh.backend.dto.XpHistoryDto;
import com.nbh.backend.model.User;
import com.nbh.backend.model.UserXpHistory;
import com.nbh.backend.repository.UserRepository;
import com.nbh.backend.repository.UserXpHistoryRepository;
import com.nbh.backend.repository.HelpfulVoteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * XP Service for the Elevation Engine.
 * 
 * Design Principles:
 * - Async event-driven: uses @TransactionalEventListener for decoupling
 * - Anti-spam: "Syndicate" rules prevent rapid vote exploitation
 * - Log10 QS math: quality score calculation for XP rewards
 * - Immutable history: all XP changes logged to user_xp_history
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class XpService {

    private final UserRepository userRepository;
    private final UserXpHistoryRepository xpHistoryRepository;
    private final HelpfulVoteRepository helpfulVoteRepository;
    private final ApplicationEventPublisher eventPublisher;

    // XP configuration constants
    private static final int BASE_XP_PER_HELPFUL_VOTE = 10;
    private static final double LOG10_MULTIPLIER = 2.0;
    private static final int MAX_XP_PER_POST = 500;
    
    // Anti-spam "Syndicate" rules
    private static final int MAX_VOTES_BETWEEN_USERS_PER_HOUR = 3;
    private static final int MAX_VOTES_BETWEEN_USERS_PER_DAY = 5;
    private static final int MIN_TIME_BETWEEN_VOTES_MINUTES = 2;

    // In-memory rate limiting (consider Redis for production)
    private final Map<String, List<Instant>> voteRateLimitCache = new ConcurrentHashMap<>();

    /**
     * Handle helpful vote event - calculate and award XP.
     * Uses @TransactionalEventListener to ensure this runs after the 
     * transaction that created the vote commits successfully.
     */
    @Async
    @TransactionalEventListener
    public void handleHelpfulVoteEvent(HelpfulVoteEvent event) {
        log.debug("Processing helpful vote event: postId={}, voterId={}, authorId={}",
                event.postId(), event.voterId(), event.authorId());

        // Check Syndicate anti-spam rules
        if (isSyndicateViolation(event.voterId(), event.authorId())) {
            log.warn("Syndicate violation detected: voter={}, author={}", 
                    event.voterId(), event.authorId());
            return;
        }

        // Calculate XP using log10 QS formula
        int xpAwarded = calculateXpForPost(event.postId());
        
        if (xpAwarded <= 0) {
            return;
        }

        // Award XP to post author
        awardXp(event.authorId(), xpAwarded, 
                UserXpHistory.SourceType.POST_HELPFUL,
                event.postId(),
                "Post marked as helpful");
    }

    /**
     * Calculate XP for a post using log10 quality score formula.
     * 
     * Formula: XP = min(BASE_XP * (1 + log10(helpfulCount + 1) * MULTIPLIER), MAX)
     * 
     * This rewards quality content with diminishing returns to prevent gaming.
     */
    public int calculateXpForPost(UUID postId) {
        int helpfulCount = helpfulVoteRepository.countByPostId(postId);
        
        if (helpfulCount == 0) {
            return 0;
        }

        // Log10 quality score calculation
        double qualityScore = 1 + Math.log10(helpfulCount + 1) * LOG10_MULTIPLIER;
        int xp = (int) Math.min(BASE_XP_PER_HELPFUL_VOTE * qualityScore, MAX_XP_PER_POST);
        
        log.debug("XP calculation: postId={}, helpfulCount={}, qualityScore={}, xp={}",
                postId, helpfulCount, qualityScore, xp);
        
        return xp;
    }

    /**
     * Award XP to a user and log to history.
     */
    @Transactional
    public void awardXp(UUID userId, int xpDelta, 
                       UserXpHistory.SourceType sourceType,
                       UUID sourceId,
                       String reason) {
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        int currentXp = user.getTotalXp() != null ? user.getTotalXp() : 0;
        int newTotal = currentXp + xpDelta;

        // Update user's total XP
        user.setTotalXp(newTotal);
        userRepository.save(user);

        // Create immutable history entry
        UserXpHistory history = UserXpHistory.builder()
                .user(user)
                .sourceType(sourceType)
                .sourceId(sourceId)
                .xpDelta(xpDelta)
                .reason(reason)
                .balanceAfter(newTotal)
                .createdAt(Instant.now())
                .build();
        
        xpHistoryRepository.save(history);

        log.info("XP awarded: userId={}, delta={}, newTotal={}, source={}",
                userId, xpDelta, newTotal, sourceType);

        // Publish event for badge eligibility check
        eventPublisher.publishEvent(new BadgeService.XpAwardedEvent(userId, xpDelta, newTotal, Instant.now()));
    }

    /**
     * Check Syndicate anti-spam rules.
     * Prevents rapid votes between same users (collusion detection).
     */
    private boolean isSyndicateViolation(UUID voterId, UUID authorId) {
        String key = voterId + ":" + authorId;
        List<Instant> recentVotes = voteRateLimitCache.computeIfAbsent(key, k -> new ArrayList<>());
        
        Instant now = Instant.now();
        Instant oneHourAgo = now.minus(1, ChronoUnit.HOURS);
        Instant oneDayAgo = now.minus(24, ChronoUnit.HOURS);

        // Clean old entries
        recentVotes.removeIf(instant -> instant.isBefore(oneDayAgo));

        // Count recent votes
        long votesLastHour = recentVotes.stream()
                .filter(instant -> instant.isAfter(oneHourAgo))
                .count();
        long votesLastDay = recentVotes.size();

        // Check violations
        if (votesLastHour >= MAX_VOTES_BETWEEN_USERS_PER_HOUR) {
            log.warn("Syndicate hourly limit exceeded: voter={}, author={}, votes={}",
                    voterId, authorId, votesLastHour);
            return true;
        }
        if (votesLastDay >= MAX_VOTES_BETWEEN_USERS_PER_DAY) {
            log.warn("Syndicate daily limit exceeded: voter={}, author={}, votes={}",
                    voterId, authorId, votesLastDay);
            return true;
        }

        // Check minimum time between votes
        if (!recentVotes.isEmpty()) {
            Instant lastVote = recentVotes.get(recentVotes.size() - 1);
            long minutesSinceLastVote = ChronoUnit.MINUTES.between(lastVote, now);
            if (minutesSinceLastVote < MIN_TIME_BETWEEN_VOTES_MINUTES) {
                log.warn("Syndicate rapid vote detected: voter={}, author={}, minutes={}",
                        voterId, authorId, minutesSinceLastVote);
                return true;
            }
        }

        // Record this vote
        recentVotes.add(now);
        
        return false;
    }

    /**
     * Event record for helpful vote notifications.
     */
    public record HelpfulVoteEvent(
        UUID postId,
        UUID voterId,
        UUID authorId,
        Instant votedAt
    ) {}
    
    /**
     * Get XP history for a user.
     * @param userId User ID
     * @return XP history DTO with entries and totals
     */
    @Transactional(readOnly = true)
    public XpHistoryDto getXpHistory(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        
        List<UserXpHistory> history = xpHistoryRepository.findByUserIdOrderByCreatedAtDesc(userId);
        int totalXp = user.getTotalXp() != null ? user.getTotalXp() : 0;
        
        return XpHistoryDto.fromEntities(history, totalXp);
    }
    
    /**
     * Get XP history for a user filtered by source type.
     * @param userId User ID
     * @param sourceType Source type filter
     * @return XP history DTO with filtered entries
     */
    @Transactional(readOnly = true)
    public XpHistoryDto getXpHistoryByType(UUID userId, UserXpHistory.SourceType sourceType) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        
        List<UserXpHistory> history = xpHistoryRepository.findByUserIdAndSourceType(userId, sourceType);
        int totalXp = user.getTotalXp() != null ? user.getTotalXp() : 0;
        
        return XpHistoryDto.fromEntities(history, totalXp);
    }
}
