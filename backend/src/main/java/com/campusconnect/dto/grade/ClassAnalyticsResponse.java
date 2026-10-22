package com.campusconnect.dto.grade;

import java.util.List;

public record ClassAnalyticsResponse(
        Long classroomId,
        long studentCount,
        long assignmentCount,
        Double classAveragePercent,
        List<AssignmentStat> assignments,
        List<GradeBucket> distribution
) {
}