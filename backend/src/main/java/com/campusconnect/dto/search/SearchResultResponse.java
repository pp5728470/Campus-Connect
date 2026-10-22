package com.campusconnect.dto.search;

public record SearchResultResponse(
        SearchResultType type,
        Long id,
        String title,
        String subtitle,
        Long classroomId,
        String link
) {
}