package com.campusconnect.dto.classroom;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateClassroomRequest(
        @NotBlank(message = "Class name is required")
        @Size(max = 120, message = "Class name must be at most 120 characters")
        String name,

        @Size(max = 60, message = "Section must be at most 60 characters")
        String section,

        @Size(max = 120, message = "Subject must be at most 120 characters")
        String subject,

        @Size(max = 60, message = "Room must be at most 60 characters")
        String room,

        @Size(max = 1000, message = "Description must be at most 1000 characters")
        String description,

        @Pattern(
                regexp = "^(teal|maroon|forest|indigo|steel|ochre)$",
                flags = Pattern.Flag.CASE_INSENSITIVE,
                message = "Banner color must be one of: teal, maroon, forest, indigo, steel, ochre"
        )
        String bannerColor
) {
}
