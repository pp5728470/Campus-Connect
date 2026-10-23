package com.campusconnect.repository;

import com.campusconnect.entity.StoredFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface StoredFileRepository extends JpaRepository<StoredFile, Long> {
    List<StoredFile> findByIdInAndClassroomId(Collection<Long> ids, Long classroomId);

    Optional<StoredFile> findByStoredName(String storedName);

    boolean existsByStoredName(String storedName);

    @Query("SELECT COALESCE(SUM(f.sizeBytes), 0) FROM StoredFile f")
    long sumSizeBytes();

    @Query(value = """
            SELECT CASE WHEN EXISTS (
                SELECT 1 FROM announcement_attachments WHERE file_id = :fileId
                UNION ALL
                SELECT 1 FROM material_files WHERE file_id = :fileId
                UNION ALL
                SELECT 1 FROM assignment_attachments WHERE file_id = :fileId
            ) THEN 1 ELSE 0 END
            """, nativeQuery = true)
    int countClassContentAttachments(@Param("fileId") Long fileId);

    @Query(value = """
            SELECT CASE WHEN EXISTS (
                SELECT 1 FROM submission_files WHERE file_id = :fileId
            ) THEN 1 ELSE 0 END
            """, nativeQuery = true)
    int countSubmissionAttachments(@Param("fileId") Long fileId);

    @Query(value = """
            SELECT s.student_id FROM submission_files sf
            INNER JOIN submissions s ON s.id = sf.submission_id
            WHERE sf.file_id = :fileId
            LIMIT 1
            """, nativeQuery = true)
    Optional<Long> findSubmissionOwnerIdByFileId(@Param("fileId") Long fileId);

    default boolean isAttachedToClassContent(Long fileId) {
        return countClassContentAttachments(fileId) > 0;
    }

    default boolean isAttachedToSubmission(Long fileId) {
        return countSubmissionAttachments(fileId) > 0;
    }
}
