package com.campusconnect.controller;

import com.campusconnect.dto.grade.ClassAnalyticsResponse;
import com.campusconnect.dto.grade.GradebookResponse;
import com.campusconnect.dto.grade.StudentGradesResponse;
import com.campusconnect.service.GradeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/classrooms/{classroomId}/grades")
@RequiredArgsConstructor
@Tag(name = "Grades")
public class GradeController {

    private static final MediaType XLSX =
            MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    private static final MediaType CSV = MediaType.parseMediaType("text/csv;charset=UTF-8");

    private final GradeService gradeService;

    @GetMapping
    @Operation(summary = "Gradebook matrix with averages (teacher)")
    public GradebookResponse gradebook(@PathVariable Long classroomId) {
        return gradeService.gradebook(classroomId);
    }

    @GetMapping("/me")
    @Operation(summary = "My grades in this class (student)")
    public StudentGradesResponse myGrades(@PathVariable Long classroomId) {
        return gradeService.myGrades(classroomId);
    }

    @GetMapping("/analytics")
    @Operation(summary = "Submission rates and grade distribution (teacher)")
    public ClassAnalyticsResponse analytics(@PathVariable Long classroomId) {
        return gradeService.analytics(classroomId);
    }

    @GetMapping("/export/csv")
    @Operation(summary = "Download gradebook as CSV (teacher)")
    public ResponseEntity<byte[]> exportCsv(@PathVariable Long classroomId) {
        return download(gradeService.exportCsv(classroomId), CSV, "gradebook-" + classroomId + ".csv");
    }

    @GetMapping("/export/xlsx")
    @Operation(summary = "Download gradebook as Excel (teacher)")
    public ResponseEntity<byte[]> exportXlsx(@PathVariable Long classroomId) {
        return download(gradeService.exportXlsx(classroomId), XLSX, "gradebook-" + classroomId + ".xlsx");
    }

    private ResponseEntity<byte[]> download(byte[] content, MediaType type, String filename) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(filename).build().toString())
                .contentType(type)
                .body(content);
    }
}
