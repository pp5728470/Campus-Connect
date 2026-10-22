package com.campusconnect.dto.grade;

import com.campusconnect.entity.SubmissionStatus;

import java.math.BigDecimal;

public record GradebookCell(
        Long assignmentId,
        SubmissionStatus status,
        BigDecimal grade,
        Double percent
) {
}