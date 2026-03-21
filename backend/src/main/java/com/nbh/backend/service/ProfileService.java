package com.nbh.backend.service;

import com.nbh.backend.dto.BadgeDto;
import com.nbh.backend.dto.HostProfileDto;
import com.nbh.backend.model.BadgeDefinition;
import com.nbh.backend.model.BadgeDefinition.BadgeType;
import com.nbh.backend.model.User;
import com.nbh.backend.model.UserBadge;
import com.nbh.backend.repository.BadgeDefinitionRepository;
import com.nbh.backend.repository.PostRepository;
import com.nbh.backend.repository.UserFollowRepository;
import com.nbh.backend.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;
    private final UserFollowRepository userFollowRepository;
    private final PostRepository postRepository;
    private final HomestayService homestayService;
    private final PostService postService;
    private final AvatarUrlResolver avatarUrlResolver;
    private final BadgeService badgeService;
    private final BadgeDefinitionRepository badgeDefinitionRepository;

    // Cached stage definitions loaded from database
    private List<StageInfo> stages;

    @PostConstruct
    public void init() {
        loadStages();
    }

    /**
     * Load stage definitions from database (badge_definitions with type STAGE).
     */
    public void loadStages() {
        try {
            List<BadgeDefinition> stageBadges = badgeDefinitionRepository
                    .findByBadgeTypeOrderByStageNumberAsc(BadgeType.STAGE);
            
            if (stageBadges.isEmpty()) {
                log.warn("No stage badges found in database, using fallback defaults");
                stages = List.of(
                    new StageInfo(0, "Newcomer", "/icons/stages/newcomer.svg")
                );
            } else {
                stages = stageBadges.stream()
                        .map(b -> new StageInfo(
                                b.getMinXpThreshold() != null ? b.getMinXpThreshold() : 0,
                                b.getName(),
                                b.getIconUrl()))
                        .toList();
                log.info("Loaded {} stage definitions from database", stages.size());
            }
        } catch (Exception e) {
            log.error("Failed to load stages from database", e);
            stages = List.of(
                new StageInfo(0, "Newcomer", "/icons/stages/newcomer.svg")
            );
        }
    }

    /**
     * Stage information for the Elevation Engine.
     */
    public record StageInfo(int minXP, String title, String iconUrl) {}

    @Transactional(readOnly = true)
    public HostProfileDto getProfile(UUID userId, UUID viewerUserId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        long followersCount = userFollowRepository.countByFollowedUserId(userId);
        long followingCount = userFollowRepository.countByFollowerUserId(userId);
        long postCount = postRepository.countByUser_IdAndIsDeletedFalse(userId);
        var postsPage = postService.getPostsByUser(user.getEmail(), PageRequest.of(0, 20));

        // Compute stage based on total XP
        StageInfo stage = computeStage(user.getTotalXp());
        Integer xpToNextStage = computeXpToNextStage(user.getTotalXp());

        // Get pinned badges
        List<BadgeDto> pinnedBadges = badgeService.getPinnedBadges(userId).stream()
                .map(this::toBadgeDto)
                .collect(Collectors.toList());

        // Get all badges
        List<BadgeDto> allBadges = badgeService.getAllBadges(userId).stream()
                .map(this::toBadgeDto)
                .collect(Collectors.toList());

        return HostProfileDto.builder()
                // Basic profile fields
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .username(buildUsername(user))
                .avatar(avatarUrlResolver.resolveUserAvatar(user.getId(), user.getAvatarUrl(), buildDisplayName(user)))
                .bio(user.getBio())
                .communityPoints(user.getCommunityPoints())
                .badges(user.getLegacyBadges())
                .verifiedHost(user.isVerifiedHost())
                .followersCount(followersCount)
                .followingCount(followingCount)
                .postCount(postCount)
                .isFollowing(viewerUserId != null
                        && userFollowRepository.isFollowing(viewerUserId, userId))
                .homestays(homestayService.getHomestaysByOwner(user.getEmail(), PageRequest.of(0, 10)).getContent())
                .posts(postsPage.getContent())
                // Frictionless profile fields
                .displayName(user.getDisplayName())
                .location(user.getLocation())
                .languages(user.getLanguages())
                .interests(user.getInterests())
                .travellerType(user.getTravellerType() != null ? user.getTravellerType().name() : null)
                .socialLinks(user.getSocialLinks())
                .verificationStatus(user.getVerificationStatus() != null 
                        ? user.getVerificationStatus().name() : null)
                // Gamification fields
                .totalXp(user.getTotalXp())
                .currentStageTitle(stage.title())
                .currentStageIconUrl(stage.iconUrl())
                .xpToNextStage(xpToNextStage)
                .pinnedBadges(pinnedBadges)
                .allBadges(allBadges)
                .build();
    }

    /**
     * Compute current stage based on total XP.
     */
    private StageInfo computeStage(Integer totalXp) {
        int xp = totalXp != null ? totalXp : 0;
        if (stages == null || stages.isEmpty()) {
            return new StageInfo(0, "Newcomer", "/icons/stages/newcomer.svg");
        }
        StageInfo current = stages.get(0);
        for (StageInfo stage : stages) {
            if (xp >= stage.minXP()) {
                current = stage;
            }
        }
        return current;
    }

    /**
     * Compute XP needed to reach next stage.
     */
    private Integer computeXpToNextStage(Integer totalXp) {
        int xp = totalXp != null ? totalXp : 0;
        if (stages == null || stages.isEmpty()) {
            return null;
        }
        for (StageInfo stage : stages) {
            if (stage.minXP() > xp) {
                return stage.minXP() - xp;
            }
        }
        return null; // Already at max stage
    }

    /**
     * Convert UserBadge to BadgeDto.
     */
    private BadgeDto toBadgeDto(UserBadge userBadge) {
        BadgeDefinition badge = userBadge.getBadge();
        return BadgeDto.builder()
                .id(badge.getId())
                .name(badge.getName())
                .slug(badge.getSlug())
                .iconUrl(badge.getIconUrl())
                .description(badge.getDescription())
                .badgeType(badge.getBadgeType() != null ? badge.getBadgeType().name() : null)
                .xpReward(badge.getXpReward())
                .stageNumber(badge.getStageNumber())
                .awardedAt(userBadge.getAwardedAt())
                .isPinned(userBadge.isPinned())
                .awardReason(userBadge.getAwardReason())
                .build();
    }

    private String buildDisplayName(User user) {
        String firstName = user.getFirstName() == null ? "" : user.getFirstName().trim();
        String lastName = user.getLastName() == null ? "" : user.getLastName().trim();
        String fullName = (firstName + (lastName.isBlank() ? "" : " " + lastName)).trim();
        if (!fullName.isBlank()) {
            return fullName;
        }
        String email = user.getEmail() == null ? "" : user.getEmail();
        int at = email.indexOf('@');
        return at > 0 ? email.substring(0, at) : email;
    }

    private String buildUsername(User user) {
        String firstName = user.getFirstName() == null ? "" : user.getFirstName().trim().toLowerCase().replace(' ', '-');
        String lastName = user.getLastName() == null ? "" : user.getLastName().trim().toLowerCase().replace(' ', '-');
        String combined = (firstName + (lastName.isBlank() ? "" : "-" + lastName)).replaceAll("^-+|-+$", "");
        if (!combined.isBlank()) {
            return combined;
        }
        if (!user.isShowEmail()) {
            String id = user.getId() != null ? user.getId().toString() : "guest";
            return "Traveler_" + id.substring(0, Math.min(5, id.length()));
        }
        String email = user.getEmail() == null ? "" : user.getEmail();
        int at = email.indexOf('@');
        return at > 0 ? email.substring(0, at) : email;
    }
}
