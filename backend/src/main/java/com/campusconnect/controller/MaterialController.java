package com.campusconnect.controller;

import com.campusconnect.dto.common.PageResponse;
import com.campusconnect.dto.material.MaterialRequest;
import com.campusconnect.dto.material.MaterialResponse;
import com.campusconnect.service.MaterialService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/classrooms/{classroomId}/materials")
@RequiredArgsConstructor
@Tag(name = "Materials")
public class MaterialController {

    private final MaterialService materialService;

    @GetMapping
    @Operation(summary = "List study materials")
    public PageResponse<MaterialResponse> list(
            @PathVariable Long classroomId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        return materialService.list(classroomId, page, size);
    }

    @GetMapping("/{materialId}")
    @Operation(summary = "Get material details")
    public MaterialResponse get(@PathVariable Long classroomId, @PathVariable Long materialId) {
        return materialService.get(classroomId, materialId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create material (teacher)")
    public MaterialResponse create(@PathVariable Long classroomId, @Valid @RequestBody MaterialRequest request) {
        return materialService.create(classroomId, request);
    }

    @PutMapping("/{materialId}")
    @Operation(summary = "Update material (teacher)")
    public MaterialResponse update(
            @PathVariable Long classroomId,
            @PathVariable Long materialId,
            @Valid @RequestBody MaterialRequest request
    ) {
        return materialService.update(classroomId, materialId, request);
    }

    @DeleteMapping("/{materialId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete material (teacher)")
    public void delete(@PathVariable Long classroomId, @PathVariable Long materialId) {
        materialService.delete(classroomId, materialId);
    }
}
