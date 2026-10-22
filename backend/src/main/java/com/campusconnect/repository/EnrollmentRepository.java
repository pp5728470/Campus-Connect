package com.campusconnect.repository;

import com.campusconnect.entity.ClassRole;
import com.campusconnect.entity.Enrollment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {

    Optional<Enrollment> findByClassroomIdAndUserId(Long classroomId, Long userId);

    boolean existsByClassroomIdAndUserId(Long classroomId, Long userId);

    @Query("""
            SELECT e FROM Enrollment e
            JOIN FETCH e.classroom c
            JOIN FETCH c.owner
            WHERE e.user.id = :userId AND c.archived = false
            ORDER BY c.createdAt DESC
            """)
    List<Enrollment> findActiveByUserId(@Param("userId") Long userId);

    @Query("""
            SELECT e FROM Enrollment e
            JOIN FETCH e.user
            WHERE e.classroom.id = :classroomId
            ORDER BY e.roleInClass ASC, e.user.fullName ASC
            """)
    List<Enrollment> findPeopleByClassroomId(@Param("classroomId") Long classroomId);

    Page<Enrollment> findByClassroomIdAndRoleInClass(Long classroomId, ClassRole roleInClass, Pageable pageable);

    void deleteByClassroomIdAndUserId(Long classroomId, Long userId);
}
