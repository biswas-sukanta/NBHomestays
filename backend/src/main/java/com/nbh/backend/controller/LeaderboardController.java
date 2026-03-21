package com.nbh.backend.controller;

import com.nbh.backend.dto.LeaderboardEntryDto;
import com.nbh.backend.model.BadgeDefinition;
import com.nbh.backend.model.BadgeDefinition.BadgeType;
import com.nbh.backend.repository.BadgeDefinitionRepository;
import com.nbh.backend.repository.PostRepository;
import com.nbh.backend.repository.UserFollowRepository;
import com.nbh.backend.repository.UserRepository;
import com.nbh.backend.service.AvatarUrlResolver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

/**
 * Leaderboard Controller for the Community.
 * 
 * Provides the top 50 users ranked by total XP with gamification data.
 */
@RestController
@RequestMapping("/api/community")
@RequiredArgsConstructor
@Slf4j
public class LeaderboardController {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final UserFollowRepository userFollowRepository;
    private final BadgeDefinitionRepository badgeDefinitionRepository;
    private final AvatarUrlResolver avatarUrlResolver;

    // Cache enabled flag - bypassed when Redis is disabled locally
    @Value("${app.cache.redis.enabled:true}")
    private boolean cacheEnabled;

    // Cached stage definitions for computing stages on the fly
    private List<StageInfo> stages;

    /**
     * Get the community leaderboard - top users by XP.
     * Cached for 15 minutes when Redis is enabled.
     * 
     * @param limit Maximum number of entries to return (default: 50, max: 50)
     */
    @GetMapping("/leaderboard")
    public ResponseEntity<List<LeaderboardEntryDto>> getLeaderboard(
            @RequestParam(value = "limit", defaultValue = "50") int limit) {
        log.info("Fetching community leaderboard with limit: {}", limit);
        
        // Clamp limit to reasonable bounds
        int effectiveLimit = Math.min(Math.max(limit, 1), 50);
        
        // Load stages if not cached
        if (stages == null || stages.isEmpty()) {
            loadStages();
        }
        
        // Fetch top users by computed XP with limit.
        Page<UserRepository.LeaderboardProjection> topUsers = userRepository.findLeaderboard(PageRequest.of(0, effectiveLimit));
        
        List<LeaderboardEntryDto> entries = new ArrayList<>();
        int rank = 1;
        
        for (UserRepository.LeaderboardProjection user : topUsers.getContent()) {
            int totalXp = user.getTotalXp() != null ? user.getTotalXp() : 0;
            StageInfo stage = computeStage(totalXp);
            
            String displayName = String.join(" ", 
                    user.getFirstName() != null ? user.getFirstName() : "",
                    user.getLastName() != null ? user.getLastName() : "").trim();
            
            if (displayName.isEmpty()) {
                displayName = "Traveler";
            }
            
            String avatarUrl = avatarUrlResolver.resolveUserAvatar(user.getId(), user.getAvatarUrl(), displayName);
            
            long postCount = postRepository.countByUser_IdAndIsDeletedFalse(user.getId());
            long followersCount = userFollowRepository.countByFollowedUserId(user.getId());
            
            LeaderboardEntryDto entry = LeaderboardEntryDto.builder()
                    .rank(rank++)
                    .userId(user.getId())
                    .displayName(displayName)
                    .avatarUrl(avatarUrl)
                    .totalXp(totalXp)
                    .stageTitle(stage.title())
                    .stageIconUrl(stage.iconUrl())
                    .postCount(postCount)
                    .followersCount(followersCount)
                    .build();
            
            entries.add(entry);
        }
        
        log.info("Returning {} leaderboard entries", entries.size());
        return ResponseEntity.ok(entries);
    }

    /**
     * Load stage definitions from database.
     */
    private void loadStages() {
        try {
            List<BadgeDefinition> stageBadges = badgeDefinitionRepository
                    .findByBadgeTypeOrderByStageNumberAsc(BadgeType.STAGE);
            
            if (stageBadges.isEmpty()) {
                stages = List.of(new StageInfo(0, "Newcomer", "/icons/stages/newcomer.svg"));
            } else {
                stages = stageBadges.stream()
                        .map(b -> new StageInfo(
                                b.getMinXpThreshold() != null ? b.getMinXpThreshold() : 0,
                                b.getName(),
                                b.getIconUrl()))
                        .toList();
            }
            log.info("Loaded {} stage definitions for leaderboard", stages.size());
        } catch (Exception e) {
            log.error("Failed to load stages for leaderboard", e);
            stages = List.of(new StageInfo(0, "Newcomer", "/icons/stages/newcomer.svg"));
        }
    }

    /**
     * Compute current stage based on total XP.
     */
    private StageInfo computeStage(int totalXp) {
        if (stages == null || stages.isEmpty()) {
            return new StageInfo(0, "Newcomer", "/icons/stages/newcomer.svg");
        }
        
        StageInfo current = stages.get(0);
        for (StageInfo stage : stages) {
            if (totalXp >= stage.minXp()) {
                current = stage;
            }
        }
        return current;
    }

    /**
     * Stage information record.
     */
    private record StageInfo(int minXp, String title, String iconUrl) {}
}
