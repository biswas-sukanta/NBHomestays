package com.nbh.backend.dto;

import com.nbh.backend.model.Booking;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public class BookingDto {

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Request {
        private UUID homestayId;
        private LocalDate checkInDate;
        private LocalDate checkOutDate;
        private Integer guests;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Response {
        private UUID id;
        private UUID homestayId;
        private String homestayTitle;
        private LocalDate checkInDate;
        private LocalDate checkOutDate;
        private Integer guests;
        private BigDecimal totalPrice;
        private Booking.Status status;
    }
}
