-- CampusConnect Phase 2 seed (run after Phase 1 seed and Flyway V2)
-- Assumes classrooms 1–3 and users 1–10 from seed_phase1.sql exist.
-- Announcements / assignments / submissions are text-based (no binary uploads).

SET NAMES utf8mb4;

DELETE FROM submission_files;
DELETE FROM submissions;
DELETE FROM assignment_attachments;
DELETE FROM assignments;
DELETE FROM material_files;
DELETE FROM materials;
DELETE FROM announcement_comments;
DELETE FROM announcement_attachments;
DELETE FROM announcements;
DELETE FROM topics;
DELETE FROM stored_files;

-- Topics for Advanced Java (class 1) and DBMS (class 2)
INSERT INTO topics (id, classroom_id, name, sort_order, created_at) VALUES
(1, 1, 'Unit 1: JDBC', 1, NOW()),
(2, 1, 'Unit 2: Servlets & JSP', 2, NOW()),
(3, 1, 'Unit 3: Spring Boot', 3, NOW()),
(4, 2, 'Unit 1: ER Modelling', 1, NOW()),
(5, 2, 'Unit 2: SQL & Transactions', 2, NOW()),
(6, 3, 'Lab 1: HTML & CSS', 1, NOW());

-- Stream announcements
INSERT INTO announcements (id, classroom_id, author_id, body, pinned, created_at, updated_at) VALUES
(1, 1, 1,
 'Welcome to Advanced Java – MCA Sem II. Please join the lab WhatsApp group and keep your JDK 21 setup ready before Friday.',
 TRUE, DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY)),
(2, 1, 1,
 'Lab 204 is booked for the JDBC practical on Monday 10:00–12:00. Bring your MySQL Workbench dump from last week.',
 FALSE, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
(3, 1, 1,
 'Reminder: mid-semester quiz will cover JDBC ResultSet and PreparedStatement. Notes are under Materials → Unit 1.',
 FALSE, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(4, 2, 1,
 'DBMS Section B: ER diagram draft for the library case study is due this week. Submit as PDF on Classwork.',
 TRUE, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
(5, 3, 2,
 'Web Technologies Lab starts with a responsive landing page. Refer to the CSS grid notes under Materials.',
 FALSE, DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY));

INSERT INTO announcement_comments (announcement_id, author_id, body, created_at) VALUES
(1, 3, 'Ma''am, is OpenJDK fine or do we need Oracle JDK?', DATE_SUB(NOW(), INTERVAL 4 DAY)),
(1, 1, 'OpenJDK 21 (Microsoft or Temurin build) is fine for all lab work.', DATE_SUB(NOW(), INTERVAL 4 DAY)),
(1, 4, 'Thank you. I have already set JAVA_HOME.', DATE_SUB(NOW(), INTERVAL 4 DAY)),
(2, 5, 'Can we use the same dump we created in DBMS lab?', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(2, 1, 'Yes, as long as it has at least two related tables.', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(4, 8, 'Should the ER diagram include weak entities?', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(4, 1, 'Include them if your scenario needs them; justify in a short note.', DATE_SUB(NOW(), INTERVAL 2 DAY));

-- Materials for Advanced Java (+ a couple of other classes without binary seed files)
INSERT INTO materials (id, classroom_id, topic_id, title, description, created_by, created_at, updated_at) VALUES
(1, 1, 1, 'JDBC Quick Reference', 'Connection, Statement vs PreparedStatement, and ResultSet navigation.', 1, DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY)),
(2, 1, 1, 'Sample bank schema SQL', 'CREATE TABLE scripts used in the JDBC lab.', 1, DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY)),
(3, 1, 2, 'Servlet Lifecycle Handout', 'init, service, destroy, and the request flow used in the lab.', 1, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
(4, 2, 4, 'ER modelling checklist', 'Entities, relationships, cardinality, and normalisation reminders.', 1, DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY)),
(5, 3, 6, 'CSS Grid cheatsheet', 'Common layout patterns for the lab landing page.', 2, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY));

-- Seed file records (physical bytes are copied by SeedFileBootstrap on the "dev" profile)
-- stored_name values must match SeedFileBootstrap / classpath:seed-files/*
INSERT INTO stored_files (id, classroom_id, uploaded_by, stored_name, original_name, content_type, size_bytes, created_at) VALUES
(1, 1, 1, 'seed-jdbc-quick-reference.pdf', 'jdbc-quick-reference.pdf', 'application/pdf', 927, DATE_SUB(NOW(), INTERVAL 6 DAY)),
(2, 1, 1, 'seed-servlet-lifecycle.pdf', 'servlet-lifecycle.pdf', 'application/pdf', 911, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(3, 1, 1, 'seed-bank-schema-notes.pdf', 'bank-schema-notes.pdf', 'application/pdf', 874, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(4, 1, 1, 'seed-jdbc-architecture.png', 'jdbc-architecture.png', 'image/png', 347, DATE_SUB(NOW(), INTERVAL 6 DAY));

INSERT INTO material_files (material_id, file_id) VALUES
(1, 1),
(1, 4),
(2, 3),
(3, 2);

-- Assignments
INSERT INTO assignments (id, classroom_id, topic_id, title, instructions, max_points, due_at, allow_late, created_by, created_at, updated_at) VALUES
(1, 1, 1, 'JDBC CRUD Lab',
 'Build a console or mini-web app that performs insert, update, delete, and select on the bank schema. Submit a short report (text) describing your steps and any SQL you used.',
 20, DATE_ADD(NOW(), INTERVAL 3 DAY), TRUE, 1, DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY)),
(2, 1, 2, 'Servlet Login Form',
 'Implement a login servlet that validates credentials against MySQL and forwards to a JSP home page. Late work accepted with a 2-point deduction.',
 25, DATE_ADD(NOW(), INTERVAL 10 DAY), TRUE, 1, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(3, 1, 3, 'Spring Boot REST warmup',
 'Create a Spring Boot project with one entity, repository, and GET/POST endpoints. Paste your controller code in the submission text box.',
 30, DATE_SUB(NOW(), INTERVAL 1 DAY), FALSE, 1, DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(NOW(), INTERVAL 8 DAY)),
(4, 2, 4, 'Library ER Diagram',
 'Draw an ER diagram for a college library (books, copies, members, loans). Describe entities and relationships in the text answer.',
 15, DATE_ADD(NOW(), INTERVAL 2 DAY), TRUE, 1, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
(5, 2, 5, 'SQL Practice Set',
 'Write SQL for the five queries listed in class. Paste answers in the text box.',
 20, DATE_SUB(NOW(), INTERVAL 2 DAY), TRUE, 1, DATE_SUB(NOW(), INTERVAL 9 DAY), DATE_SUB(NOW(), INTERVAL 9 DAY)),
(6, 3, 6, 'Responsive landing page',
 'Build a single-page landing layout with header, hero text, and a three-column feature section using CSS Grid. Describe your structure in the submission.',
 25, DATE_ADD(NOW(), INTERVAL 5 DAY), TRUE, 2, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY));

-- Submissions (mixed statuses)
INSERT INTO submissions (assignment_id, student_id, text_answer, status, submitted_at, grade, feedback, graded_by, graded_at, returned_at, created_at, updated_at) VALUES
(1, 3, 'I completed insert/update/delete using PreparedStatement. Select lists all accounts ordered by balance.',
 'SUBMITTED', DATE_SUB(NOW(), INTERVAL 1 DAY), NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
(1, 4, 'CRUD done. Used try-with-resources for Connection and ResultSet.',
 'SUBMITTED', DATE_SUB(NOW(), INTERVAL 12 HOUR), NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
(3, 3, '@RestController with /api/books GET and POST. Entity Book with id, title, author.',
 'RETURNED', DATE_SUB(NOW(), INTERVAL 2 DAY), 28.00, 'Clean layering. Add validation on title next time.', 1, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), NOW(), NOW()),
(3, 5, NULL, 'MISSING', NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
(5, 3, '1) SELECT ... 2) JOIN members ... 3) GROUP BY ... (full answers in notebook scan — typed summary here).',
 'GRADED', DATE_SUB(NOW(), INTERVAL 3 DAY), 18.00, 'Good joins; watch NULL handling in aggregates.', 1, DATE_SUB(NOW(), INTERVAL 2 DAY), NULL, NOW(), NOW()),
(5, 4, 'Submitted after the deadline — completed all five queries.',
 'LATE', DATE_SUB(NOW(), INTERVAL 1 DAY), NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
(4, 8, 'Entities: Book, Copy, Member, Loan. Relationships documented in the text.',
 'SUBMITTED', DATE_SUB(NOW(), INTERVAL 6 HOUR), NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
(6, 5, 'Used CSS Grid with header / main / footer areas and three equal feature columns.',
 'SUBMITTED', DATE_SUB(NOW(), INTERVAL 8 HOUR), NULL, NULL, NULL, NULL, NULL, NOW(), NOW());
