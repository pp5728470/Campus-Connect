package com.campusconnect.dto.assignment;

import com.campusconnect.entity.SubmissionStatus;

import java.time.Instant;

public record TodoItemResponse(
        Long assignmentId,
        Long classroomId,
        String classroomName,
        String title,
        Instant dueAt,
        int maxPoints,
        SubmissionStatus status
) {
}
