package com.campusconnect.repository;

import com.campusconnect.entity.Notification;
import com.campusconnect.entity.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    @Query("""
            SELECT n FROM Notification n
            LEFT JOIN FETCH n.classroom
            WHERE n.user.id = :userId
            ORDER BY n.createdAt DESC, n.id DESC
            """)
    Page<Notification> findForUser(@Param("userId") Long userId, Pageable pageable);

    @Query("""
            SELECT n FROM Notification n
            LEFT JOIN FETCH n.classroom
            WHERE n.user.id = :userId AND n.read = false
            ORDER BY n.createdAt DESC, n.id DESC
            """)
    Page<Notification> findUnreadForUser(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.user.id = :userId AND n.read = false")
    long countUnread(@Param("userId") Long userId);

    Optional<Notification> findByIdAndUserId(Long id, Long userId);

    @Modifying
    @Query("UPDATE Notification n SET n.read = true WHERE n.user.id = :userId AND n.read = false")
    int markAllRead(@Param("userId") Long userId);

    /** Used to keep scheduled reminders idempotent. */
    @Query("""
            SELECT COUNT(n) > 0 FROM Notification n
            WHERE n.user.id = :userId AND n.type = :type AND n.link = :link AND n.createdAt >= :since
            """)
    boolean existsSince(
            @Param("userId") Long userId,
            @Param("type") NotificationType type,
            @Param("link") String link,
            @Param("since") Instant since
    );
}
