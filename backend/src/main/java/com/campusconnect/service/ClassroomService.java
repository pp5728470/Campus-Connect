package com.campusconnect.service;

import com.campusconnect.dto.classroom.*;
import com.campusconnect.dto.common.PageResponse;
import com.campusconnect.entity.ClassRole;
import com.campusconnect.entity.Classroom;
import com.campusconnect.entity.Enrollment;
import com.campusconnect.entity.Role;
import com.campusconnect.entity.User;
import com.campusconnect.exception.ApiException;
import com.campusconnect.mapper.ClassroomMapper;
import com.campusconnect.repository.ClassroomRepository;
import com.campusconnect.repository.EnrollmentRepository;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.security.SecurityUtils;
import com.campusconnect.security.UserPrincipal;
import com.campusconnect.util.ClassCodeGenerator;
import com.campusconnect.util.CoverColor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ClassroomService {

    private final ClassroomRepository classroomRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;
    private final ClassroomMapper classroomMapper;
    private final ClassCodeGenerator classCodeGenerator;

    @Transactional
    public ClassroomResponse create(CreateClassroomRequest request) {
        UserPrincipal principal = SecurityUtils.currentUser();
        if (principal.getRole() != Role.TEACHER && principal.getRole() != Role.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only teachers can create classes");
        }

        User owner = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        Classroom classroom = Classroom.builder()
                .name(request.name().trim())
                .section(trimToNull(request.section()))
                .subject(trimToNull(request.subject()))
                .room(trimToNull(request.room()))
                .description(trimToNull(request.description()))
                .classCode(generateUniqueCode())
                .bannerColor(CoverColor.normalizeOrDefault(request.bannerColor()))
                .owner(owner)
                .archived(false)
                .build();

        classroomRepository.save(classroom);

        Enrollment enrollment = Enrollment.builder()
                .classroom(classroom)
                .user(owner)
                .roleInClass(ClassRole.TEACHER)
                .build();
        enrollmentRepository.save(enrollment);

        return classroomMapper.toResponse(classroom, ClassRole.TEACHER);
    }

    @Transactional
    public ClassroomResponse update(Long classroomId, UpdateClassroomRequest request) {
        Classroom classroom = requireOwnedClassroom(classroomId);
        classroom.setName(request.name().trim());
        classroom.setSection(trimToNull(request.section()));
        classroom.setSubject(trimToNull(request.subject()));
        classroom.setRoom(trimToNull(request.room()));
        classroom.setDescription(trimToNull(request.description()));
        if (request.bannerColor() != null) {
            classroom.setBannerColor(CoverColor.normalizeOrDefault(request.bannerColor()));
        }
        return classroomMapper.toResponse(classroom, ClassRole.TEACHER);
    }

    @Transactional
    public ClassroomResponse archive(Long classroomId) {
        Classroom classroom = requireOwnedClassroom(classroomId);
        classroom.setArchived(true);
        return classroomMapper.toResponse(classroom, ClassRole.TEACHER);
    }

    @Transactional
    public ClassroomResponse regenerateCode(Long classroomId) {
        Classroom classroom = requireOwnedClassroom(classroomId);
        classroom.setClassCode(generateUniqueCode());
        return classroomMapper.toResponse(classroom, ClassRole.TEACHER);
    }

    @Transactional
    public ClassroomResponse join(JoinClassroomRequest request) {
        UserPrincipal principal = SecurityUtils.currentUser();
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        Classroom classroom = classroomRepository.findByClassCode(request.classCode().trim().toUpperCase())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Invalid class code"));

        if (classroom.isArchived()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "This class has been archived");
        }

        if (enrollmentRepository.existsByClassroomIdAndUserId(classroom.getId(), user.getId())) {
            throw new ApiException(HttpStatus.CONFLICT, "You are already enrolled in this class");
        }

        Enrollment enrollment = Enrollment.builder()
                .classroom(classroom)
                .user(user)
                .roleInClass(ClassRole.STUDENT)
                .build();
        enrollmentRepository.save(enrollment);

        return classroomMapper.toResponse(classroom, ClassRole.STUDENT);
    }

    @Transactional(readOnly = true)
    public PageResponse<ClassroomResponse> listMyClasses(int page, int size) {
        UserPrincipal principal = SecurityUtils.currentUser();
        List<Enrollment> enrollments = enrollmentRepository.findActiveByUserId(principal.getId());

        List<ClassroomResponse> all = enrollments.stream()
                .map(e -> classroomMapper.toResponse(e.getClassroom(), e.getRoleInClass()))
                .toList();

        int from = Math.min(page * size, all.size());
        int to = Math.min(from + size, all.size());
        List<ClassroomResponse> content = all.subList(from, to);
        int totalPages = size == 0 ? 0 : (int) Math.ceil((double) all.size() / size);

        return new PageResponse<>(content, page, size, all.size(), totalPages, page >= totalPages - 1 || all.isEmpty());
    }

    @Transactional(readOnly = true)
    public ClassroomResponse getById(Long classroomId) {
        Enrollment enrollment = requireMembership(classroomId);
        return classroomMapper.toResponse(enrollment.getClassroom(), enrollment.getRoleInClass());
    }

    @Transactional(readOnly = true)
    public PageResponse<ClassroomMemberResponse> listPeople(Long classroomId, int page, int size) {
        requireMembership(classroomId);
        List<ClassroomMemberResponse> all = enrollmentRepository.findPeopleByClassroomId(classroomId).stream()
                .map(classroomMapper::toMemberResponse)
                .toList();

        int from = Math.min(page * size, all.size());
        int to = Math.min(from + size, all.size());
        List<ClassroomMemberResponse> content = all.subList(from, to);
        int totalPages = size == 0 ? 0 : (int) Math.ceil((double) all.size() / size);

        return new PageResponse<>(content, page, size, all.size(), totalPages, page >= totalPages - 1 || all.isEmpty());
    }

    @Transactional
    public void removeStudent(Long classroomId, Long studentUserId) {
        Classroom classroom = requireOwnedClassroom(classroomId);

        if (classroom.getOwner().getId().equals(studentUserId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cannot remove the class owner");
        }

        Enrollment enrollment = enrollmentRepository.findByClassroomIdAndUserId(classroomId, studentUserId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Student is not enrolled in this class"));

        if (enrollment.getRoleInClass() != ClassRole.STUDENT) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only students can be removed from a class");
        }

        enrollmentRepository.delete(enrollment);
    }

    private Classroom requireOwnedClassroom(Long classroomId) {
        UserPrincipal principal = SecurityUtils.currentUser();
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Class not found"));

        if (!classroom.getOwner().getId().equals(principal.getId()) && principal.getRole() != Role.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only the class owner can perform this action");
        }
        return classroom;
    }

    private Enrollment requireMembership(Long classroomId) {
        UserPrincipal principal = SecurityUtils.currentUser();
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Class not found"));

        return enrollmentRepository.findByClassroomIdAndUserId(classroom.getId(), principal.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "You are not enrolled in this class"));
    }

    private String generateUniqueCode() {
        for (int i = 0; i < 20; i++) {
            String code = classCodeGenerator.generate();
            if (!classroomRepository.existsByClassCode(code)) {
                return code;
            }
        }
        throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to generate a unique class code");
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
