package com.campusconnect.repository;

import com.campusconnect.entity.Classroom;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ClassroomRepository extends JpaRepository<Classroom, Long> {
    Optional<Classroom> findByClassCode(String classCode);
    boolean existsByClassCode(String classCode);

    /** Admin listing: matches name, subject, class code or owner name; {@code pattern} is a LIKE pattern. */
    @Query(
            value = """
                    SELECT c FROM Classroom c JOIN FETCH c.owner o
                    WHERE LOWER(c.name) LIKE :pattern ESCAPE '!'
                       OR LOWER(c.subject) LIKE :pattern ESCAPE '!'
                       OR LOWER(c.classCode) LIKE :pattern ESCAPE '!'
                       OR LOWER(o.fullName) LIKE :pattern ESCAPE '!'
                    ORDER BY c.createdAt DESC, c.id DESC
                    """,
            countQuery = """
                    SELECT COUNT(c) FROM Classroom c JOIN c.owner o
                    WHERE LOWER(c.name) LIKE :pattern ESCAPE '!'
                       OR LOWER(c.subject) LIKE :pattern ESCAPE '!'
                       OR LOWER(c.classCode) LIKE :pattern ESCAPE '!'
                       OR LOWER(o.fullName) LIKE :pattern ESCAPE '!'
                    """
    )
    Page<Classroom> search(@Param("pattern") String pattern, Pageable pageable);
}
