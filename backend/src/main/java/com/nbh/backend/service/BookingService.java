package com.nbh.backend.service;

import com.nbh.backend.dto.BookingDto;
import com.nbh.backend.model.Booking;
import com.nbh.backend.model.Homestay;
import com.nbh.backend.model.User;
import com.nbh.backend.repository.BookingRepository;
import com.nbh.backend.repository.HomestayRepository;
import com.nbh.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingService {

        private final BookingRepository bookingRepository;
        private final HomestayRepository homestayRepository;
        private final UserRepository userRepository;

        public BookingDto.Response createBooking(BookingDto.Request request, String userEmail) {
                User user = userRepository.findByEmail(userEmail)
                                .orElseThrow(() -> new RuntimeException("User not found"));
                Homestay homestay = homestayRepository.findById(request.getHomestayId())
                                .orElseThrow(() -> new RuntimeException("Homestay not found"));

                long days = ChronoUnit.DAYS.between(request.getCheckInDate(), request.getCheckOutDate());
                if (days <= 0) {
                        throw new RuntimeException("Invalid date range");
                }
                BigDecimal totalPrice = new BigDecimal(homestay.getPricePerNight() * days);

                Booking booking = Booking.builder()
                                .user(user)
                                .homestay(homestay)
                                .checkInDate(request.getCheckInDate())
                                .checkOutDate(request.getCheckOutDate())
                                .guests(request.getGuests())
                                .totalPrice(totalPrice)
                                .status(Booking.Status.CONFIRMED) // Auto-confirm for now
                                .createdAt(LocalDateTime.now())
                                .build();

                Booking saved = bookingRepository.save(booking);

                // Email notification (simulated)
                log.info("Sending email to {} for booking at {}", user.getEmail(), homestay.getName());

                return mapToResponse(saved);
        }

        public List<BookingDto.Response> getUserBookings(String userEmail) {
                User user = userRepository.findByEmail(userEmail)
                                .orElseThrow(() -> new RuntimeException("User not found"));
                return bookingRepository.findByUserId(user.getId()).stream()
                                .map(this::mapToResponse)
                                .collect(Collectors.toList());
        }

        // For Host/Admin to see bookings for a homestay
        public List<BookingDto.Response> getHomestayBookings(UUID homestayId) {
                return bookingRepository.findByHomestayId(homestayId).stream()
                                .map(this::mapToResponse)
                                .collect(Collectors.toList());
        }

        private BookingDto.Response mapToResponse(Booking booking) {
                return BookingDto.Response.builder()
                                .id(booking.getId())
                                .homestayId(booking.getHomestay().getId())
                                .homestayTitle(booking.getHomestay().getName())
                                .checkInDate(booking.getCheckInDate())
                                .checkOutDate(booking.getCheckOutDate())
                                .guests(booking.getGuests())
                                .totalPrice(booking.getTotalPrice())
                                .status(booking.getStatus())
                                .build();
        }
}
