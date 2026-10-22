package com.campusconnect.service;

import com.campusconnect.dto.common.PageResponse;
import com.campusconnect.dto.notification.NotificationResponse;
import com.campusconnect.dto.notification.UnreadCountResponse;
import com.campusconnect.entity.Assignment;
import com.campusconnect.entity.Classroom;
import com.campusconnect.entity.ClassRole;
import com.campusconnect.entity.Enrollment;
import com.campusconnect.entity.Notification;
import com.campusconnect.entity.NotificationType;
import com.campusconnect.entity.User;
import com.campusconnect.exception.ApiException;
import com.campusconnect.repository.AssignmentRepository;
import com.campusconnect.repository.EnrollmentRepository;
import com.campusconnect.repository.NotificationRepository;
import com.campusconnect.repository.SubmissionRepository;
import com.campusconnect.security.SecurityUtils;
import com.campusconnect.util.SubmissionStatusResolver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private static final int MAX_PAGE_SIZE = 100;
    private static final int TITLE_MAX = 200;
    private static final int BODY_MAX = 1000;

    private final NotificationRepository notificationRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AssignmentRepository assignmentRepository;
    private final SubmissionRepository submissionRepository;

    @Transactional(readOnly = true)
    public PageResponse<NotificationResponse> list(int page, int size, boolean unreadOnly) {
        Long userId = SecurityUtils.currentUser().getId();
        PageRequest pageable = PageRequest.of(Math.max(page, 0), clampSize(size));
        Page<Notification> result = unreadOnly
                ? notificationRepository.findUnreadForUser(userId, pageable)
                : notificationRepository.findForUser(userId, pageable);
        return PageResponse.from(result.map(this::toResponse));
    }

    @Transactional(readOnly = true)
    public UnreadCountResponse unreadCount() {
        return new UnreadCountResponse(notificationRepository.countUnread(SecurityUtils.currentUser().getId()));
    }

    @Transactional
    public NotificationResponse markRead(Long notificationId) {
        Notification notification = notificationRepository
                .findByIdAndUserId(notificationId, SecurityUtils.currentUser().getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Notification not found"));
        notification.setRead(true);
        return toResponse(notification);
    }

    @Transactional
    public int markAllRead() {
        return notificationRepository.markAllRead(SecurityUtils.currentUser().getId());
    }

    /**
     * Notifies every teacher and student enrolled in the class, except {@code excludeUserId}
     * (normally the person who triggered the event).
     */
    @Transactional
    public void notifyClassMembers(
            Long classroomId,
            Long excludeUserId,
            NotificationType type,
            String title,
            String body,
            String link
    ) {
        List<Enrollment> members = enrollmentRepository.findPeopleByClassroomId(classroomId);
        List<Notification> notifications = new ArrayList<>();
        for (Enrollment member : members) {
            if (member.getUser().getId().equals(excludeUserId)) {
                continue;
            }
            notifications.add(build(member.getUser(), member.getClassroom(), type, title, body, link));
        }
        notificationRepository.saveAll(notifications);
    }

    /** Sends a single notification to one user. */
    @Transactional
    public void notifyUser(User user, Classroom classroom, NotificationType type, String title, String body, String link) {
        notificationRepository.save(build(user, classroom, type, title, body, link));
    }

    /**
     * Creates a DUE_TOMORROW notification for each student who has not handed in an assignment
     * that falls due within the next 24 hours. Safe to run repeatedly: a student is reminded at most
     * once per assignment per UTC day.
     *
     * @return number of notifications created
     */
    @Transactional
    public int createDueReminders() {
        Instant now = Instant.now();
        Instant startOfToday = now.atZone(ZoneOffset.UTC).toLocalDate().atStartOfDay(ZoneOffset.UTC).toInstant();
        List<Assignment> dueSoon = assignmentRepository.findDueBetween(now, now.plus(Duration.ofHours(24)));

        int created = 0;
        for (Assignment assignment : dueSoon) {
            Long classroomId = assignment.getClassroom().getId();
            String link = assignmentLink(classroomId, assignment.getId());

            Set<Long> handedIn = submissionRepository.findAllForAssignment(assignment.getId()).stream()
                    .filter(s -> SubmissionStatusResolver.isHandedIn(SubmissionStatusResolver.resolve(assignment, s)))
                    .map(s -> s.getStudent().getId())
                    .collect(Collectors.toCollection(HashSet::new));

            for (Enrollment enrollment : enrollmentRepository.findPeopleByClassroomId(classroomId)) {
                if (enrollment.getRoleInClass() != ClassRole.STUDENT) {
                    continue;
                }
                User student = enrollment.getUser();
                if (handedIn.contains(student.getId())
                        || notificationRepository.existsSince(
                        student.getId(), NotificationType.DUE_TOMORROW, link, startOfToday)) {
                    continue;
                }
                notificationRepository.save(build(
                        student,
                        assignment.getClassroom(),
                        NotificationType.DUE_TOMORROW,
                        "Due soon: " + assignment.getTitle(),
                        assignment.getClassroom().getName() + " - due within the next 24 hours.",
                        link
                ));
                created++;
            }
        }
        if (created > 0) {
            log.info("Created {} due-date reminder(s)", created);
        }
        return created;
    }

    public static String classLink(Long classroomId, String tab) {
        return "/classes/" + classroomId + "/" + tab;
    }

    public static String assignmentLink(Long classroomId, Long assignmentId) {
        return "/classes/" + classroomId + "/assignments/" + assignmentId;
    }

    private Notification build(User user, Classroom classroom, NotificationType type, String title, String body, String link) {
        return Notification.builder()
                .user(user)
                .classroom(classroom)
                .type(type)
                .title(truncate(title, TITLE_MAX))
                .body(body == null ? null : truncate(body, BODY_MAX))
                .link(link)
                .build();
    }

    private NotificationResponse toResponse(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getType(),
                notification.getTitle(),
                notification.getBody(),
                notification.getLink(),
                notification.getClassroom() != null ? notification.getClassroom().getId() : null,
                notification.isRead(),
                notification.getCreatedAt()
        );
    }

    private int clampSize(int size) {
        return Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
    }

    private String truncate(String value, int max) {
        return value.length() <= max ? value : value.substring(0, max - 1) + "\u2026";
    }
}
