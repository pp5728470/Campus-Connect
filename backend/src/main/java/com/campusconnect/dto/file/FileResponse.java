package com.campusconnect.dto.file;

import java.time.Instant;

public record FileResponse(
        Long id,
        String originalName,
        String contentType,
        long sizeBytes,
        Instant createdAt
) {
}
