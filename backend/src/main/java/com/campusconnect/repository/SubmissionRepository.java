package com.campusconnect.repository;

import com.campusconnect.entity.Submission;
import com.campusconnect.entity.SubmissionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {

    Optional<Submission> findByAssignmentIdAndStudentId(Long assignmentId, Long studentId);

    @Query("""
            SELECT DISTINCT s FROM Submission s
            JOIN FETCH s.student
            LEFT JOIN FETCH s.gradedBy
            WHERE s.assignment.id = :assignmentId
            ORDER BY s.student.fullName ASC
            """)
    List<Submission> findAllForAssignment(@Param("assignmentId") Long assignmentId);

    long countByAssignmentIdAndStatusIn(Long assignmentId, Collection<SubmissionStatus> statuses);

    List<Submission> findByStudentIdAndAssignmentClassroomIdIn(Long studentId, Collection<Long> classroomIds);

    @Query("""
            SELECT s FROM Submission s
            JOIN FETCH s.assignment a
            WHERE a.classroom.id = :classroomId
            """)
    List<Submission> findAllForClassroom(@Param("classroomId") Long classroomId);
}
