package com.campusconnect.service;

import com.campusconnect.dto.topic.TopicRequest;
import com.campusconnect.dto.topic.TopicResponse;
import com.campusconnect.entity.Topic;
import com.campusconnect.exception.ApiException;
import com.campusconnect.repository.TopicRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TopicService {

    private final TopicRepository topicRepository;
    private final ClassroomAccessService classroomAccessService;

    @Transactional(readOnly = true)
    public List<TopicResponse> list(Long classroomId) {
        classroomAccessService.requireMembership(classroomId);
        return topicRepository.findByClassroomIdOrderBySortOrderAscNameAsc(classroomId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public TopicResponse create(Long classroomId, TopicRequest request) {
        classroomAccessService.requireTeacher(classroomId);
        Topic topic = Topic.builder()
                .classroom(classroomAccessService.requireClassroom(classroomId))
                .name(request.name().trim())
                .sortOrder(request.sortOrder() != null ? request.sortOrder() : 0)
                .build();
        topicRepository.save(topic);
        return toResponse(topic);
    }

    @Transactional
    public TopicResponse update(Long classroomId, Long topicId, TopicRequest request) {
        classroomAccessService.requireTeacher(classroomId);
        Topic topic = topicRepository.findByIdAndClassroomId(topicId, classroomId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Topic not found"));
        topic.setName(request.name().trim());
        if (request.sortOrder() != null) {
            topic.setSortOrder(request.sortOrder());
        }
        return toResponse(topic);
    }

    @Transactional
    public void delete(Long classroomId, Long topicId) {
        classroomAccessService.requireTeacher(classroomId);
        Topic topic = topicRepository.findByIdAndClassroomId(topicId, classroomId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Topic not found"));
        topicRepository.delete(topic);
    }

    public Topic requireTopic(Long classroomId, Long topicId) {
        if (topicId == null) {
            return null;
        }
        return topicRepository.findByIdAndClassroomId(topicId, classroomId)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Topic does not belong to this class"));
    }

    private TopicResponse toResponse(Topic topic) {
        return new TopicResponse(
                topic.getId(),
                topic.getClassroom().getId(),
                topic.getName(),
                topic.getSortOrder(),
                topic.getCreatedAt()
        );
    }
}
