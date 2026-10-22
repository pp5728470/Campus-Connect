-- CampusConnect Phase 1 seed data (Indian MCA college context)
-- Run after Flyway migrations against database: campusconnect
-- Default password for all users: Password@123
-- BCrypt hash below is for Password@123

SET NAMES utf8mb4;

-- Clear in FK-safe order (optional for fresh DB)
DELETE FROM refresh_tokens;
DELETE FROM enrollments;
DELETE FROM classrooms;
DELETE FROM users;

-- Password hash for: Password@123
SET @pwd := '$2a$10$yUvfsIWSUh8kWXeibcRgCekcTEvgfDTN4hgoqbsc86nwRAgz9NCq6';

INSERT INTO users (id, full_name, email, password_hash, role, avatar_url, created_at, updated_at) VALUES
(1, 'Dr. Ananya Krishnan', 'ananya.krishnan@college.edu', @pwd, 'TEACHER', NULL, NOW(), NOW()),
(2, 'Prof. Rajesh Iyer', 'rajesh.iyer@college.edu', @pwd, 'TEACHER', NULL, NOW(), NOW()),
(3, 'Aarav Mehta', 'aarav.mehta@student.college.edu', @pwd, 'STUDENT', NULL, NOW(), NOW()),
(4, 'Diya Sharma', 'diya.sharma@student.college.edu', @pwd, 'STUDENT', NULL, NOW(), NOW()),
(5, 'Kabir Nair', 'kabir.nair@student.college.edu', @pwd, 'STUDENT', NULL, NOW(), NOW()),
(6, 'Isha Patel', 'isha.patel@student.college.edu', @pwd, 'STUDENT', NULL, NOW(), NOW()),
(7, 'Rohan Deshmukh', 'rohan.deshmukh@student.college.edu', @pwd, 'STUDENT', NULL, NOW(), NOW()),
(8, 'Sneha Reddy', 'sneha.reddy@student.college.edu', @pwd, 'STUDENT', NULL, NOW(), NOW()),
(9, 'Vikram Singh', 'vikram.singh@student.college.edu', @pwd, 'STUDENT', NULL, NOW(), NOW()),
(10, 'Meera Joshi', 'meera.joshi@student.college.edu', @pwd, 'STUDENT', NULL, NOW(), NOW());

INSERT INTO classrooms (id, name, section, subject, room, description, class_code, banner_color, owner_id, archived, created_at) VALUES
(1, 'Advanced Java – MCA Sem II', 'A', 'Advanced Java', 'Lab 204', 'Core Java, JDBC, Servlets, and Spring Boot for MCA Semester II.', 'AJV2MCA', '#1967D2', 1, FALSE, NOW()),
(2, 'Database Management Systems', 'B', 'DBMS', 'Room 112', 'Relational modelling, SQL, transactions, and MySQL administration.', 'DBMS7K2', '#137333', 1, FALSE, NOW()),
(3, 'Web Technologies Lab', 'A', 'Web Technologies', 'Lab 301', 'HTML, CSS, JavaScript, and React for building campus web apps.', 'WEBTECH', '#C5221F', 2, FALSE, NOW());

-- Teachers enrolled as TEACHER; students as STUDENT
INSERT INTO enrollments (classroom_id, user_id, role_in_class, joined_at) VALUES
(1, 1, 'TEACHER', NOW()),
(1, 3, 'STUDENT', NOW()),
(1, 4, 'STUDENT', NOW()),
(1, 5, 'STUDENT', NOW()),
(1, 6, 'STUDENT', NOW()),
(1, 7, 'STUDENT', NOW()),
(2, 1, 'TEACHER', NOW()),
(2, 3, 'STUDENT', NOW()),
(2, 4, 'STUDENT', NOW()),
(2, 8, 'STUDENT', NOW()),
(2, 9, 'STUDENT', NOW()),
(3, 2, 'TEACHER', NOW()),
(3, 5, 'STUDENT', NOW()),
(3, 6, 'STUDENT', NOW()),
(3, 7, 'STUDENT', NOW()),
(3, 8, 'STUDENT', NOW()),
(3, 10, 'STUDENT', NOW());
