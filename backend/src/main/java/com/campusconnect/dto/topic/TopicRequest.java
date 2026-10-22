package com.campusconnect.dto.topic;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TopicRequest(
        @NotBlank(message = "Topic name is required")
        @Size(max = 160, message = "Topic name must be at most 160 characters")
        String name,

        Integer sortOrder
) {
}
