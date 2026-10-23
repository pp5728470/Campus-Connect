package com.campusconnect.service;

import com.campusconnect.dto.assignment.*;
import com.campusconnect.dto.common.PageResponse;
import com.campusconnect.entity.*;
import com.campusconnect.exception.ApiException;
import com.campusconnect.repository.AssignmentRepository;
import com.campusconnect.repository.EnrollmentRepository;
import com.campusconnect.repository.SubmissionRepository;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.security.SecurityUtils;
import com.campusconnect.security.UserPrincipal;
import com.campusconnect.util.SubmissionStatusResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final SubmissionRepository submissionRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;
    private final ClassroomAccessService classroomAccessService;
    private final TopicService topicService;
    private final FileStorageService fileStorageService;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public PageResponse<AssignmentResponse> list(Long classroomId, int page, int size) {
        classroomAccessService.requireMembership(classroomId);
        Long userId = SecurityUtils.currentUser().getId();
        List<Assignment> assignments = assignmentRepository.findAllForClassroom(classroomId);
        assignments.sort(Comparator
                .comparing(Assignment::getDueAt, Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(Assignment::getCreatedAt, Comparator.reverseOrder()));

        List<AssignmentResponse> all = assignments.stream()
                .map(a -> toResponse(a, resolveMyStatus(a, userId)))
                .toList();
        return pageOf(all, page, size);
    }

    @Transactional(readOnly = true)
    public AssignmentResponse get(Long classroomId, Long assignmentId) {
        classroomAccessService.requireMembership(classroomId);
        Assignment assignment = requireAssignment(classroomId, assignmentId);
        return toResponse(assignment, resolveMyStatus(assignment, SecurityUtils.currentUser().getId()));
    }

    @Transactional
    public AssignmentResponse create(Long classroomId, AssignmentRequest request) {
        classroomAccessService.requireActiveClassroom(classroomId);
        classroomAccessService.requireTeacher(classroomId);
        User creator = currentUserEntity();
        Assignment assignment = Assignment.builder()
                .classroom(classroomAccessService.requireClassroom(classroomId))
                .topic(topicService.requireTopic(classroomId, request.topicId()))
                .title(request.title().trim())
                .instructions(trimToNull(request.instructions()))
                .maxPoints(request.maxPoints())
                .dueAt(request.dueAt())
                .allowLate(request.allowLate() == null || request.allowLate())
                .createdBy(creator)
                .attachments(new HashSet<>(fileStorageService.resolveOwnedForClassroom(
                        classroomId, request.fileIds(), creator.getId())))
                .build();
        assignmentRepository.save(assignment);
        notificationService.notifyClassMembers(
                classroomId,
                creator.getId(),
                NotificationType.ASSIGNMENT,
                "New assignment: " + assignment.getTitle(),
                assignment.getClassroom().getName() + " - " + assignment.getMaxPoints() + " points",
                NotificationService.assignmentLink(classroomId, assignment.getId())
        );
        return toResponse(assignment, null);
    }

    @Transactional
    public AssignmentResponse update(Long classroomId, Long assignmentId, AssignmentRequest request) {
        classroomAccessService.requireActiveClassroom(classroomId);
        classroomAccessService.requireTeacher(classroomId);
        Assignment assignment = requireAssignment(classroomId, assignmentId);
        assignment.setTitle(request.title().trim());
        assignment.setInstructions(trimToNull(request.instructions()));
        assignment.setTopic(topicService.requireTopic(classroomId, request.topicId()));
        assignment.setMaxPoints(request.maxPoints());
        assignment.setDueAt(request.dueAt());
        if (request.allowLate() != null) {
            assignment.setAllowLate(request.allowLate());
        }
        if (request.fileIds() != null) {
            User teacher = currentUserEntity();
            assignment.setAttachments(new HashSet<>(fileStorageService.resolveOwnedForClassroom(
                    classroomId, request.fileIds(), teacher.getId())));
        }
        return toResponse(assignment, null);
    }

    @Transactional
    public void delete(Long classroomId, Long assignmentId) {
        classroomAccessService.requireActiveClassroom(classroomId);
        classroomAccessService.requireTeacher(classroomId);
        assignmentRepository.delete(requireAssignment(classroomId, assignmentId));
    }

    @Transactional(readOnly = true)
    public SubmissionSummaryResponse listSubmissions(Long classroomId, Long assignmentId) {
        classroomAccessService.requireTeacher(classroomId);
        Assignment assignment = requireAssignment(classroomId, assignmentId);

        List<Enrollment> students = enrollmentRepository.findPeopleByClassroomId(classroomId).stream()
                .filter(e -> e.getRoleInClass() == ClassRole.STUDENT)
                .toList();

        Map<Long, Submission> byStudent = submissionRepository.findAllForAssignment(assignmentId).stream()
                .collect(Collectors.toMap(s -> s.getStudent().getId(), s -> s));

        List<SubmissionResponse> rows = new ArrayList<>();
        long submitted = 0;
        long graded = 0;
        long missing = 0;

        for (Enrollment enrollment : students) {
            Submission submission = byStudent.get(enrollment.getUser().getId());
            SubmissionStatus status = computeStatus(assignment, submission);
            if (status == SubmissionStatus.SUBMITTED || status == SubmissionStatus.LATE
                    || status == SubmissionStatus.GRADED || status == SubmissionStatus.RETURNED) {
                submitted++;
            }
            if (status == SubmissionStatus.GRADED || status == SubmissionStatus.RETURNED) {
                graded++;
            }
            if (status == SubmissionStatus.MISSING) {
                missing++;
            }
            rows.add(toSubmissionResponse(assignment, enrollment.getUser(), submission, status));
        }

        return new SubmissionSummaryResponse(students.size(), submitted, graded, missing, rows);
    }

    @Transactional(readOnly = true)
    public SubmissionResponse getMySubmission(Long classroomId, Long assignmentId) {
        classroomAccessService.requireMembership(classroomId);
        Assignment assignment = requireAssignment(classroomId, assignmentId);
        User student = currentUserEntity();
        Submission submission = submissionRepository.findByAssignmentIdAndStudentId(assignmentId, student.getId())
                .orElse(null);
        return toSubmissionResponse(assignment, student, submission, computeStatus(assignment, submission));
    }

    @Transactional
    public SubmissionResponse submit(Long classroomId, Long assignmentId, SubmissionRequest request) {
        classroomAccessService.requireActiveClassroom(classroomId);
        Enrollment enrollment = classroomAccessService.requireMembership(classroomId);
        if (enrollment.getRoleInClass() != ClassRole.STUDENT) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only students can submit work");
        }
        Assignment assignment = requireAssignment(classroomId, assignmentId);
        User student = currentUserEntity();

        Instant now = Instant.now();
        boolean late = assignment.getDueAt() != null && now.isAfter(assignment.getDueAt());
        if (late && !assignment.isAllowLate()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Late submissions are not allowed for this assignment");
        }

        List<StoredFile> files = fileStorageService.resolveOwnedForClassroom(
                classroomId, request.fileIds(), student.getId());
        String text = trimToNull(request.textAnswer());
        if (files.isEmpty() && text == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Add text or at least one file to submit");
        }

        Submission submission = submissionRepository.findByAssignmentIdAndStudentId(assignmentId, student.getId())
                .orElseGet(() -> Submission.builder()
                        .assignment(assignment)
                        .student(student)
                        .build());

        if (submission.getStatus() == SubmissionStatus.GRADED || submission.getStatus() == SubmissionStatus.RETURNED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Graded work cannot be resubmitted");
        }

        submission.setTextAnswer(text);
        submission.setFiles(new HashSet<>(files));
        submission.setSubmittedAt(now);
        submission.setStatus(late ? SubmissionStatus.LATE : SubmissionStatus.SUBMITTED);
        submission.setGrade(null);
        submission.setFeedback(null);
        submission.setGradedBy(null);
        submission.setGradedAt(null);
        submission.setReturnedAt(null);
        submissionRepository.save(submission);

        return toSubmissionResponse(assignment, student, submission, submission.getStatus());
    }

    @Transactional
    public SubmissionResponse unsubmit(Long classroomId, Long assignmentId) {
        classroomAccessService.requireActiveClassroom(classroomId);
        classroomAccessService.requireMembership(classroomId);
        Assignment assignment = requireAssignment(classroomId, assignmentId);
        User student = currentUserEntity();
        Submission submission = submissionRepository.findByAssignmentIdAndStudentId(assignmentId, student.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No submission found"));

        if (submission.getStatus() == SubmissionStatus.GRADED || submission.getStatus() == SubmissionStatus.RETURNED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cannot unsubmit after grading");
        }
        if (submission.getStatus() != SubmissionStatus.SUBMITTED && submission.getStatus() != SubmissionStatus.LATE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Nothing to unsubmit");
        }

        submission.setStatus(SubmissionStatus.ASSIGNED);
        submission.setSubmittedAt(null);
        submissionRepository.save(submission);
        return toSubmissionResponse(assignment, student, submission, computeStatus(assignment, submission));
    }

    @Transactional
    public SubmissionResponse grade(Long classroomId, Long assignmentId, Long studentId, GradeRequest request) {
        classroomAccessService.requireActiveClassroom(classroomId);
        classroomAccessService.requireTeacher(classroomId);
        Assignment assignment = requireAssignment(classroomId, assignmentId);
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Student not found"));

        Enrollment studentEnrollment = enrollmentRepository.findByClassroomIdAndUserId(classroomId, studentId)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Student is not in this class"));
        if (studentEnrollment.getRoleInClass() != ClassRole.STUDENT) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only enrolled students can be graded");
        }

        if (request.grade().compareTo(BigDecimal.valueOf(assignment.getMaxPoints())) > 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Grade cannot exceed max points");
        }

        Submission submission = submissionRepository.findByAssignmentIdAndStudentId(assignmentId, studentId)
                .orElseGet(() -> Submission.builder()
                        .assignment(assignment)
                        .student(student)
                        .status(SubmissionStatus.ASSIGNED)
                        .build());

        User grader = currentUserEntity();
        Instant now = Instant.now();
        submission.setGrade(request.grade());
        submission.setFeedback(trimToNull(request.feedback()));
        submission.setGradedBy(grader);
        submission.setGradedAt(now);
        if (request.returnWork()) {
            submission.setStatus(SubmissionStatus.RETURNED);
            submission.setReturnedAt(now);
        } else {
            submission.setStatus(SubmissionStatus.GRADED);
            submission.setReturnedAt(null);
        }
        submissionRepository.save(submission);
        notificationService.notifyUser(
                student,
                assignment.getClassroom(),
                NotificationType.GRADED,
                "Graded: " + assignment.getTitle(),
                "You scored " + request.grade().stripTrailingZeros().toPlainString() + " / " + assignment.getMaxPoints(),
                NotificationService.assignmentLink(classroomId, assignmentId)
        );
        return toSubmissionResponse(assignment, student, submission, submission.getStatus());
    }

    @Transactional(readOnly = true)
    public List<TodoItemResponse> todo() {
        UserPrincipal principal = SecurityUtils.currentUser();
        List<Enrollment> enrollments = enrollmentRepository.findActiveByUserId(principal.getId()).stream()
                .filter(e -> e.getRoleInClass() == ClassRole.STUDENT)
                .toList();
        if (enrollments.isEmpty()) {
            return List.of();
        }

        List<Long> classroomIds = enrollments.stream().map(e -> e.getClassroom().getId()).toList();
        List<Assignment> assignments = assignmentRepository.findByClassroomIdIn(classroomIds);

        Instant now = Instant.now();
        List<TodoItemResponse> items = new ArrayList<>();
        for (Assignment assignment : assignments) {
            Submission submission = submissionRepository
                    .findByAssignmentIdAndStudentId(assignment.getId(), principal.getId())
                    .orElse(null);
            SubmissionStatus status = computeStatus(assignment, submission);
            if (status == SubmissionStatus.GRADED || status == SubmissionStatus.RETURNED
                    || status == SubmissionStatus.SUBMITTED || status == SubmissionStatus.LATE) {
                continue;
            }
            // upcoming ASSIGNED or MISSING
            if (status == SubmissionStatus.MISSING
                    || assignment.getDueAt() == null
                    || !assignment.getDueAt().isBefore(now.minusSeconds(60L * 60 * 24 * 14))) {
                items.add(new TodoItemResponse(
                        assignment.getId(),
                        assignment.getClassroom().getId(),
                        assignment.getClassroom().getName(),
                        assignment.getTitle(),
                        assignment.getDueAt(),
                        assignment.getMaxPoints(),
                        status
                ));
            }
        }

        items.sort(Comparator
                .comparing((TodoItemResponse t) -> t.status() == SubmissionStatus.MISSING ? 0 : 1)
                .thenComparing(TodoItemResponse::dueAt, Comparator.nullsLast(Comparator.naturalOrder())));
        return items;
    }

    private SubmissionStatus resolveMyStatus(Assignment assignment, Long userId) {
        return submissionRepository.findByAssignmentIdAndStudentId(assignment.getId(), userId)
                .map(s -> computeStatus(assignment, s))
                .orElseGet(() -> computeStatus(assignment, null));
    }

    private SubmissionStatus computeStatus(Assignment assignment, Submission submission) {
        return SubmissionStatusResolver.resolve(assignment, submission);
    }

    private Assignment requireAssignment(Long classroomId, Long assignmentId) {
        return assignmentRepository.findByIdAndClassroomId(assignmentId, classroomId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Assignment not found"));
    }

    private User currentUserEntity() {
        return userRepository.findById(SecurityUtils.currentUser().getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private AssignmentResponse toResponse(Assignment assignment, SubmissionStatus myStatus) {
        assignment.getAttachments().size();
        return new AssignmentResponse(
                assignment.getId(),
                assignment.getClassroom().getId(),
                assignment.getClassroom().getName(),
                assignment.getTopic() != null ? assignment.getTopic().getId() : null,
                assignment.getTopic() != null ? assignment.getTopic().getName() : null,
                assignment.getTitle(),
                assignment.getInstructions(),
                assignment.getMaxPoints(),
                assignment.getDueAt(),
                assignment.isAllowLate(),
                assignment.getCreatedBy().getId(),
                assignment.getCreatedBy().getFullName(),
                fileStorageService.toResponses(assignment.getAttachments()),
                myStatus,
                assignment.getCreatedAt(),
                assignment.getUpdatedAt()
        );
    }

    private SubmissionResponse toSubmissionResponse(
            Assignment assignment,
            User student,
            Submission submission,
            SubmissionStatus status
    ) {
        if (submission == null) {
            return new SubmissionResponse(
                    null, assignment.getId(), student.getId(), student.getFullName(), student.getEmail(),
                    null, status, null, null, null, null, null, null, null, List.of()
            );
        }
        submission.getFiles().size();
        return new SubmissionResponse(
                submission.getId(),
                assignment.getId(),
                student.getId(),
                student.getFullName(),
                student.getEmail(),
                submission.getTextAnswer(),
                status,
                submission.getSubmittedAt(),
                submission.getGrade(),
                submission.getFeedback(),
                submission.getGradedBy() != null ? submission.getGradedBy().getId() : null,
                submission.getGradedBy() != null ? submission.getGradedBy().getFullName() : null,
                submission.getGradedAt(),
                submission.getReturnedAt(),
                fileStorageService.toResponses(submission.getFiles())
        );
    }

    private String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private <T> PageResponse<T> pageOf(List<T> all, int page, int size) {
        int from = Math.min(page * size, all.size());
        int to = Math.min(from + size, all.size());
        int totalPages = size == 0 ? 0 : (int) Math.ceil((double) all.size() / size);
        return new PageResponse<>(all.subList(from, to), page, size, all.size(), totalPages,
                page >= totalPages - 1 || all.isEmpty());
    }
}
