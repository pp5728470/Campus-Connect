package com.campusconnect.dto.topic;

import java.time.Instant;

public record TopicResponse(
        Long id,
        Long classroomId,
        String name,
        int sortOrder,
        Instant createdAt
) {
}
