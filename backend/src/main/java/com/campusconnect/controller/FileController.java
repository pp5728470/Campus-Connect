package com.campusconnect.controller;

import com.campusconnect.dto.file.FileResponse;
import com.campusconnect.mapper.FileMapper;
import com.campusconnect.service.FileStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Files")
public class FileController {

    private final FileStorageService fileStorageService;
    private final FileMapper fileMapper;

    @PostMapping(value = "/classrooms/{classroomId}/files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload one or more files for a class")
    public List<FileResponse> upload(
            @PathVariable Long classroomId,
            @RequestPart("files") MultipartFile[] files
    ) {
        return fileStorageService.storeMany(classroomId, Arrays.asList(files)).stream()
                .map(fileMapper::toResponse)
                .toList();
    }

    @GetMapping("/files/{fileId}")
    @Operation(summary = "Get file metadata")
    public FileResponse metadata(@PathVariable Long fileId) {
        return fileStorageService.getMetadata(fileId);
    }

    @GetMapping("/files/{fileId}/download")
    @Operation(summary = "Download a file (membership required)")
    public ResponseEntity<Resource> download(@PathVariable Long fileId) {
        Resource resource = fileStorageService.loadAsResource(fileId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, fileStorageService.contentDisposition(fileId))
                .contentType(MediaType.parseMediaType(fileStorageService.contentType(fileId)))
                .body(resource);
    }
}
