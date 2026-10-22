package com.campusconnect.dto.material;

import com.campusconnect.dto.file.FileResponse;

import java.time.Instant;
import java.util.List;

public record MaterialResponse(
        Long id,
        Long classroomId,
        Long topicId,
        String topicName,
        String title,
        String description,
        Long createdById,
        String createdByName,
        List<FileResponse> files,
        Instant createdAt,
        Instant updatedAt
) {
}
