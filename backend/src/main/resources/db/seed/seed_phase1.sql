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

-- Six notebooks, each with a different cover colour.
INSERT INTO classrooms (id, name, section, subject, room, description, class_code, banner_color, owner_id, archived, created_at) VALUES
(1, 'Advanced Java', 'Div A', 'Advanced Java', 'Lab 204', 'JDBC, Servlets, JSP and Spring Boot for MCA Semester II.', 'AJV2MCA', 'teal', 1, FALSE, NOW()),
(2, 'Software Engineering', 'Div A', 'Software Engineering', 'Room 118', 'Requirements, UML, testing and project documentation.', 'SEENG22', 'maroon', 1, FALSE, NOW()),
(3, 'Cloud Computing', 'Elective', 'Cloud Computing', 'Lab 301', 'AWS, virtualisation and deploying MCA project services.', 'CLOUD9X', 'forest', 2, FALSE, NOW()),
(4, 'Data Structures', 'Div A', 'Data Structures', 'Room 112', 'Trees, graphs, hashing and analysis of algorithms.', 'DSTREE1', 'indigo', 2, FALSE, NOW()),
(5, 'Web Technologies', 'Div A', 'Web Technologies', 'Lab 210', 'HTML, CSS, JavaScript and React for campus web apps.', 'WEBTECH', 'steel', 1, FALSE, NOW()),
(6, 'Discrete Mathematics', 'Div B', 'Discrete Mathematics', 'Room 105', 'Logic, sets, relations and combinatorics for MCA Sem I.', 'DISCMTH', 'ochre', 2, FALSE, NOW());

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
(3, 10, 'STUDENT', NOW()),
(4, 2, 'TEACHER', NOW()),
(4, 3, 'STUDENT', NOW()),
(4, 4, 'STUDENT', NOW()),
(4, 5, 'STUDENT', NOW()),
(4, 9, 'STUDENT', NOW()),
(5, 1, 'TEACHER', NOW()),
(5, 3, 'STUDENT', NOW()),
(5, 6, 'STUDENT', NOW()),
(5, 7, 'STUDENT', NOW()),
(5, 10, 'STUDENT', NOW()),
(6, 2, 'TEACHER', NOW()),
(6, 4, 'STUDENT', NOW()),
(6, 8, 'STUDENT', NOW()),
(6, 9, 'STUDENT', NOW()),
(6, 10, 'STUDENT', NOW());
