package com.campusconnect.dto.user;

import com.campusconnect.entity.Role;

import java.time.Instant;

public record UserResponse(
        Long id,
        String fullName,
        String email,
        Role role,
        String avatarUrl,
        boolean active,
        Instant createdAt
) {
}
