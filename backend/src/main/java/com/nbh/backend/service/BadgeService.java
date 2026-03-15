package com.nbh.backend.service;

import com.nbh.backend.model.BadgeDefinition;
import com.nbh.backend.model.User;
import com.nbh.backend.model.UserBadge;
import com.nbh.backend.model.UserXpHistory;
import com.nbh.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

/**
 * Badge Service for the Elevation Engine.
 * 
 * Responsibilities:
 * - Award "Khazana" Merit badges based on achievements
 * - Award Elevation Stage badges based on XP thresholds
 * - Process badge eligibility via scheduled jobs
 * - Listen for XP events for real-time badge checks
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BadgeService {

    private final BadgeDefinitionRepository badgeDefinitionRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;
    private final ReviewRepository reviewRepository;
    private final HelpfulVoteRepository helpfulVoteRepository;
    private final PostRepository postRepository;
    private final XpService xpService;

    // Khazana badge slugs (merit-based achievements)
    private static final String BADGE_HELPER_20 = "helper-20";
    private static final String BADGE_REVIEWER_5 = "reviewer-5";
    private static final String BADGE_CONTRIBUTOR_50 = "contributor-50";
    private static final String BADGE_EXPLORER = "explorer";
    private static final String BADGE_GUIDE = "guide";
    private static final String BADGE_EXPERT = "expert";
    private static final String BADGE_MENTOR = "mentor";

    /**
     * Daily scheduled job to check Khazana merit badges.
     * Runs at 2:00 AM server time.
     * Processes users in batches of 100 to prevent memory bottlenecks.
     */
    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void checkKhazanaMeritBadges() {
        log.info("Starting Khazana merit badge check job");
        
        int batchSize = 100;
        int pageNumber = 0;
        int processedCount = 0;
        
        org.springframework.data.domain.Page<User> userPage;
        do {
            userPage = userRepository.findAll(
                    org.springframework.data.domain.PageRequest.of(pageNumber, batchSize));
            
            for (User user : userPage.getContent()) {
                checkHelperBadge(user);
                checkReviewerBadge(user);
                checkContributorBadge(user);
                processedCount++;
            }
            
            pageNumber++;
        } while (userPage.hasNext());
        
        log.info("Completed Khazana merit badge check job. Processed {} users", processedCount);
    }

    /**
     * Listen for XP events and check stage badge eligibility.
     */
    @Async
    @EventListener
    public void handleXpAwardedEvent(XpAwardedEvent event) {
        checkStageBadge(event.userId(), event.newTotalXp());
    }

    /**
     * Check and award Helper badge (20 helpful comments).
     */
    private void checkHelperBadge(User user) {
        if (hasBadge(user.getId(), BADGE_HELPER_20)) {
            return;
        }

        // Count comments marked as helpful
        long helpfulCommentCount = commentRepository.countHelpfulByUserId(user.getId());
        
        if (helpfulCommentCount >= 20) {
            awardBadge(user.getId(), BADGE_HELPER_20, 
                    "Received 20+ helpful marks on comments");
        }
    }

    /**
     * Check and award Reviewer badge (5 reviews written).
     */
    private void checkReviewerBadge(User user) {
        if (hasBadge(user.getId(), BADGE_REVIEWER_5)) {
            return;
        }

        long reviewCount = reviewRepository.countByUserId(user.getId());
        
        if (reviewCount >= 5) {
            awardBadge(user.getId(), BADGE_REVIEWER_5, 
                    "Wrote 5+ reviews");
        }
    }

    /**
     * Check and award Contributor badge (50 posts).
     */
    private void checkContributorBadge(User user) {
        if (hasBadge(user.getId(), BADGE_CONTRIBUTOR_50)) {
            return;
        }
        
        // Count non-deleted posts by user
        long postCount = postRepository.countByUser_IdAndIsDeletedFalse(user.getId());
        
        if (postCount >= 50) {
            awardBadge(user.getId(), BADGE_CONTRIBUTOR_50, 
                    "Published 50+ posts in the community");
        }
    }

    /**
     * Check and award Elevation Stage badges based on XP.
     */
    private void checkStageBadge(UUID userId, int totalXp) {
        // Stage progression: Explorer (100) -> Guide (500) -> Expert (1500) -> Mentor (5000)
        
        if (totalXp >= 5000 && !hasBadge(userId, BADGE_MENTOR)) {
            awardBadge(userId, BADGE_MENTOR, "Reached 5000 XP");
        } else if (totalXp >= 1500 && !hasBadge(userId, BADGE_EXPERT)) {
            awardBadge(userId, BADGE_EXPERT, "Reached 1500 XP");
        } else if (totalXp >= 500 && !hasBadge(userId, BADGE_GUIDE)) {
            awardBadge(userId, BADGE_GUIDE, "Reached 500 XP");
        } else if (totalXp >= 100 && !hasBadge(userId, BADGE_EXPLORER)) {
            awardBadge(userId, BADGE_EXPLORER, "Reached 100 XP");
        }
    }

    /**
     * Award a badge to a user.
     */
    @Transactional
    public void awardBadge(UUID userId, String badgeSlug, String reason) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        BadgeDefinition badge = badgeDefinitionRepository.findBySlug(badgeSlug)
                .orElseThrow(() -> new IllegalArgumentException("Badge not found: " + badgeSlug));

        // Check if already has this badge
        if (userBadgeRepository.existsByUserIdAndBadgeId(userId, badge.getId())) {
            log.debug("User {} already has badge {}", userId, badgeSlug);
            return;
        }

        UserBadge userBadge = UserBadge.builder()
                .user(user)
                .badge(badge)
                .awardedAt(Instant.now())
                .awardReason(reason)
                .isPinned(false)
                .build();
        
        userBadgeRepository.save(userBadge);

        // Award XP for badge if configured
        if (badge.getXpReward() != null && badge.getXpReward() > 0) {
            xpService.awardXp(userId, badge.getXpReward(), 
                    UserXpHistory.SourceType.BADGE_AWARD,
                    badge.getId(),
                    "Earned badge: " + badge.getName());
        }

        log.info("Badge awarded: userId={}, badge={}, xpReward={}", 
                userId, badgeSlug, badge.getXpReward());
    }

    /**
     * Check if user has a specific badge.
     */
    private boolean hasBadge(UUID userId, String badgeSlug) {
        return userBadgeRepository.existsByUserIdAndBadgeSlug(userId, badgeSlug);
    }

    /**
     * Get user's pinned badges for profile display.
     */
    @Transactional(readOnly = true)
    public List<UserBadge> getPinnedBadges(UUID userId) {
        return userBadgeRepository.findByUserIdAndIsPinnedTrue(userId);
    }

    /**
     * Get all badges for a user.
     */
    @Transactional(readOnly = true)
    public List<UserBadge> getAllBadges(UUID userId) {
        return userBadgeRepository.findByUserId(userId);
    }

    /**
     * Toggle badge pinned status.
     */
    @Transactional
    public void toggleBadgePin(UUID userId, UUID badgeId, boolean pinned) {
        UserBadge userBadge = userBadgeRepository.findByUserIdAndBadgeId(userId, badgeId)
                .orElseThrow(() -> new IllegalArgumentException("Badge not found for user"));
        
        userBadge.setPinned(pinned);
        userBadgeRepository.save(userBadge);
    }

    /**
     * Toggle badge pinned status (auto-toggles current state).
     */
    @Transactional
    public void toggleBadgePin(UUID userId, UUID badgeId) {
        UserBadge userBadge = userBadgeRepository.findByUserIdAndBadgeId(userId, badgeId)
                .orElseThrow(() -> new IllegalArgumentException("Badge not found for user"));
        
        userBadge.setPinned(!userBadge.isPinned());
        userBadgeRepository.save(userBadge);
        
        log.info("Badge pin toggled: userId={}, badgeId={}, newPinnedState={}", 
                userId, badgeId, userBadge.isPinned());
    }

    /**
     * Event record for XP award notifications.
     */
    public record XpAwardedEvent(
        UUID userId,
        int xpDelta,
        int newTotalXp,
        Instant timestamp
    ) {}
}
