package com.campusconnect.controller;

import com.campusconnect.dto.announcement.*;
import com.campusconnect.dto.common.PageResponse;
import com.campusconnect.service.AnnouncementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/classrooms/{classroomId}/announcements")
@RequiredArgsConstructor
@Tag(name = "Announcements")
public class AnnouncementController {

    private final AnnouncementService announcementService;

    @GetMapping
    @Operation(summary = "List class stream announcements")
    public PageResponse<AnnouncementResponse> list(
            @PathVariable Long classroomId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return announcementService.list(classroomId, page, size);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Post announcement (teacher)")
    public AnnouncementResponse create(
            @PathVariable Long classroomId,
            @Valid @RequestBody CreateAnnouncementRequest request
    ) {
        return announcementService.create(classroomId, request);
    }

    @PostMapping("/{announcementId}/pin")
    @Operation(summary = "Pin announcement")
    public AnnouncementResponse pin(@PathVariable Long classroomId, @PathVariable Long announcementId) {
        return announcementService.setPinned(classroomId, announcementId, true);
    }

    @PostMapping("/{announcementId}/unpin")
    @Operation(summary = "Unpin announcement")
    public AnnouncementResponse unpin(@PathVariable Long classroomId, @PathVariable Long announcementId) {
        return announcementService.setPinned(classroomId, announcementId, false);
    }

    @DeleteMapping("/{announcementId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete announcement (teacher)")
    public void delete(@PathVariable Long classroomId, @PathVariable Long announcementId) {
        announcementService.delete(classroomId, announcementId);
    }

    @PostMapping("/{announcementId}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Comment on announcement")
    public CommentResponse comment(
            @PathVariable Long classroomId,
            @PathVariable Long announcementId,
            @Valid @RequestBody CommentRequest request
    ) {
        return announcementService.addComment(classroomId, announcementId, request);
    }

    @DeleteMapping("/{announcementId}/comments/{commentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete comment (author or teacher)")
    public void deleteComment(
            @PathVariable Long classroomId,
            @PathVariable Long announcementId,
            @PathVariable Long commentId
    ) {
        announcementService.deleteComment(classroomId, announcementId, commentId);
    }
}
