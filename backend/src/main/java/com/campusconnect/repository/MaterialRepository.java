package com.campusconnect.repository;

import com.campusconnect.entity.Material;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MaterialRepository extends JpaRepository<Material, Long> {

    @Query("""
            SELECT DISTINCT m FROM Material m
            JOIN FETCH m.classroom
            LEFT JOIN FETCH m.topic
            LEFT JOIN FETCH m.createdBy
            WHERE m.classroom.id = :classroomId
            ORDER BY m.createdAt DESC
            """)
    List<Material> findAllForClassroom(@Param("classroomId") Long classroomId);

    Optional<Material> findByIdAndClassroomId(Long id, Long classroomId);
}
