package com.nbh.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class QuestionDto {
    private UUID id;
    private String questionText;
    private String answerText;
    private boolean answeredByOwner;
    private LocalDateTime createdAt;
    private String userFirstName;
    private String userLastName;
}
