package com.campusconnect.dto.material;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record MaterialRequest(
        @NotBlank(message = "Title is required")
        @Size(max = 200, message = "Title must be at most 200 characters")
        String title,

        @Size(max = 2000, message = "Description must be at most 2000 characters")
        String description,

        Long topicId,

        List<Long> fileIds
) {
}
