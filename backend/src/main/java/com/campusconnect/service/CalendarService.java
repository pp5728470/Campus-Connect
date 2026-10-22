package com.campusconnect.service;

import com.campusconnect.dto.calendar.CalendarEventResponse;
import com.campusconnect.entity.Assignment;
import com.campusconnect.entity.ClassRole;
import com.campusconnect.entity.Enrollment;
import com.campusconnect.entity.Submission;
import com.campusconnect.entity.SubmissionStatus;
import com.campusconnect.exception.ApiException;
import com.campusconnect.repository.AssignmentRepository;
import com.campusconnect.repository.EnrollmentRepository;
import com.campusconnect.repository.SubmissionRepository;
import com.campusconnect.security.SecurityUtils;
import com.campusconnect.util.SubmissionStatusResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DateTimeException;
import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CalendarService {

    private final EnrollmentRepository enrollmentRepository;
    private final AssignmentRepository assignmentRepository;
    private final SubmissionRepository submissionRepository;

    /**
     * Due dates falling in the given month for every active class the current user belongs to.
     * Month boundaries are evaluated in {@code zone} (defaults to UTC).
     */
    @Transactional(readOnly = true)
    public List<CalendarEventResponse> dueDates(int year, int month, String zone) {
        YearMonth yearMonth = parseMonth(year, month);
        ZoneId zoneId = parseZone(zone);
        Long userId = SecurityUtils.currentUser().getId();

        List<Enrollment> enrollments = enrollmentRepository.findActiveByUserId(userId);
        if (enrollments.isEmpty()) {
            return List.of();
        }
        Set<Long> classroomIds = enrollments.stream().map(e -> e.getClassroom().getId()).collect(Collectors.toSet());
        Set<Long> studentClassroomIds = enrollments.stream()
                .filter(e -> e.getRoleInClass() == ClassRole.STUDENT)
                .map(e -> e.getClassroom().getId())
                .collect(Collectors.toSet());

        Instant from = yearMonth.atDay(1).atStartOfDay(zoneId).toInstant();
        Instant to = yearMonth.plusMonths(1).atDay(1).atStartOfDay(zoneId).toInstant();
        List<Assignment> assignments = assignmentRepository.findDueBetweenForClassrooms(classroomIds, from, to);

        Map<Long, Submission> mine = new HashMap<>();
        if (!studentClassroomIds.isEmpty()) {
            for (Submission submission : submissionRepository
                    .findByStudentIdAndAssignmentClassroomIdIn(userId, studentClassroomIds)) {
                mine.put(submission.getAssignment().getId(), submission);
            }
        }

        return assignments.stream()
                .map(a -> toEvent(a, studentClassroomIds.contains(a.getClassroom().getId())
                        ? SubmissionStatusResolver.resolve(a, mine.get(a.getId()))
                        : null))
                .toList();
    }

    private CalendarEventResponse toEvent(Assignment assignment, SubmissionStatus status) {
        Long classroomId = assignment.getClassroom().getId();
        return new CalendarEventResponse(
                assignment.getId(),
                classroomId,
                assignment.getClassroom().getName(),
                assignment.getTitle(),
                assignment.getDueAt(),
                assignment.getMaxPoints(),
                status,
                NotificationService.assignmentLink(classroomId, assignment.getId())
        );
    }

    private YearMonth parseMonth(int year, int month) {
        if (year < 2000 || year > 2100 || month < 1 || month > 12) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "year must be 2000-2100 and month 1-12");
        }
        return YearMonth.of(year, month);
    }

    private ZoneId parseZone(String zone) {
        if (zone == null || zone.isBlank()) {
            return ZoneId.of("UTC");
        }
        try {
            return ZoneId.of(zone.trim());
        } catch (DateTimeException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Unknown time zone: " + zone);
        }
    }
}
