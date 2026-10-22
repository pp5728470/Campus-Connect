-- CampusConnect Phase 3 seed (run after Phase 1 + Phase 2 seeds and Flyway V3)
-- Adds an administrator account and sample notifications for student id 3 (Aarav Mehta).
-- Admin login: admin@campusconnect.edu / Password@123

SET NAMES utf8mb4;

-- Re-runnable: remove what this script inserts before inserting it again
DELETE FROM notifications WHERE user_id = 3;
DELETE FROM users WHERE email = 'admin@campusconnect.edu';

-- Password hash for: Password@123 (same as seed_phase1.sql)
SET @pwd := '$2a$10$yUvfsIWSUh8kWXeibcRgCekcTEvgfDTN4hgoqbsc86nwRAgz9NCq6';

INSERT INTO users (id, full_name, email, password_hash, role, avatar_url, active, failed_login_attempts, locked_until, created_at, updated_at) VALUES
(11, 'Campus Administrator', 'admin@campusconnect.edu', @pwd, 'ADMIN', NULL, TRUE, 0, NULL, NOW(), NOW());

INSERT INTO notifications (user_id, type, title, body, link, classroom_id, read_flag, created_at) VALUES
(3, 'DUE_TOMORROW', 'Due soon: JDBC CRUD Lab', 'Advanced Java - MCA Sem II - 20 points. Submit before the deadline.', '/classes/1/assignments/1', 1, FALSE, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(3, 'ANNOUNCEMENT', 'New announcement in Advanced Java - MCA Sem II', 'Lab 204 will be open until 6 PM on Friday for the JDBC practical.', '/classes/1/stream', 1, FALSE, DATE_SUB(NOW(), INTERVAL 5 HOUR)),
(3, 'GRADED', 'Graded: Spring Boot REST warmup', 'You scored 26 / 30', '/classes/1/assignments/3', 1, FALSE, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(3, 'MATERIAL', 'New material: Servlet Lifecycle Handout', 'Advanced Java - MCA Sem II', '/classes/1/materials', 1, TRUE, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(3, 'ASSIGNMENT', 'New assignment: Servlet Login Form', 'Advanced Java - MCA Sem II - 25 points', '/classes/1/assignments/2', 1, TRUE, DATE_SUB(NOW(), INTERVAL 3 DAY));
