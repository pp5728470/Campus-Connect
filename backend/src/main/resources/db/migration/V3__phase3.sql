ALTER TABLE users
    ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE AFTER avatar_url,
    ADD COLUMN failed_login_attempts INT NOT NULL DEFAULT 0 AFTER active,
    ADD COLUMN locked_until TIMESTAMP NULL AFTER failed_login_attempts;

CREATE TABLE notifications (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id      BIGINT        NOT NULL,
    type         VARCHAR(40)   NOT NULL,
    title        VARCHAR(200)  NOT NULL,
    body         VARCHAR(1000) NULL,
    link         VARCHAR(512)  NULL,
    classroom_id BIGINT        NULL,
    read_flag    BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_notifications_classroom FOREIGN KEY (classroom_id) REFERENCES classrooms (id) ON DELETE SET NULL,
    CONSTRAINT ck_notifications_type CHECK (type IN (
        'ANNOUNCEMENT', 'ASSIGNMENT', 'MATERIAL', 'GRADED', 'DUE_TOMORROW'
    ))
);

CREATE INDEX idx_notifications_user_read ON notifications (user_id, read_flag, created_at);

CREATE TABLE password_reset_tokens (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id    BIGINT       NOT NULL,
    token      VARCHAR(128) NOT NULL,
    expires_at TIMESTAMP    NOT NULL,
    used       BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_password_reset_token UNIQUE (token),
    CONSTRAINT fk_password_reset_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_password_reset_user ON password_reset_tokens (user_id);
