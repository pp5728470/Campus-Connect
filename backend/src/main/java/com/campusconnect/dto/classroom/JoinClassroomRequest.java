package com.campusconnect.dto.classroom;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record JoinClassroomRequest(
        @NotBlank(message = "Class code is required")
        @Size(min = 7, max = 7, message = "Class code must be exactly 7 characters")
        String classCode
) {
}
