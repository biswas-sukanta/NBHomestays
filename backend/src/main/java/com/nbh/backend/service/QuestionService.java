package com.nbh.backend.service;

import com.nbh.backend.model.Homestay;
import com.nbh.backend.model.Question;
import com.nbh.backend.model.User;
import com.nbh.backend.repository.HomestayRepository;
import com.nbh.backend.repository.QuestionRepository;
import com.nbh.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class QuestionService {

    private final QuestionRepository questionRepository;
    private final HomestayRepository homestayRepository;
    private final UserRepository userRepository;

    public Question askQuestion(UUID homestayId, String questionText, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Homestay homestay = homestayRepository.findById(homestayId)
                .orElseThrow(() -> new RuntimeException("Homestay not found"));

        Question question = Question.builder()
                .homestay(homestay)
                .user(user)
                .questionText(questionText)
                .build();

        return questionRepository.save(question);
    }

    public Question answerQuestion(UUID questionId, String answerText, String userEmail) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Question not found"));

        // Verify user is owner
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!question.getHomestay().getOwner().getId().equals(user.getId())) {
            throw new RuntimeException("Only owner can answer");
        }

        question.setAnswerText(answerText);
        question.setAnsweredByOwner(true);
        return questionRepository.save(question);
    }

    public List<Question> getQuestionsByHomestay(UUID homestayId) {
        return questionRepository.findByHomestayId(homestayId);
    }
}
