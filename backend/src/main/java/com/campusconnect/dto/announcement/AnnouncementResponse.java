package com.campusconnect.dto.announcement;

import com.campusconnect.dto.file.FileResponse;

import java.time.Instant;
import java.util.List;

public record AnnouncementResponse(
        Long id,
        Long classroomId,
        Long authorId,
        String authorName,
        String body,
        boolean pinned,
        List<FileResponse> attachments,
        List<CommentResponse> comments,
        Instant createdAt,
        Instant updatedAt
) {
}
