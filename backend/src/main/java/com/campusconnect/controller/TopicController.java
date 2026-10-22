package com.campusconnect.controller;

import com.campusconnect.dto.topic.TopicRequest;
import com.campusconnect.dto.topic.TopicResponse;
import com.campusconnect.service.TopicService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/classrooms/{classroomId}/topics")
@RequiredArgsConstructor
@Tag(name = "Topics")
public class TopicController {

    private final TopicService topicService;

    @GetMapping
    @Operation(summary = "List topics in a class")
    public List<TopicResponse> list(@PathVariable Long classroomId) {
        return topicService.list(classroomId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create topic (teacher)")
    public TopicResponse create(@PathVariable Long classroomId, @Valid @RequestBody TopicRequest request) {
        return topicService.create(classroomId, request);
    }

    @PutMapping("/{topicId}")
    @Operation(summary = "Update topic (teacher)")
    public TopicResponse update(
            @PathVariable Long classroomId,
            @PathVariable Long topicId,
            @Valid @RequestBody TopicRequest request
    ) {
        return topicService.update(classroomId, topicId, request);
    }

    @DeleteMapping("/{topicId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete topic (teacher)")
    public void delete(@PathVariable Long classroomId, @PathVariable Long topicId) {
        topicService.delete(classroomId, topicId);
    }
}
