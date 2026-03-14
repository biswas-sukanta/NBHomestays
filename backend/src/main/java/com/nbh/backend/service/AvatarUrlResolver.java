package com.nbh.backend.service;

import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.UUID;

@Service
public class AvatarUrlResolver {

    public String resolveUserAvatar(UUID userId, String avatarUrl) {
        return resolveUserAvatar(userId, avatarUrl, null);
    }

    public String resolveUserAvatar(UUID userId, String avatarUrl, String displayName) {
        if (avatarUrl != null && !avatarUrl.isBlank()) {
            return avatarUrl;
        }
        return generateFallbackAvatar(userId, displayName);
    }

    public String generateFallbackAvatar(UUID userId) {
        return generateFallbackAvatar(userId, null);
    }

    public String generateFallbackAvatar(UUID userId, String displayName) {
        String seed = userId != null ? userId.toString() : "guest";
        int hash = computeConsistentHash(seed);
        String topColor = hsl(hash % 360, 62, 52);
        String bottomColor = hsl((hash + 47) % 360, 68, 38);
        String initials = buildInitials(displayName);
        String svg = """
                <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
                  <defs>
                    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%%" stop-color="%s"/>
                      <stop offset="100%%" stop-color="%s"/>
                    </linearGradient>
                  </defs>
                  <rect width="160" height="160" rx="80" fill="url(#g)"/>
                  <text x="50%%" y="54%%" dominant-baseline="middle" text-anchor="middle"
                        fill="#ffffff" font-family="Arial, sans-serif" font-size="52" font-weight="700">%s</text>
                </svg>
                """.formatted(topColor, bottomColor, escapeXml(initials));
        return "data:image/svg+xml;base64," + Base64.getEncoder().encodeToString(svg.getBytes(StandardCharsets.UTF_8));
    }

    private int computeConsistentHash(String seed) {
        int hash = 0;
        for (int i = 0; i < seed.length(); i++) {
            hash = seed.charAt(i) + ((hash << 5) - hash);
            hash |= 0;
        }
        return Math.abs(hash);
    }

    private String buildInitials(String displayName) {
        if (displayName == null || displayName.isBlank()) {
            return "NB";
        }
        String[] parts = displayName.trim().split("\\s+");
        StringBuilder initials = new StringBuilder();
        for (String part : parts) {
            if (!part.isBlank()) {
                initials.append(Character.toUpperCase(part.charAt(0)));
            }
            if (initials.length() == 2) {
                break;
            }
        }
        return initials.isEmpty() ? "NB" : initials.toString();
    }

    private String hsl(int hue, int saturation, int lightness) {
        return "hsl(" + hue + " " + saturation + "% " + lightness + "%)";
    }

    private String escapeXml(String value) {
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&apos;");
    }
}
