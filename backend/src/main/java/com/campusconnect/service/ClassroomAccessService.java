package com.campusconnect.service;

import com.campusconnect.entity.ClassRole;
import com.campusconnect.entity.Classroom;
import com.campusconnect.entity.Enrollment;
import com.campusconnect.entity.Role;
import com.campusconnect.exception.ApiException;
import com.campusconnect.repository.ClassroomRepository;
import com.campusconnect.repository.EnrollmentRepository;
import com.campusconnect.security.SecurityUtils;
import com.campusconnect.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ClassroomAccessService {

    private final ClassroomRepository classroomRepository;
    private final EnrollmentRepository enrollmentRepository;

    @Transactional(readOnly = true)
    public Classroom requireClassroom(Long classroomId) {
        return classroomRepository.findById(classroomId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Class not found"));
    }

    /**
     * Ensures the class exists and is not archived. Call on write operations only;
     * members may still read archived classes.
     */
    @Transactional(readOnly = true)
    public Classroom requireActiveClassroom(Long classroomId) {
        Classroom classroom = requireClassroom(classroomId);
        if (classroom.isArchived()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "This class has been archived");
        }
        return classroom;
    }

    @Transactional(readOnly = true)
    public Enrollment requireMembership(Long classroomId) {
        UserPrincipal principal = SecurityUtils.currentUser();
        Classroom classroom = requireClassroom(classroomId);
        return enrollmentRepository.findByClassroomIdAndUserId(classroom.getId(), principal.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "You are not enrolled in this class"));
    }

    @Transactional(readOnly = true)
    public Enrollment requireTeacher(Long classroomId) {
        Enrollment enrollment = requireMembership(classroomId);
        UserPrincipal principal = SecurityUtils.currentUser();
        if (enrollment.getRoleInClass() != ClassRole.TEACHER && principal.getRole() != Role.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only teachers can perform this action");
        }
        return enrollment;
    }

    @Transactional(readOnly = true)
    public boolean isTeacherInClass(Long classroomId) {
        UserPrincipal principal = SecurityUtils.currentUser();
        if (principal.getRole() == Role.ADMIN) {
            return true;
        }
        return enrollmentRepository.findByClassroomIdAndUserId(classroomId, principal.getId())
                .map(e -> e.getRoleInClass() == ClassRole.TEACHER)
                .orElse(false);
    }
}
