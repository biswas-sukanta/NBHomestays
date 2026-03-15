package com.nbh.backend.controller;

import com.nbh.backend.dto.HostProfileDto;
import com.nbh.backend.dto.XpHistoryDto;
import com.nbh.backend.model.UserXpHistory;
import com.nbh.backend.service.FollowService;
import com.nbh.backend.service.ProfileService;
import com.nbh.backend.service.UserService;
import com.nbh.backend.service.BadgeService;
import com.nbh.backend.service.XpService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final ProfileService profileService;
    private final FollowService followService;
    private final BadgeService badgeService;
    private final XpService xpService;

    @GetMapping("/{id}/profile")
    public HostProfileDto getPublicProfile(@PathVariable("id") UUID id, Authentication authentication) {
        UUID viewerUserId = null;
        if (authentication != null && authentication.getName() != null) {
            viewerUserId = userService.findUserIdByEmail(authentication.getName());
        }
        return profileService.getProfile(id, viewerUserId);
    }

    @PutMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public void updateProfile(@RequestBody Map<String, String> updates, Authentication authentication) {
        userService.updateProfile(authentication.getName(), updates);
    }

    @PostMapping("/{id}/follow")
    @PreAuthorize("isAuthenticated()")
    public void follow(@PathVariable("id") UUID id, Authentication authentication) {
        UUID currentUserId = userService.findUserIdByEmail(authentication.getName());
        followService.followUser(currentUserId, id);
    }

    @DeleteMapping("/{id}/follow")
    @PreAuthorize("isAuthenticated()")
    public void unfollow(@PathVariable("id") UUID id, Authentication authentication) {
        UUID currentUserId = userService.findUserIdByEmail(authentication.getName());
        followService.unfollowUser(currentUserId, id);
    }

    @PutMapping("/badges/{badgeId}/pin")
    @PreAuthorize("isAuthenticated()")
    public void toggleBadgePin(@PathVariable("badgeId") UUID badgeId, Authentication authentication) {
        UUID userId = userService.findUserIdByEmail(authentication.getName());
        badgeService.toggleBadgePin(userId, badgeId);
    }

    @GetMapping("/{id}/xp-history")
    public XpHistoryDto getXpHistory(@PathVariable("id") UUID id) {
        return xpService.getXpHistory(id);
    }

    @GetMapping("/{id}/xp-history/{sourceType}")
    public XpHistoryDto getXpHistoryByType(
            @PathVariable("id") UUID id,
            @PathVariable("sourceType") String sourceType) {
        UserXpHistory.SourceType type = UserXpHistory.SourceType.valueOf(sourceType.toUpperCase());
        return xpService.getXpHistoryByType(id, type);
    }
}
