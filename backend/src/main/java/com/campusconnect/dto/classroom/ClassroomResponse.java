package com.campusconnect.dto.classroom;

import com.campusconnect.entity.ClassRole;

import java.time.Instant;

public record ClassroomResponse(
        Long id,
        String name,
        String section,
        String subject,
        String room,
        String description,
        String classCode,
        String bannerColor,
        boolean archived,
        Instant createdAt,
        Long ownerId,
        String ownerName,
        ClassRole myRole
) {
}
