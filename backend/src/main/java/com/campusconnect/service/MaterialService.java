package com.campusconnect.service;

import com.campusconnect.dto.common.PageResponse;
import com.campusconnect.dto.material.MaterialRequest;
import com.campusconnect.dto.material.MaterialResponse;
import com.campusconnect.entity.Material;
import com.campusconnect.entity.User;
import com.campusconnect.exception.ApiException;
import com.campusconnect.repository.MaterialRepository;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MaterialService {

    private final MaterialRepository materialRepository;
    private final UserRepository userRepository;
    private final ClassroomAccessService classroomAccessService;
    private final TopicService topicService;
    private final FileStorageService fileStorageService;

    @Transactional(readOnly = true)
    public PageResponse<MaterialResponse> list(Long classroomId, int page, int size) {
        classroomAccessService.requireMembership(classroomId);
        List<MaterialResponse> all = materialRepository.findAllForClassroom(classroomId).stream()
                .map(this::toResponse)
                .toList();
        return pageOf(all, page, size);
    }

    @Transactional(readOnly = true)
    public MaterialResponse get(Long classroomId, Long materialId) {
        classroomAccessService.requireMembership(classroomId);
        return toResponse(requireMaterial(classroomId, materialId));
    }

    @Transactional
    public MaterialResponse create(Long classroomId, MaterialRequest request) {
        classroomAccessService.requireTeacher(classroomId);
        User creator = currentUserEntity();
        Material material = Material.builder()
                .classroom(classroomAccessService.requireClassroom(classroomId))
                .topic(topicService.requireTopic(classroomId, request.topicId()))
                .title(request.title().trim())
                .description(trimToNull(request.description()))
                .createdBy(creator)
                .files(new HashSet<>(fileStorageService.resolveForClassroom(classroomId, request.fileIds())))
                .build();
        if (material.getFiles().isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "At least one file is required");
        }
        materialRepository.save(material);
        return toResponse(material);
    }

    @Transactional
    public MaterialResponse update(Long classroomId, Long materialId, MaterialRequest request) {
        classroomAccessService.requireTeacher(classroomId);
        Material material = requireMaterial(classroomId, materialId);
        material.setTitle(request.title().trim());
        material.setDescription(trimToNull(request.description()));
        material.setTopic(topicService.requireTopic(classroomId, request.topicId()));
        if (request.fileIds() != null) {
            material.setFiles(new HashSet<>(fileStorageService.resolveForClassroom(classroomId, request.fileIds())));
            if (material.getFiles().isEmpty()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "At least one file is required");
            }
        }
        return toResponse(material);
    }

    @Transactional
    public void delete(Long classroomId, Long materialId) {
        classroomAccessService.requireTeacher(classroomId);
        materialRepository.delete(requireMaterial(classroomId, materialId));
    }

    private Material requireMaterial(Long classroomId, Long materialId) {
        return materialRepository.findByIdAndClassroomId(materialId, classroomId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Material not found"));
    }

    private User currentUserEntity() {
        return userRepository.findById(SecurityUtils.currentUser().getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private MaterialResponse toResponse(Material material) {
        material.getFiles().size();
        return new MaterialResponse(
                material.getId(),
                material.getClassroom().getId(),
                material.getTopic() != null ? material.getTopic().getId() : null,
                material.getTopic() != null ? material.getTopic().getName() : null,
                material.getTitle(),
                material.getDescription(),
                material.getCreatedBy().getId(),
                material.getCreatedBy().getFullName(),
                fileStorageService.toResponses(material.getFiles()),
                material.getCreatedAt(),
                material.getUpdatedAt()
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
