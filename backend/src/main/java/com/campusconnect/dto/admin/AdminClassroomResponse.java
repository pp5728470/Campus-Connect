package com.campusconnect.dto.admin;

import java.time.Instant;

public record AdminClassroomResponse(
        Long id,
        String name,
        String section,
        String subject,
        String classCode,
        Long ownerId,
        String ownerName,
        boolean archived,
        long studentCount,
        Instant createdAt
) {
}