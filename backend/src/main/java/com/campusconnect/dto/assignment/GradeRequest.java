package com.campusconnect.dto.assignment;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record GradeRequest(
        @NotNull(message = "Grade is required")
        @DecimalMin(value = "0.0", message = "Grade cannot be negative")
        BigDecimal grade,

        @Size(max = 2000, message = "Feedback must be at most 2000 characters")
        String feedback,

        boolean returnWork
) {
}
