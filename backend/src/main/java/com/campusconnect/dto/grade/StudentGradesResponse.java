package com.campusconnect.dto.grade;

import java.util.List;

public record StudentGradesResponse(
        Long classroomId,
        String classroomName,
        List<StudentGradeItem> items,
        int gradedCount,
        int totalCount,
        Double averagePercent
) {
}