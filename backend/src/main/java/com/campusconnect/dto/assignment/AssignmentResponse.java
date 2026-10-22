package com.campusconnect.dto.assignment;

import com.campusconnect.dto.file.FileResponse;
import com.campusconnect.entity.SubmissionStatus;

import java.time.Instant;
import java.util.List;

public record AssignmentResponse(
        Long id,
        Long classroomId,
        String classroomName,
        Long topicId,
        String topicName,
        String title,
        String instructions,
        int maxPoints,
        Instant dueAt,
        boolean allowLate,
        Long createdById,
        String createdByName,
        List<FileResponse> attachments,
        SubmissionStatus mySubmissionStatus,
        Instant createdAt,
        Instant updatedAt
) {
}
