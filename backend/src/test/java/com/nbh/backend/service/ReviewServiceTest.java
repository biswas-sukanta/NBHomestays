package com.nbh.backend.service;

import com.nbh.backend.dto.ReviewDto;
import com.nbh.backend.model.Homestay;
import com.nbh.backend.model.Review;
import com.nbh.backend.model.User;
import com.nbh.backend.repository.HomestayRepository;
import com.nbh.backend.repository.ReviewRepository;
import com.nbh.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReviewServiceTest {

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private HomestayRepository homestayRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private VibeService vibeService;

    @InjectMocks
    private ReviewService reviewService;

    @Test
    void addReview_ShouldSaveReviewAndTriggerVibeUpdate() {
        // Arrange
        UUID homestayId = UUID.randomUUID();
        String userEmail = "test@example.com";

        ReviewDto.Request request = new ReviewDto.Request();
        request.setHomestayId(homestayId);
        request.setRating(5);
        request.setComment("Great!");
        request.setPhotoUrls(java.util.List.of("http://example.com/photo.jpg"));

        User user = new User();
        user.setEmail(userEmail);
        user.setFirstName("John");
        user.setLastName("Doe");

        Homestay homestay = new Homestay();
        homestay.setId(homestayId);

        when(userRepository.findByEmail(userEmail)).thenReturn(Optional.of(user));
        when(homestayRepository.findById(homestayId)).thenReturn(Optional.of(homestay));
        when(reviewRepository.save(any(Review.class))).thenAnswer(i -> i.getArguments()[0]);

        // Act
        reviewService.addReview(request, userEmail);

        // Assert
        verify(reviewRepository).save(any(Review.class));
        verify(vibeService).updateVibeScoreAsync(homestayId);
    }
}
