package com.campusconnect.dto.grade;

import com.campusconnect.entity.SubmissionStatus;

import java.math.BigDecimal;
import java.time.Instant;

public record StudentGradeItem(
        Long assignmentId,
        String title,
        int maxPoints,
        Instant dueAt,
        SubmissionStatus status,
        BigDecimal grade,
        Double percent,
        String feedback
) {
}