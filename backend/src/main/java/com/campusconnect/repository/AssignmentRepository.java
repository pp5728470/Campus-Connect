package com.campusconnect.repository;

import com.campusconnect.entity.Assignment;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface AssignmentRepository extends JpaRepository<Assignment, Long> {

    @Query("""
            SELECT DISTINCT a FROM Assignment a
            JOIN FETCH a.classroom
            LEFT JOIN FETCH a.topic
            LEFT JOIN FETCH a.createdBy
            WHERE a.classroom.id = :classroomId
            ORDER BY a.createdAt DESC
            """)
    List<Assignment> findAllForClassroom(@Param("classroomId") Long classroomId);

    @Query("""
            SELECT DISTINCT a FROM Assignment a
            JOIN FETCH a.classroom c
            LEFT JOIN FETCH a.topic
            WHERE a.id = :id
            """)
    Optional<Assignment> findDetailedById(@Param("id") Long id);

    Optional<Assignment> findByIdAndClassroomId(Long id, Long classroomId);

    @Query("""
            SELECT a FROM Assignment a
            JOIN FETCH a.classroom
            WHERE a.classroom.id IN :classroomIds
            ORDER BY a.createdAt DESC
            """)
    List<Assignment> findByClassroomIdIn(@Param("classroomIds") List<Long> classroomIds);

    @Query("""
            SELECT a FROM Assignment a
            JOIN FETCH a.classroom c
            WHERE c.id IN :classroomIds AND a.dueAt >= :from AND a.dueAt < :to
            ORDER BY a.dueAt ASC
            """)
    List<Assignment> findDueBetweenForClassrooms(
            @Param("classroomIds") Collection<Long> classroomIds,
            @Param("from") Instant from,
            @Param("to") Instant to
    );

    /** Non-archived assignments falling due inside the window, used by the reminder job. */
    @Query("""
            SELECT a FROM Assignment a
            JOIN FETCH a.classroom c
            WHERE c.archived = false AND a.dueAt > :from AND a.dueAt <= :to
            ORDER BY a.dueAt ASC
            """)
    List<Assignment> findDueBetween(@Param("from") Instant from, @Param("to") Instant to);

    @Query("""
            SELECT a FROM Assignment a
            JOIN FETCH a.classroom c
            WHERE c.id IN :classroomIds AND LOWER(a.title) LIKE :pattern ESCAPE '!'
            ORDER BY a.createdAt DESC
            """)
    List<Assignment> searchByTitle(
            @Param("classroomIds") Collection<Long> classroomIds,
            @Param("pattern") String pattern,
            Pageable pageable
    );
}

