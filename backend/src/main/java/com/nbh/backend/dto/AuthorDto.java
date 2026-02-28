package com.nbh.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuthorDto {
    private UUID id;
    private String name;
    private String role;
    private String avatarUrl;
}
