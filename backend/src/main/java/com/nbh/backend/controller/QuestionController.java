package com.nbh.backend.controller;

import com.nbh.backend.dto.QuestionDto;
import com.nbh.backend.service.QuestionService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionService questionService;

    @PostMapping("/homestays/{id}/ask")
    public ResponseEntity<QuestionDto> askQuestion(
            @PathVariable UUID id,
            @RequestBody QuestionRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(questionService.askQuestion(id, request.getText(), authentication.getName()));
    }

    @PutMapping("/questions/{id}/answer")
    @PreAuthorize("hasRole('HOST')")
    public ResponseEntity<QuestionDto> answerQuestion(
            @PathVariable UUID id,
            @RequestBody QuestionRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(questionService.answerQuestion(id, request.getText(), authentication.getName()));
    }

    @GetMapping("/homestays/{id}/questions")
    public ResponseEntity<List<QuestionDto>> getQuestions(@PathVariable UUID id) {
        return ResponseEntity.ok(questionService.getQuestionsByHomestay(id));
    }

    @Data
    public static class QuestionRequest {
        private String text;
    }
}
