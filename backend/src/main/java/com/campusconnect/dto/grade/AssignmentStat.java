package com.campusconnect.dto.grade;

public record AssignmentStat(
        Long assignmentId,
        String title,
        long totalStudents,
        long submitted,
        long graded,
        long missing,
        /** Share of enrolled students who handed in, 0-100. */
        double submissionRate,
        Double averagePercent
) {
}