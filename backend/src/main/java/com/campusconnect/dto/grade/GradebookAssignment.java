package com.campusconnect.dto.grade;

import java.time.Instant;

/** Column header of the gradebook, with the column average as a percentage (null if nothing is graded). */
public record GradebookAssignment(
        Long id,
        String title,
        int maxPoints,
        Instant dueAt,
        Double averagePercent
) {
}