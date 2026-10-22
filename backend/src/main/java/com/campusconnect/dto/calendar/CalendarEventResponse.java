package com.campusconnect.dto.calendar;

import com.campusconnect.entity.SubmissionStatus;

import java.time.Instant;

/** A due date on the calendar; {@code status} is only set for students. */
public record CalendarEventResponse(
        Long assignmentId,
        Long classroomId,
        String classroomName,
        String title,
        Instant dueAt,
        int maxPoints,
        SubmissionStatus status,
        String link
) {
}