package com.nbh.backend.service;

import com.nbh.backend.dto.HomestayQuestionDto;
import com.nbh.backend.dto.HomestayAnswerDto;
import com.nbh.backend.model.Homestay;
import com.nbh.backend.model.HomestayQuestion;
import com.nbh.backend.model.HomestayAnswer;
import com.nbh.backend.model.User;
import com.nbh.backend.repository.HomestayRepository;
import com.nbh.backend.repository.HomestayQuestionRepository;
import com.nbh.backend.repository.HomestayAnswerRepository;
import com.nbh.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;

@Service
@RequiredArgsConstructor
public class HomestayQuestionService {

    private final HomestayQuestionRepository questionRepository;
    private final HomestayAnswerRepository answerRepository;
    private final HomestayRepository homestayRepository;
    private final UserRepository userRepository;

    @CacheEvict(value = "homestayQA", key = "#homestayId")
    public HomestayQuestionDto askQuestion(UUID homestayId, String text, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Homestay homestay = homestayRepository.findById(homestayId)
                .orElseThrow(() -> new RuntimeException("Homestay not found"));

        HomestayQuestion question = HomestayQuestion.builder()
                .homestay(homestay)
                .user(user)
                .text(text)
                .build();

        return mapToQuestionDto(questionRepository.save(question));
    }

    @CacheEvict(value = "homestayQA", allEntries = true)
    public HomestayQuestionDto updateQuestion(UUID questionId, String text, String userEmail) {
        HomestayQuestion question = questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Question not found"));
        if (!question.getUser().getEmail().equals(userEmail)) {
            throw new RuntimeException("Not authorized to update this question");
        }
        question.setText(text);
        return mapToQuestionDto(questionRepository.save(question));
    }

    @CacheEvict(value = "homestayQA", allEntries = true)
    public void deleteQuestion(UUID questionId, String userEmail) {
        HomestayQuestion question = questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Question not found"));
        User user = userRepository.findByEmail(userEmail).orElseThrow();
        // Allow owner of question or admin to delete
        if (!question.getUser().getEmail().equals(userEmail) && user.getRole() != User.Role.ROLE_ADMIN) {
            throw new RuntimeException("Not authorized to delete this question");
        }
        questionRepository.delete(question);
    }

    @CacheEvict(value = "homestayQA", allEntries = true)
    public HomestayAnswerDto answerQuestion(UUID questionId, String text, String userEmail) {
        HomestayQuestion question = questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Question not found"));
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        HomestayAnswer answer = HomestayAnswer.builder()
                .question(question)
                .user(user)
                .text(text)
                .build();

        return mapToAnswerDto(answerRepository.save(answer));
    }

    @CacheEvict(value = "homestayQA", allEntries = true)
    public HomestayAnswerDto updateAnswer(UUID answerId, String text, String userEmail) {
        HomestayAnswer answer = answerRepository.findById(answerId)
                .orElseThrow(() -> new RuntimeException("Answer not found"));
        if (!answer.getUser().getEmail().equals(userEmail)) {
            throw new RuntimeException("Not authorized to update this answer");
        }
        answer.setText(text);
        return mapToAnswerDto(answerRepository.save(answer));
    }

    @CacheEvict(value = "homestayQA", allEntries = true)
    public void deleteAnswer(UUID answerId, String userEmail) {
        HomestayAnswer answer = answerRepository.findById(answerId)
                .orElseThrow(() -> new RuntimeException("Answer not found"));
        User user = userRepository.findByEmail(userEmail).orElseThrow();
        if (!answer.getUser().getEmail().equals(userEmail) && user.getRole() != User.Role.ROLE_ADMIN) {
            throw new RuntimeException("Not authorized to delete this answer");
        }
        answerRepository.delete(answer);
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    @Cacheable(value = "homestayQA", key = "#homestayId", sync = true)
    public List<HomestayQuestionDto> getQuestionsByHomestay(UUID homestayId) {
        return questionRepository.findByHomestayIdOrderByCreatedAtDesc(homestayId).stream()
                .map(this::mapToQuestionDto)
                .collect(Collectors.toList());
    }

    private HomestayQuestionDto mapToQuestionDto(HomestayQuestion question) {
        return HomestayQuestionDto.builder()
                .id(question.getId())
                .text(question.getText())
                .createdAt(question.getCreatedAt())
                .userFirstName(question.getUser().getFirstName())
                .userLastName(question.getUser().getLastName())
                .answers(question.getAnswers() != null
                        ? question.getAnswers().stream().map(this::mapToAnswerDto).collect(Collectors.toList())
                        : List.of())
                .build();
    }

    private HomestayAnswerDto mapToAnswerDto(HomestayAnswer answer) {
        boolean isHost = answer.getQuestion().getHomestay().getOwner().getId().equals(answer.getUser().getId());
        return HomestayAnswerDto.builder()
                .id(answer.getId())
                .text(answer.getText())
                .createdAt(answer.getCreatedAt())
                .userFirstName(answer.getUser().getFirstName())
                .userLastName(answer.getUser().getLastName())
                .isHost(isHost)
                .build();
    }
}
