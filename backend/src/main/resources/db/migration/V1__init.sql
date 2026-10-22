CREATE TABLE users (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name     VARCHAR(120) NOT NULL,
    email         VARCHAR(180) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20)  NOT NULL,
    avatar_url    VARCHAR(512) NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_users_email UNIQUE (email),
    CONSTRAINT ck_users_role CHECK (role IN ('TEACHER', 'STUDENT', 'ADMIN'))
);

CREATE TABLE classrooms (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(120) NOT NULL,
    section      VARCHAR(60)  NULL,
    subject      VARCHAR(120) NULL,
    room         VARCHAR(60)  NULL,
    description  VARCHAR(1000) NULL,
    class_code   CHAR(7)      NOT NULL,
    banner_color VARCHAR(7)   NOT NULL DEFAULT '#1A73E8',
    owner_id     BIGINT       NOT NULL,
    archived     BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_classrooms_class_code UNIQUE (class_code),
    CONSTRAINT fk_classrooms_owner FOREIGN KEY (owner_id) REFERENCES users (id)
);

CREATE TABLE enrollments (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    classroom_id   BIGINT      NOT NULL,
    user_id        BIGINT      NOT NULL,
    role_in_class  VARCHAR(20) NOT NULL,
    joined_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_enrollments_classroom_user UNIQUE (classroom_id, user_id),
    CONSTRAINT fk_enrollments_classroom FOREIGN KEY (classroom_id) REFERENCES classrooms (id) ON DELETE CASCADE,
    CONSTRAINT fk_enrollments_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT ck_enrollments_role CHECK (role_in_class IN ('TEACHER', 'STUDENT'))
);

CREATE TABLE refresh_tokens (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id    BIGINT       NOT NULL,
    token      VARCHAR(512) NOT NULL,
    expires_at TIMESTAMP    NOT NULL,
    revoked    BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_refresh_tokens_token UNIQUE (token),
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_classrooms_owner ON classrooms (owner_id);
CREATE INDEX idx_enrollments_user ON enrollments (user_id);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens (user_id);
