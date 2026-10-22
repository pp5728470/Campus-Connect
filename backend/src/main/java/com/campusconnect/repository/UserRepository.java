package com.campusconnect.repository;

import com.campusconnect.entity.Role;
import com.campusconnect.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    Page<User> findByRole(Role role, Pageable pageable);

    long countByRole(Role role);

    /** Case-insensitive match on name or email; {@code pattern} is a ready-made LIKE pattern. */
    @Query("""
            SELECT u FROM User u
            WHERE LOWER(u.fullName) LIKE :pattern ESCAPE '!' OR LOWER(u.email) LIKE :pattern ESCAPE '!'
            ORDER BY u.createdAt DESC, u.id DESC
            """)
    Page<User> search(@Param("pattern") String pattern, Pageable pageable);

    @Query("""
            SELECT u FROM User u
            WHERE u.role = :role
              AND (LOWER(u.fullName) LIKE :pattern ESCAPE '!' OR LOWER(u.email) LIKE :pattern ESCAPE '!')
            ORDER BY u.createdAt DESC, u.id DESC
            """)
    Page<User> searchByRole(@Param("pattern") String pattern, @Param("role") Role role, Pageable pageable);
}
