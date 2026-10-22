package com.campusconnect.dto.classroom;

import com.campusconnect.entity.ClassRole;

import java.time.Instant;

public record ClassroomMemberResponse(
        Long userId,
        String fullName,
        String email,
        String avatarUrl,
        ClassRole roleInClass,
        Instant joinedAt
) {
}
