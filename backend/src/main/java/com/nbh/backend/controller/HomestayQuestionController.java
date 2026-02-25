package com.nbh.backend.controller;

import com.nbh.backend.dto.HomestayQuestionDto;
import com.nbh.backend.dto.HomestayAnswerDto;
import com.nbh.backend.service.HomestayQuestionService;
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
public class HomestayQuestionController {

    private final HomestayQuestionService questionService;

    // --- Questions ---

    @PostMapping("/homestays/{id}/questions")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<HomestayQuestionDto> askQuestion(
            @PathVariable("id") UUID id,
            @RequestBody QnAContentRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(questionService.askQuestion(id, request.getText(), authentication.getName()));
    }

    @PutMapping("/questions/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<HomestayQuestionDto> updateQuestion(
            @PathVariable("id") UUID id,
            @RequestBody QnAContentRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(questionService.updateQuestion(id, request.getText(), authentication.getName()));
    }

    @DeleteMapping("/questions/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteQuestion(
            @PathVariable("id") UUID id,
            Authentication authentication) {
        questionService.deleteQuestion(id, authentication.getName());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/homestays/{id}/questions")
    public ResponseEntity<List<HomestayQuestionDto>> getQuestions(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(questionService.getQuestionsByHomestay(id));
    }

    // --- Answers ---

    @PostMapping("/questions/{id}/answers")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<HomestayAnswerDto> answerQuestion(
            @PathVariable("id") UUID id,
            @RequestBody QnAContentRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(questionService.answerQuestion(id, request.getText(), authentication.getName()));
    }

    @PutMapping("/answers/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<HomestayAnswerDto> updateAnswer(
            @PathVariable("id") UUID id,
            @RequestBody QnAContentRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(questionService.updateAnswer(id, request.getText(), authentication.getName()));
    }

    @DeleteMapping("/answers/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteAnswer(
            @PathVariable("id") UUID id,
            Authentication authentication) {
        questionService.deleteAnswer(id, authentication.getName());
        return ResponseEntity.ok().build();
    }

    @Data
    public static class QnAContentRequest {
        private String text;
    }
}
