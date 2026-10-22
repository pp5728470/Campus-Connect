package com.campusconnect.dto.assignment;

import jakarta.validation.constraints.*;

import java.time.Instant;
import java.util.List;

public record AssignmentRequest(
        @NotBlank(message = "Title is required")
        @Size(max = 200, message = "Title must be at most 200 characters")
        String title,

        @Size(max = 4000, message = "Instructions must be at most 4000 characters")
        String instructions,

        Long topicId,

        @NotNull(message = "Max points is required")
        @Min(value = 1, message = "Max points must be at least 1")
        @Max(value = 1000, message = "Max points must be at most 1000")
        Integer maxPoints,

        Instant dueAt,

        Boolean allowLate,

        List<Long> fileIds
) {
}
