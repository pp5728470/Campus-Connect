package com.campusconnect.dto.announcement;

import java.time.Instant;

public record CommentResponse(
        Long id,
        Long authorId,
        String authorName,
        String body,
        Instant createdAt
) {
}
