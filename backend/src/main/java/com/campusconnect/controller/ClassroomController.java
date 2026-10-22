package com.campusconnect.controller;

import com.campusconnect.dto.classroom.*;
import com.campusconnect.dto.common.PageResponse;
import com.campusconnect.service.ClassroomService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/classrooms")
@RequiredArgsConstructor
@Tag(name = "Classrooms")
public class ClassroomController {

    private final ClassroomService classroomService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a class (teacher)")
    public ClassroomResponse create(@Valid @RequestBody CreateClassroomRequest request) {
        return classroomService.create(request);
    }

    @GetMapping
    @Operation(summary = "List my classes (teaching and enrolled)")
    public PageResponse<ClassroomResponse> listMine(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return classroomService.listMyClasses(page, size);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get class details")
    public ClassroomResponse get(@PathVariable Long id) {
        return classroomService.getById(id);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Edit class (owner only)")
    public ClassroomResponse update(@PathVariable Long id, @Valid @RequestBody UpdateClassroomRequest request) {
        return classroomService.update(id, request);
    }

    @PostMapping("/{id}/archive")
    @Operation(summary = "Archive class (owner only)")
    public ClassroomResponse archive(@PathVariable Long id) {
        return classroomService.archive(id);
    }

    @PostMapping("/{id}/regenerate-code")
    @Operation(summary = "Regenerate class code (owner only)")
    public ClassroomResponse regenerateCode(@PathVariable Long id) {
        return classroomService.regenerateCode(id);
    }

    @PostMapping("/join")
    @Operation(summary = "Join a class with class code")
    public ClassroomResponse join(@Valid @RequestBody JoinClassroomRequest request) {
        return classroomService.join(request);
    }

    @GetMapping("/{id}/people")
    @Operation(summary = "List people in a class")
    public PageResponse<ClassroomMemberResponse> people(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        return classroomService.listPeople(id, page, size);
    }

    @DeleteMapping("/{id}/people/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Remove a student from class (owner only)")
    public void removeStudent(@PathVariable Long id, @PathVariable Long userId) {
        classroomService.removeStudent(id, userId);
    }
}
