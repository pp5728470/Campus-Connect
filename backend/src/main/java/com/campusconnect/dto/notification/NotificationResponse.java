package com.campusconnect.dto.notification;

import com.campusconnect.entity.NotificationType;

import java.time.Instant;

public record NotificationResponse(
        Long id,
        NotificationType type,
        String title,
        String body,
        String link,
        Long classroomId,
        boolean read,
        Instant createdAt
) {
}