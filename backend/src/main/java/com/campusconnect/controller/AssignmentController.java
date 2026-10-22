package com.campusconnect.controller;

import com.campusconnect.dto.assignment.*;
import com.campusconnect.dto.common.PageResponse;
import com.campusconnect.service.AssignmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "Assignments")
public class AssignmentController {

    private final AssignmentService assignmentService;

    @GetMapping("/api/classrooms/{classroomId}/assignments")
    @Operation(summary = "List assignments")
    public PageResponse<AssignmentResponse> list(
            @PathVariable Long classroomId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        return assignmentService.list(classroomId, page, size);
    }

    @GetMapping("/api/classrooms/{classroomId}/assignments/{assignmentId}")
    @Operation(summary = "Get assignment")
    public AssignmentResponse get(@PathVariable Long classroomId, @PathVariable Long assignmentId) {
        return assignmentService.get(classroomId, assignmentId);
    }

    @PostMapping("/api/classrooms/{classroomId}/assignments")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create assignment (teacher)")
    public AssignmentResponse create(
            @PathVariable Long classroomId,
            @Valid @RequestBody AssignmentRequest request
    ) {
        return assignmentService.create(classroomId, request);
    }

    @PutMapping("/api/classrooms/{classroomId}/assignments/{assignmentId}")
    @Operation(summary = "Update assignment (teacher)")
    public AssignmentResponse update(
            @PathVariable Long classroomId,
            @PathVariable Long assignmentId,
            @Valid @RequestBody AssignmentRequest request
    ) {
        return assignmentService.update(classroomId, assignmentId, request);
    }

    @DeleteMapping("/api/classrooms/{classroomId}/assignments/{assignmentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete assignment (teacher)")
    public void delete(@PathVariable Long classroomId, @PathVariable Long assignmentId) {
        assignmentService.delete(classroomId, assignmentId);
    }

    @GetMapping("/api/classrooms/{classroomId}/assignments/{assignmentId}/submissions")
    @Operation(summary = "List submissions with counts (teacher)")
    public SubmissionSummaryResponse submissions(
            @PathVariable Long classroomId,
            @PathVariable Long assignmentId
    ) {
        return assignmentService.listSubmissions(classroomId, assignmentId);
    }

    @GetMapping("/api/classrooms/{classroomId}/assignments/{assignmentId}/my-submission")
    @Operation(summary = "Get current student's submission")
    public SubmissionResponse mySubmission(
            @PathVariable Long classroomId,
            @PathVariable Long assignmentId
    ) {
        return assignmentService.getMySubmission(classroomId, assignmentId);
    }

    @PostMapping("/api/classrooms/{classroomId}/assignments/{assignmentId}/submit")
    @Operation(summary = "Submit or resubmit work (student)")
    public SubmissionResponse submit(
            @PathVariable Long classroomId,
            @PathVariable Long assignmentId,
            @Valid @RequestBody SubmissionRequest request
    ) {
        return assignmentService.submit(classroomId, assignmentId, request);
    }

    @PostMapping("/api/classrooms/{classroomId}/assignments/{assignmentId}/unsubmit")
    @Operation(summary = "Unsubmit before grading (student)")
    public SubmissionResponse unsubmit(
            @PathVariable Long classroomId,
            @PathVariable Long assignmentId
    ) {
        return assignmentService.unsubmit(classroomId, assignmentId);
    }

    @PostMapping("/api/classrooms/{classroomId}/assignments/{assignmentId}/submissions/{studentId}/grade")
    @Operation(summary = "Grade a submission (teacher)")
    public SubmissionResponse grade(
            @PathVariable Long classroomId,
            @PathVariable Long assignmentId,
            @PathVariable Long studentId,
            @Valid @RequestBody GradeRequest request
    ) {
        return assignmentService.grade(classroomId, assignmentId, studentId, request);
    }

    @GetMapping("/api/me/todo")
    @Operation(summary = "Student to-do across all classes")
    public List<TodoItemResponse> todo() {
        return assignmentService.todo();
    }
}
