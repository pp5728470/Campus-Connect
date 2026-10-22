package com.campusconnect.service;

import com.campusconnect.dto.grade.AssignmentStat;
import com.campusconnect.dto.grade.ClassAnalyticsResponse;
import com.campusconnect.dto.grade.GradeBucket;
import com.campusconnect.dto.grade.GradebookAssignment;
import com.campusconnect.dto.grade.GradebookCell;
import com.campusconnect.dto.grade.GradebookResponse;
import com.campusconnect.dto.grade.GradebookRow;
import com.campusconnect.dto.grade.StudentGradeItem;
import com.campusconnect.dto.grade.StudentGradesResponse;
import com.campusconnect.entity.Assignment;
import com.campusconnect.entity.ClassRole;
import com.campusconnect.entity.Classroom;
import com.campusconnect.entity.Enrollment;
import com.campusconnect.entity.Submission;
import com.campusconnect.entity.SubmissionStatus;
import com.campusconnect.entity.User;
import com.campusconnect.exception.ApiException;
import com.campusconnect.repository.AssignmentRepository;
import com.campusconnect.repository.EnrollmentRepository;
import com.campusconnect.repository.SubmissionRepository;
import com.campusconnect.security.SecurityUtils;
import com.campusconnect.util.GradebookExporter;
import com.campusconnect.util.SubmissionStatusResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/** Gradebook, per-student grade summaries, class analytics and exports. */
@Service
@RequiredArgsConstructor
public class GradeService {

    private static final List<String> BUCKET_LABELS = List.of("0-59", "60-69", "70-79", "80-89", "90-100");

    private final ClassroomAccessService classroomAccessService;
    private final AssignmentRepository assignmentRepository;
    private final SubmissionRepository submissionRepository;
    private final EnrollmentRepository enrollmentRepository;

    /** Teacher view: students x assignments matrix with row, column and class averages. */
    @Transactional(readOnly = true)
    public GradebookResponse gradebook(Long classroomId) {
        classroomAccessService.requireTeacher(classroomId);
        return buildGradebook(classroomId);
    }

    /** Student view: own grades for every assignment in the class. */
    @Transactional(readOnly = true)
    public StudentGradesResponse myGrades(Long classroomId) {
        Enrollment enrollment = classroomAccessService.requireMembership(classroomId);
        if (enrollment.getRoleInClass() != ClassRole.STUDENT) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only students have a personal grade summary");
        }
        Classroom classroom = enrollment.getClassroom();
        Long userId = SecurityUtils.currentUser().getId();

        Map<Long, Submission> mine = new HashMap<>();
        for (Submission submission : submissionRepository.findAllForClassroom(classroomId)) {
            if (submission.getStudent().getId().equals(userId)) {
                mine.put(submission.getAssignment().getId(), submission);
            }
        }

        List<StudentGradeItem> items = new ArrayList<>();
        List<Double> percents = new ArrayList<>();
        for (Assignment assignment : sortedAssignments(classroomId)) {
            Submission submission = mine.get(assignment.getId());
            SubmissionStatus status = SubmissionStatusResolver.resolve(assignment, submission);
            Double percent = percentOf(assignment, submission, status);
            if (percent != null) {
                percents.add(percent);
            }
            items.add(new StudentGradeItem(
                    assignment.getId(),
                    assignment.getTitle(),
                    assignment.getMaxPoints(),
                    assignment.getDueAt(),
                    status,
                    SubmissionStatusResolver.isGraded(status) && submission != null ? submission.getGrade() : null,
                    percent,
                    SubmissionStatusResolver.isGraded(status) && submission != null ? submission.getFeedback() : null
            ));
        }
        return new StudentGradesResponse(classroomId, classroom.getName(), items, percents.size(), items.size(), average(percents));
    }

    /** Teacher view: submission rate per assignment and grade distribution. */
    @Transactional(readOnly = true)
    public ClassAnalyticsResponse analytics(Long classroomId) {
        classroomAccessService.requireTeacher(classroomId);
        GradebookResponse gradebook = buildGradebook(classroomId);

        long studentCount = gradebook.rows().size();
        long[] buckets = new long[BUCKET_LABELS.size()];
        List<AssignmentStat> stats = new ArrayList<>();

        for (int i = 0; i < gradebook.assignments().size(); i++) {
            GradebookAssignment assignment = gradebook.assignments().get(i);
            long submitted = 0;
            long graded = 0;
            long missing = 0;
            for (GradebookRow row : gradebook.rows()) {
                GradebookCell cell = row.cells().get(i);
                if (SubmissionStatusResolver.isHandedIn(cell.status())) {
                    submitted++;
                }
                if (SubmissionStatusResolver.isGraded(cell.status())) {
                    graded++;
                }
                if (cell.status() == SubmissionStatus.MISSING) {
                    missing++;
                }
                if (cell.percent() != null) {
                    buckets[bucketIndex(cell.percent())]++;
                }
            }
            double rate = studentCount == 0 ? 0 : round(submitted * 100.0 / studentCount);
            stats.add(new AssignmentStat(
                    assignment.id(), assignment.title(), studentCount, submitted, graded, missing, rate,
                    assignment.averagePercent()
            ));
        }

        List<GradeBucket> distribution = new ArrayList<>();
        for (int i = 0; i < buckets.length; i++) {
            distribution.add(new GradeBucket(BUCKET_LABELS.get(i), buckets[i]));
        }
        return new ClassAnalyticsResponse(
                classroomId, studentCount, gradebook.assignments().size(),
                gradebook.classAveragePercent(), stats, distribution
        );
    }

    @Transactional(readOnly = true)
    public byte[] exportCsv(Long classroomId) {
        classroomAccessService.requireTeacher(classroomId);
        return GradebookExporter.toCsv(buildGradebook(classroomId));
    }

    @Transactional(readOnly = true)
    public byte[] exportXlsx(Long classroomId) {
        classroomAccessService.requireTeacher(classroomId);
        return GradebookExporter.toXlsx(buildGradebook(classroomId));
    }

    private GradebookResponse buildGradebook(Long classroomId) {
        Classroom classroom = classroomAccessService.requireClassroom(classroomId);
        List<Assignment> assignments = sortedAssignments(classroomId);
        List<User> students = enrollmentRepository.findPeopleByClassroomId(classroomId).stream()
                .filter(e -> e.getRoleInClass() == ClassRole.STUDENT)
                .map(Enrollment::getUser)
                .sorted(Comparator.comparing(User::getFullName, String.CASE_INSENSITIVE_ORDER))
                .toList();

        // assignmentId -> studentId -> submission
        Map<Long, Map<Long, Submission>> submissions = new HashMap<>();
        for (Submission submission : submissionRepository.findAllForClassroom(classroomId)) {
            submissions
                    .computeIfAbsent(submission.getAssignment().getId(), k -> new HashMap<>())
                    .put(submission.getStudent().getId(), submission);
        }

        List<List<Double>> columnPercents = new ArrayList<>();
        for (int i = 0; i < assignments.size(); i++) {
            columnPercents.add(new ArrayList<>());
        }
        List<Double> allPercents = new ArrayList<>();
        List<GradebookRow> rows = new ArrayList<>();

        for (User student : students) {
            List<GradebookCell> cells = new ArrayList<>();
            List<Double> rowPercents = new ArrayList<>();
            for (int i = 0; i < assignments.size(); i++) {
                Assignment assignment = assignments.get(i);
                Submission submission = submissions.getOrDefault(assignment.getId(), Map.of()).get(student.getId());
                SubmissionStatus status = SubmissionStatusResolver.resolve(assignment, submission);
                Double percent = percentOf(assignment, submission, status);
                if (percent != null) {
                    rowPercents.add(percent);
                    columnPercents.get(i).add(percent);
                    allPercents.add(percent);
                }
                BigDecimal grade = percent != null ? submission.getGrade() : null;
                cells.add(new GradebookCell(assignment.getId(), status, grade, percent));
            }
            rows.add(new GradebookRow(student.getId(), student.getFullName(), student.getEmail(), cells, average(rowPercents)));
        }

        List<GradebookAssignment> columns = new ArrayList<>();
        for (int i = 0; i < assignments.size(); i++) {
            Assignment assignment = assignments.get(i);
            columns.add(new GradebookAssignment(
                    assignment.getId(), assignment.getTitle(), assignment.getMaxPoints(),
                    assignment.getDueAt(), average(columnPercents.get(i))
            ));
        }
        return new GradebookResponse(classroomId, classroom.getName(), columns, rows, average(allPercents));
    }

    /** Assignments by due date (undated last), then creation order, so columns stay stable. */
    private List<Assignment> sortedAssignments(Long classroomId) {
        List<Assignment> assignments = new ArrayList<>(assignmentRepository.findAllForClassroom(classroomId));
        assignments.sort(Comparator
                .comparing(Assignment::getDueAt, Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(Assignment::getCreatedAt));
        return assignments;
    }

    /** Score as a percentage of max points; null unless the work has been graded. */
    private Double percentOf(Assignment assignment, Submission submission, SubmissionStatus status) {
        if (!SubmissionStatusResolver.isGraded(status) || submission == null
                || submission.getGrade() == null || assignment.getMaxPoints() <= 0) {
            return null;
        }
        return round(submission.getGrade().doubleValue() * 100.0 / assignment.getMaxPoints());
    }

    private Double average(List<Double> values) {
        List<Double> present = values.stream().filter(Objects::nonNull).toList();
        if (present.isEmpty()) {
            return null;
        }
        return round(present.stream().mapToDouble(Double::doubleValue).sum() / present.size());
    }

    private int bucketIndex(double percent) {
        if (percent < 60) return 0;
        if (percent < 70) return 1;
        if (percent < 80) return 2;
        if (percent < 90) return 3;
        return 4;
    }

    private double round(double value) {
        return BigDecimal.valueOf(value).setScale(1, RoundingMode.HALF_UP).doubleValue();
    }
}
