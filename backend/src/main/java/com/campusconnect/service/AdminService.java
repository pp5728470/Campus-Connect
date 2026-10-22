package com.campusconnect.service;

import com.campusconnect.dto.admin.AdminClassroomResponse;
import com.campusconnect.dto.admin.AdminStatsResponse;
import com.campusconnect.dto.common.PageResponse;
import com.campusconnect.dto.user.UserResponse;
import com.campusconnect.entity.Classroom;
import com.campusconnect.entity.Role;
import com.campusconnect.entity.User;
import com.campusconnect.exception.ApiException;
import com.campusconnect.mapper.UserMapper;
import com.campusconnect.repository.ClassroomRepository;
import com.campusconnect.repository.EnrollmentRepository;
import com.campusconnect.repository.RefreshTokenRepository;
import com.campusconnect.repository.StoredFileRepository;
import com.campusconnect.repository.SubmissionRepository;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.security.SecurityUtils;
import com.campusconnect.util.LikePattern;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** Platform administration. Every operation re-checks the ADMIN role here, not only at the web layer. */
@Service
@RequiredArgsConstructor
public class AdminService {

    private static final int MAX_PAGE_SIZE = 100;

    private final UserRepository userRepository;
    private final ClassroomRepository classroomRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final SubmissionRepository submissionRepository;
    private final StoredFileRepository storedFileRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserMapper userMapper;

    @Transactional(readOnly = true)
    public AdminStatsResponse stats() {
        requireAdmin();
        return new AdminStatsResponse(
                userRepository.count(),
                userRepository.countByRole(Role.TEACHER),
                userRepository.countByRole(Role.STUDENT),
                userRepository.countByRole(Role.ADMIN),
                classroomRepository.count(),
                submissionRepository.count(),
                storedFileRepository.sumSizeBytes()
        );
    }

    @Transactional(readOnly = true)
    public PageResponse<UserResponse> listUsers(String query, Role role, int page, int size) {
        requireAdmin();
        Pageable pageable = pageable(page, size);
        String pattern = LikePattern.contains(query == null ? "" : query);
        Page<User> users = role == null
                ? userRepository.search(pattern, pageable)
                : userRepository.searchByRole(pattern, role, pageable);
        return PageResponse.from(users.map(userMapper::toResponse));
    }

    @Transactional
    public UserResponse setActive(Long userId, boolean active) {
        requireAdmin();
        User user = requireUser(userId);
        if (!active && user.getId().equals(SecurityUtils.currentUser().getId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "You cannot deactivate your own account");
        }
        user.setActive(active);
        if (active) {
            // Reactivation also lifts any brute-force lock
            user.setFailedLoginAttempts(0);
            user.setLockedUntil(null);
        } else {
            refreshTokenRepository.revokeAllByUserId(user.getId());
        }
        return userMapper.toResponse(user);
    }

    @Transactional
    public UserResponse setRole(Long userId, Role role) {
        requireAdmin();
        User user = requireUser(userId);
        if (user.getId().equals(SecurityUtils.currentUser().getId()) && role != Role.ADMIN) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "You cannot remove your own admin role");
        }
        user.setRole(role);
        return userMapper.toResponse(user);
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminClassroomResponse> listClassrooms(String query, int page, int size) {
        requireAdmin();
        Page<Classroom> classrooms = classroomRepository.search(
                LikePattern.contains(query == null ? "" : query), pageable(page, size));

        Map<Long, Long> studentCounts = new HashMap<>();
        List<Long> ids = classrooms.getContent().stream().map(Classroom::getId).toList();
        if (!ids.isEmpty()) {
            for (Object[] row : enrollmentRepository.countStudentsByClassroomIds(ids)) {
                studentCounts.put((Long) row[0], (Long) row[1]);
            }
        }
        return PageResponse.from(classrooms.map(c -> new AdminClassroomResponse(
                c.getId(),
                c.getName(),
                c.getSection(),
                c.getSubject(),
                c.getClassCode(),
                c.getOwner().getId(),
                c.getOwner().getFullName(),
                c.isArchived(),
                studentCounts.getOrDefault(c.getId(), 0L),
                c.getCreatedAt()
        )));
    }

    private void requireAdmin() {
        if (SecurityUtils.currentUser().getRole() != Role.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Administrator access required");
        }
    }

    private User requireUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private Pageable pageable(int page, int size) {
        return PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), MAX_PAGE_SIZE));
    }
}
