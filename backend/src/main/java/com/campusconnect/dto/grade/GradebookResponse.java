package com.campusconnect.dto.grade;

import java.util.List;

public record GradebookResponse(
        Long classroomId,
        String classroomName,
        List<GradebookAssignment> assignments,
        List<GradebookRow> rows,
        Double classAveragePercent
) {
}