package com.campusconnect.dto.grade;

import java.util.List;

/** One student: cells are in the same order as {@link GradebookResponse#assignments()}. */
public record GradebookRow(
        Long studentId,
        String studentName,
        String studentEmail,
        List<GradebookCell> cells,
        Double averagePercent
) {
}