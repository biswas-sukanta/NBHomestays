package com.nbh.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class HomestayQuestionDto {
    private UUID id;
    private String text;
    private LocalDateTime createdAt;
    private String userFirstName;
    private String userLastName;
    private List<HomestayAnswerDto> answers;
}
