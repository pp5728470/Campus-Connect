package com.campusconnect.dto.assignment;

import java.util.List;

public record SubmissionSummaryResponse(
        long assigned,
        long submitted,
        long graded,
        long missing,
        List<SubmissionResponse> submissions
) {
}
