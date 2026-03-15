package com.nbh.backend.dto;

import com.nbh.backend.model.UserXpHistory;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * DTO for user XP history response.
 */
@Data
@Builder
public class XpHistoryDto {
    
    private List<XpEntry> entries;
    private int totalEntries;
    private int totalXp;
    
    @Data
    @Builder
    public static class XpEntry {
        private UUID id;
        private String sourceType;
        private UUID sourceId;
        private int xpDelta;
        private String reason;
        private int balanceAfter;
        private Instant createdAt;
    }
    
    public static XpHistoryDto fromEntities(List<UserXpHistory> history, int totalXp) {
        List<XpEntry> entries = history.stream()
                .map(h -> XpEntry.builder()
                        .id(h.getId())
                        .sourceType(h.getSourceType().name())
                        .sourceId(h.getSourceId())
                        .xpDelta(h.getXpDelta())
                        .reason(h.getReason())
                        .balanceAfter(h.getBalanceAfter())
                        .createdAt(h.getCreatedAt())
                        .build())
                .toList();
        
        return XpHistoryDto.builder()
                .entries(entries)
                .totalEntries(entries.size())
                .totalXp(totalXp)
                .build();
    }
}
