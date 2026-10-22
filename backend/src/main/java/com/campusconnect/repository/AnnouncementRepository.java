package com.campusconnect.repository;

import com.campusconnect.entity.Announcement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {

    @Query("""
            SELECT DISTINCT a FROM Announcement a
            JOIN FETCH a.classroom
            JOIN FETCH a.author
            WHERE a.classroom.id = :classroomId
            ORDER BY a.pinned DESC, a.createdAt DESC
            """)
    java.util.List<Announcement> findAllForClassroom(@Param("classroomId") Long classroomId);

    Page<Announcement> findByClassroomIdOrderByPinnedDescCreatedAtDesc(Long classroomId, Pageable pageable);

    Optional<Announcement> findByIdAndClassroomId(Long id, Long classroomId);
}
