package com.nbh.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AsyncJobPayload {
    @Builder.Default
    private List<String> fileIds = List.of();
    private String targetFolder;
}
