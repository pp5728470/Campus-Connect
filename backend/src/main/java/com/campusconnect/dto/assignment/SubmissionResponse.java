package com.campusconnect.dto.assignment;

import com.campusconnect.dto.file.FileResponse;
import com.campusconnect.entity.SubmissionStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record SubmissionResponse(
        Long id,
        Long assignmentId,
        Long studentId,
        String studentName,
        String studentEmail,
        String textAnswer,
        SubmissionStatus status,
        Instant submittedAt,
        BigDecimal grade,
        String feedback,
        Long gradedById,
        String gradedByName,
        Instant gradedAt,
        Instant returnedAt,
        List<FileResponse> files
) {
}
