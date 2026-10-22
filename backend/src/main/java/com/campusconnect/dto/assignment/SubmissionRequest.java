package com.campusconnect.dto.assignment;

import jakarta.validation.constraints.Size;

import java.util.List;

public record SubmissionRequest(
        @Size(max = 4000, message = "Text answer must be at most 4000 characters")
        String textAnswer,

        List<Long> fileIds
) {
}
