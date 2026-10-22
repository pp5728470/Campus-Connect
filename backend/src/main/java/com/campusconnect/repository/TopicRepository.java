package com.campusconnect.repository;

import com.campusconnect.entity.Topic;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TopicRepository extends JpaRepository<Topic, Long> {
    List<Topic> findByClassroomIdOrderBySortOrderAscNameAsc(Long classroomId);

    Optional<Topic> findByIdAndClassroomId(Long id, Long classroomId);
}
