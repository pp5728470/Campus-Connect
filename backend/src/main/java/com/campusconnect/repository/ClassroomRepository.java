package com.campusconnect.repository;

import com.campusconnect.entity.Classroom;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ClassroomRepository extends JpaRepository<Classroom, Long> {
    Optional<Classroom> findByClassCode(String classCode);
    boolean existsByClassCode(String classCode);
}
