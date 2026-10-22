package com.campusconnect.util;

import com.campusconnect.entity.Assignment;
import com.campusconnect.entity.Submission;
import com.campusconnect.entity.SubmissionStatus;

import java.time.Instant;

/** Derives the status a student sees for an assignment from the stored submission and the due date. */
public final class SubmissionStatusResolver {

    private SubmissionStatusResolver() {
    }

    public static SubmissionStatus resolve(Assignment assignment, Submission submission) {
        boolean pastDue = assignment.getDueAt() != null && Instant.now().isAfter(assignment.getDueAt());

        if (submission == null) {
            return pastDue ? SubmissionStatus.MISSING : SubmissionStatus.ASSIGNED;
        }

        SubmissionStatus stored = submission.getStatus();
        if (stored == SubmissionStatus.GRADED || stored == SubmissionStatus.RETURNED
                || stored == SubmissionStatus.SUBMITTED || stored == SubmissionStatus.LATE) {
            return stored;
        }
        // ASSIGNED in the database: still open, or overdue without a hand-in
        return pastDue ? SubmissionStatus.MISSING : SubmissionStatus.ASSIGNED;
    }

    /** True once the student has handed work in (whether or not it has been graded yet). */
    public static boolean isHandedIn(SubmissionStatus status) {
        return status == SubmissionStatus.SUBMITTED || status == SubmissionStatus.LATE
                || status == SubmissionStatus.GRADED || status == SubmissionStatus.RETURNED;
    }

    /** True when the teacher has recorded a grade. */
    public static boolean isGraded(SubmissionStatus status) {
        return status == SubmissionStatus.GRADED || status == SubmissionStatus.RETURNED;
    }
}