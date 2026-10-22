CREATE TABLE stored_files (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    classroom_id   BIGINT       NOT NULL,
    uploaded_by    BIGINT       NOT NULL,
    stored_name    VARCHAR(64)  NOT NULL,
    original_name  VARCHAR(255) NOT NULL,
    content_type   VARCHAR(120) NOT NULL,
    size_bytes     BIGINT       NOT NULL,
    created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_stored_files_stored_name UNIQUE (stored_name),
    CONSTRAINT fk_stored_files_classroom FOREIGN KEY (classroom_id) REFERENCES classrooms (id) ON DELETE CASCADE,
    CONSTRAINT fk_stored_files_uploader FOREIGN KEY (uploaded_by) REFERENCES users (id)
);

CREATE TABLE topics (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    classroom_id BIGINT       NOT NULL,
    name         VARCHAR(160) NOT NULL,
    sort_order   INT          NOT NULL DEFAULT 0,
    created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_topics_classroom FOREIGN KEY (classroom_id) REFERENCES classrooms (id) ON DELETE CASCADE
);

CREATE TABLE announcements (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    classroom_id BIGINT        NOT NULL,
    author_id    BIGINT        NOT NULL,
    body         VARCHAR(4000) NOT NULL,
    pinned       BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_announcements_classroom FOREIGN KEY (classroom_id) REFERENCES classrooms (id) ON DELETE CASCADE,
    CONSTRAINT fk_announcements_author FOREIGN KEY (author_id) REFERENCES users (id)
);

CREATE TABLE announcement_attachments (
    announcement_id BIGINT NOT NULL,
    file_id         BIGINT NOT NULL,
    PRIMARY KEY (announcement_id, file_id),
    CONSTRAINT fk_ann_attach_announcement FOREIGN KEY (announcement_id) REFERENCES announcements (id) ON DELETE CASCADE,
    CONSTRAINT fk_ann_attach_file FOREIGN KEY (file_id) REFERENCES stored_files (id) ON DELETE CASCADE
);

CREATE TABLE announcement_comments (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    announcement_id BIGINT        NOT NULL,
    author_id       BIGINT        NOT NULL,
    body            VARCHAR(2000) NOT NULL,
    created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ann_comments_announcement FOREIGN KEY (announcement_id) REFERENCES announcements (id) ON DELETE CASCADE,
    CONSTRAINT fk_ann_comments_author FOREIGN KEY (author_id) REFERENCES users (id)
);

CREATE TABLE materials (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    classroom_id BIGINT        NOT NULL,
    topic_id     BIGINT        NULL,
    title        VARCHAR(200)  NOT NULL,
    description  VARCHAR(2000) NULL,
    created_by   BIGINT        NOT NULL,
    created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_materials_classroom FOREIGN KEY (classroom_id) REFERENCES classrooms (id) ON DELETE CASCADE,
    CONSTRAINT fk_materials_topic FOREIGN KEY (topic_id) REFERENCES topics (id) ON DELETE SET NULL,
    CONSTRAINT fk_materials_creator FOREIGN KEY (created_by) REFERENCES users (id)
);

CREATE TABLE material_files (
    material_id BIGINT NOT NULL,
    file_id     BIGINT NOT NULL,
    PRIMARY KEY (material_id, file_id),
    CONSTRAINT fk_material_files_material FOREIGN KEY (material_id) REFERENCES materials (id) ON DELETE CASCADE,
    CONSTRAINT fk_material_files_file FOREIGN KEY (file_id) REFERENCES stored_files (id) ON DELETE CASCADE
);

CREATE TABLE assignments (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    classroom_id BIGINT        NOT NULL,
    topic_id     BIGINT        NULL,
    title        VARCHAR(200)  NOT NULL,
    instructions VARCHAR(4000) NULL,
    max_points   INT           NOT NULL DEFAULT 100,
    due_at       TIMESTAMP     NULL,
    allow_late   BOOLEAN       NOT NULL DEFAULT TRUE,
    created_by   BIGINT        NOT NULL,
    created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_assignments_classroom FOREIGN KEY (classroom_id) REFERENCES classrooms (id) ON DELETE CASCADE,
    CONSTRAINT fk_assignments_topic FOREIGN KEY (topic_id) REFERENCES topics (id) ON DELETE SET NULL,
    CONSTRAINT fk_assignments_creator FOREIGN KEY (created_by) REFERENCES users (id)
);

CREATE TABLE assignment_attachments (
    assignment_id BIGINT NOT NULL,
    file_id       BIGINT NOT NULL,
    PRIMARY KEY (assignment_id, file_id),
    CONSTRAINT fk_asg_attach_assignment FOREIGN KEY (assignment_id) REFERENCES assignments (id) ON DELETE CASCADE,
    CONSTRAINT fk_asg_attach_file FOREIGN KEY (file_id) REFERENCES stored_files (id) ON DELETE CASCADE
);

CREATE TABLE submissions (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    assignment_id BIGINT        NOT NULL,
    student_id    BIGINT        NOT NULL,
    text_answer   VARCHAR(4000) NULL,
    status        VARCHAR(20)   NOT NULL,
    submitted_at  TIMESTAMP     NULL,
    grade         DECIMAL(6,2)  NULL,
    feedback      VARCHAR(2000) NULL,
    graded_by     BIGINT        NULL,
    graded_at     TIMESTAMP     NULL,
    returned_at   TIMESTAMP     NULL,
    created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_submissions_assignment_student UNIQUE (assignment_id, student_id),
    CONSTRAINT fk_submissions_assignment FOREIGN KEY (assignment_id) REFERENCES assignments (id) ON DELETE CASCADE,
    CONSTRAINT fk_submissions_student FOREIGN KEY (student_id) REFERENCES users (id),
    CONSTRAINT fk_submissions_grader FOREIGN KEY (graded_by) REFERENCES users (id),
    CONSTRAINT ck_submissions_status CHECK (status IN ('ASSIGNED', 'SUBMITTED', 'LATE', 'MISSING', 'GRADED', 'RETURNED'))
);

CREATE TABLE submission_files (
    submission_id BIGINT NOT NULL,
    file_id       BIGINT NOT NULL,
    PRIMARY KEY (submission_id, file_id),
    CONSTRAINT fk_submission_files_submission FOREIGN KEY (submission_id) REFERENCES submissions (id) ON DELETE CASCADE,
    CONSTRAINT fk_submission_files_file FOREIGN KEY (file_id) REFERENCES stored_files (id) ON DELETE CASCADE
);

CREATE INDEX idx_announcements_classroom ON announcements (classroom_id, pinned, created_at);
CREATE INDEX idx_materials_classroom ON materials (classroom_id);
CREATE INDEX idx_assignments_classroom ON assignments (classroom_id);
CREATE INDEX idx_submissions_assignment ON submissions (assignment_id);
CREATE INDEX idx_topics_classroom ON topics (classroom_id, sort_order);
CREATE INDEX idx_stored_files_classroom ON stored_files (classroom_id);
