package com.campusconnect.repository;

import com.campusconnect.entity.StoredFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface StoredFileRepository extends JpaRepository<StoredFile, Long> {
    List<StoredFile> findByIdInAndClassroomId(Collection<Long> ids, Long classroomId);

    Optional<StoredFile> findByStoredName(String storedName);

    boolean existsByStoredName(String storedName);

    @Query("SELECT COALESCE(SUM(f.sizeBytes), 0) FROM StoredFile f")
    long sumSizeBytes();
}
