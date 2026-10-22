package com.campusconnect.dto.announcement;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateAnnouncementRequest(
        @NotBlank(message = "Announcement text is required")
        @Size(max = 4000, message = "Announcement must be at most 4000 characters")
        String body,

        List<Long> fileIds,

        Boolean pinned
) {
}
