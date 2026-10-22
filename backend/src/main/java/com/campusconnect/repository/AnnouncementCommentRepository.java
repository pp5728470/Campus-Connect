package com.campusconnect.repository;

import com.campusconnect.entity.AnnouncementComment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AnnouncementCommentRepository extends JpaRepository<AnnouncementComment, Long> {
    Optional<AnnouncementComment> findByIdAndAnnouncementId(Long id, Long announcementId);
}
