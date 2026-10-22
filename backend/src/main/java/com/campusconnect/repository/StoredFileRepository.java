package com.campusconnect.repository;

import com.campusconnect.entity.StoredFile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface StoredFileRepository extends JpaRepository<StoredFile, Long> {
    List<StoredFile> findByIdInAndClassroomId(Collection<Long> ids, Long classroomId);
}
