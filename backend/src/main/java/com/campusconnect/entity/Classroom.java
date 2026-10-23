package com.campusconnect.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "classrooms")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Classroom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(length = 60)
    private String section;

    @Column(length = 120)
    private String subject;

    @Column(length = 60)
    private String room;

    @Column(length = 1000)
    private String description;

    @Column(name = "class_code", nullable = false, unique = true, length = 7, columnDefinition = "CHAR(7)")
    private String classCode;

    /** One of: teal, maroon, forest, indigo, steel, ochre. */
    @Column(name = "banner_color", nullable = false, length = 16)
    private String bannerColor;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(nullable = false)
    @Builder.Default
    private boolean archived = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
