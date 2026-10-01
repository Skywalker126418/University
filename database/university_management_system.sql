-- =============================================================================
-- UNIVERSITY MANAGEMENT SYSTEM (UMS)
-- Complete Production Database Schema & Seed Data
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `university_management_system`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE `university_management_system`;

SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- 1. users
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
    `id`            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    `first_name`    VARCHAR(80)     NOT NULL,
    `last_name`     VARCHAR(80)     NOT NULL,
    `email`         VARCHAR(255)    NOT NULL,
    `password`      VARCHAR(255)    NOT NULL,
    `password_hash` VARCHAR(255)    DEFAULT NULL,
    `role`          ENUM('student','lecturer','admin','registrar') NOT NULL,
    `phone`         VARCHAR(30)     DEFAULT NULL,
    `avatar`        VARCHAR(500)    DEFAULT NULL,
    `is_active`     TINYINT(1)      NOT NULL DEFAULT 1,
    `created_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_users_email` (`email`),
    KEY `idx_users_role` (`role`),
    KEY `idx_users_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. departments
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `departments`;
CREATE TABLE `departments` (
    `id`                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `department_name`    VARCHAR(150) NOT NULL,
    `department_code`    VARCHAR(20)  NOT NULL,
    `name`               VARCHAR(150) DEFAULT NULL,
    `code`               VARCHAR(20)  DEFAULT NULL,
    `description`        TEXT,
    `head_of_department` INT UNSIGNED DEFAULT NULL,
    `head_lecturer_id`   INT UNSIGNED DEFAULT NULL,
    `is_active`          TINYINT(1)   NOT NULL DEFAULT 1,
    `created_at`         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_departments_code` (`department_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. programmes
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `programmes`;
CREATE TABLE `programmes` (
    `id`             INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `programme_name` VARCHAR(200) NOT NULL,
    `programme_code` VARCHAR(20)  NOT NULL,
    `name`           VARCHAR(200) DEFAULT NULL,
    `code`           VARCHAR(20)  DEFAULT NULL,
    `department_id`  INT UNSIGNED NOT NULL,
    `duration_years` TINYINT      NOT NULL DEFAULT 4,
    `total_credits`  SMALLINT     NOT NULL DEFAULT 120,
    `description`    TEXT,
    `is_active`      TINYINT(1)   NOT NULL DEFAULT 1,
    `created_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_programmes_code` (`programme_code`),
    KEY `idx_programmes_department` (`department_id`),
    CONSTRAINT `fk_programmes_dept` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. academic_years & semesters
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `academic_years`;
CREATE TABLE `academic_years` (
    `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `year_label` VARCHAR(20)  NOT NULL,
    `start_date` DATE         NOT NULL,
    `end_date`   DATE         NOT NULL,
    `is_current` TINYINT(1)   NOT NULL DEFAULT 0,
    `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_academic_years_label` (`year_label`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `semesters`;
CREATE TABLE `semesters` (
    `id`                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `academic_year_id`   INT UNSIGNED NOT NULL,
    `name`               ENUM('Semester 1','Semester 2','Semester 3') NOT NULL,
    `start_date`         DATE         NOT NULL,
    `end_date`           DATE         NOT NULL,
    `registration_start` DATE         DEFAULT NULL,
    `registration_end`   DATE         DEFAULT NULL,
    `is_current`         TINYINT(1)   NOT NULL DEFAULT 0,
    `created_at`         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. students
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `students`;
CREATE TABLE `students` (
    `id`               INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id`          INT UNSIGNED NOT NULL,
    `student_number`   VARCHAR(30)  NOT NULL,
    `student_id`       VARCHAR(30)  DEFAULT NULL,
    `programme_id`     INT UNSIGNED NOT NULL,
    `department_id`    INT UNSIGNED DEFAULT NULL,
    `year_of_study`    TINYINT      NOT NULL DEFAULT 1,
    `current_semester` TINYINT      NOT NULL DEFAULT 1,
    `enrollment_date`  DATE         NOT NULL,
    `status`           ENUM('active','inactive','graduated','suspended') NOT NULL DEFAULT 'active',
    `gender`           ENUM('male','female','other') DEFAULT 'other',
    `date_of_birth`    DATE         DEFAULT NULL,
    `phone`            VARCHAR(30)  DEFAULT NULL,
    `address`          TEXT         DEFAULT NULL,
    `profile_photo`    VARCHAR(500) DEFAULT NULL,
    `created_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_students_user` (`user_id`),
    UNIQUE KEY `uq_students_number` (`student_number`),
    KEY `idx_students_programme` (`programme_id`),
    CONSTRAINT `fk_students_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. lecturers
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `lecturers`;
CREATE TABLE `lecturers` (
    `id`              INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id`         INT UNSIGNED NOT NULL,
    `staff_id`        VARCHAR(30)  NOT NULL,
    `lecturer_id`     VARCHAR(30)  DEFAULT NULL,
    `employee_id`     VARCHAR(30)  DEFAULT NULL,
    `department_id`   INT UNSIGNED NOT NULL,
    `designation`     VARCHAR(100) DEFAULT 'Lecturer',
    `specialization`  VARCHAR(200) DEFAULT NULL,
    `qualification`    VARCHAR(200) DEFAULT NULL,
    `office_location` VARCHAR(150) DEFAULT NULL,
    `gender`          ENUM('male','female','other') DEFAULT 'other',
    `status`          ENUM('active','inactive') NOT NULL DEFAULT 'active',
    `is_active`       TINYINT(1)   NOT NULL DEFAULT 1,
    `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_lecturers_user` (`user_id`),
    UNIQUE KEY `uq_lecturers_staff` (`staff_id`),
    KEY `idx_lecturers_dept` (`department_id`),
    CONSTRAINT `fk_lecturers_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 7. administrators & registrars
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `administrators`;
CREATE TABLE `administrators` (
    `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id`    INT UNSIGNED NOT NULL,
    `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_admins_user` (`user_id`),
    CONSTRAINT `fk_admins_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `registrars`;
CREATE TABLE `registrars` (
    `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id`    INT UNSIGNED NOT NULL,
    `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_registrars_user` (`user_id`),
    CONSTRAINT `fk_registrars_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 8. courses
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `courses`;
CREATE TABLE `courses` (
    `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `course_code`   VARCHAR(20)  NOT NULL,
    `course_name`   VARCHAR(200) NOT NULL,
    `name`          VARCHAR(200) DEFAULT NULL,
    `credits`       TINYINT      NOT NULL DEFAULT 3,
    `department_id` INT UNSIGNED NOT NULL,
    `programme_id`  INT UNSIGNED DEFAULT NULL,
    `semester_id`   INT UNSIGNED DEFAULT NULL,
    `semester`      INT          NOT NULL DEFAULT 1,
    `level`         INT          NOT NULL DEFAULT 100,
    `year_level`    TINYINT      NOT NULL DEFAULT 1,
    `max_students`  SMALLINT     NOT NULL DEFAULT 50,
    `description`   TEXT,
    `prerequisites` VARCHAR(255) DEFAULT NULL,
    `status`        ENUM('active','inactive') NOT NULL DEFAULT 'active',
    `is_active`     TINYINT(1)   NOT NULL DEFAULT 1,
    `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_courses_code` (`course_code`),
    KEY `idx_courses_dept` (`department_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 9. course_assignments
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `course_assignments`;
CREATE TABLE `course_assignments` (
    `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `course_id`     INT UNSIGNED NOT NULL,
    `lecturer_id`   INT UNSIGNED NOT NULL,
    `semester_id`   INT UNSIGNED DEFAULT NULL,
    `academic_year` VARCHAR(20)  NOT NULL DEFAULT '2025/2026',
    `semester`      INT          NOT NULL DEFAULT 1,
    `section`       VARCHAR(10)  NOT NULL DEFAULT 'A',
    `is_active`     TINYINT(1)   NOT NULL DEFAULT 1,
    `assigned_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_ca_course` (`course_id`),
    KEY `idx_ca_lecturer` (`lecturer_id`),
    CONSTRAINT `fk_ca_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ca_lecturer` FOREIGN KEY (`lecturer_id`) REFERENCES `lecturers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 10. course_registrations
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `course_registrations`;
CREATE TABLE `course_registrations` (
    `id`               INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `student_id`       INT UNSIGNED NOT NULL,
    `course_id`        INT UNSIGNED NOT NULL,
    `academic_year`    VARCHAR(20)  NOT NULL DEFAULT '2025/2026',
    `semester`         INT          NOT NULL DEFAULT 1,
    `status`           ENUM('pending','approved','rejected','dropped') NOT NULL DEFAULT 'pending',
    `registered_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `reviewed_by`      INT UNSIGNED DEFAULT NULL,
    `reviewed_at`      DATETIME     DEFAULT NULL,
    `rejection_reason` TEXT         DEFAULT NULL,
    `created_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_stud_course_sem` (`student_id`, `course_id`, `academic_year`, `semester`),
    KEY `idx_cr_student` (`student_id`),
    KEY `idx_cr_course` (`course_id`),
    KEY `idx_cr_status` (`status`),
    CONSTRAINT `fk_cr_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_cr_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 10b. registration_periods
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `registration_periods`;
CREATE TABLE `registration_periods` (
    `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `academic_year` VARCHAR(20)  NOT NULL DEFAULT '2025/2026',
    `semester`      INT          NOT NULL DEFAULT 1,
    `start_date`    DATETIME     NOT NULL DEFAULT '2025-08-01 00:00:00',
    `end_date`      DATETIME     NOT NULL DEFAULT '2026-08-01 23:59:59',
    `is_open`       TINYINT(1)   NOT NULL DEFAULT 1,
    `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_reg_period` (`academic_year`, `semester`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 11. results
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `results`;
CREATE TABLE `results` (
    `id`                    INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `student_id`            INT UNSIGNED NOT NULL,
    `course_id`             INT UNSIGNED NOT NULL,
    `academic_year`         VARCHAR(20)  NOT NULL DEFAULT '2025/2026',
    `semester`              INT          NOT NULL DEFAULT 1,
    `continuous_assessment` DECIMAL(5,2) DEFAULT NULL,
    `exam_score`            DECIMAL(5,2) DEFAULT NULL,
    `total_score`           DECIMAL(5,2) DEFAULT NULL,
    `mark`                  DECIMAL(5,2) DEFAULT NULL,
    `grade`                 VARCHAR(5)   DEFAULT NULL,
    `grade_point`           DECIMAL(3,2) DEFAULT NULL,
    `is_published`          TINYINT(1)   NOT NULL DEFAULT 1,
    `published_at`          DATETIME     DEFAULT CURRENT_TIMESTAMP,
    `entered_by`            INT UNSIGNED DEFAULT NULL,
    `created_at`            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_results_student` (`student_id`),
    KEY `idx_results_course` (`course_id`),
    CONSTRAINT `fk_results_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_results_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 12. timetable
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `timetable`;
CREATE TABLE `timetable` (
    `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `assignment_id` INT UNSIGNED NOT NULL,
    `course_id`     INT UNSIGNED DEFAULT NULL,
    `day_of_week`   ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') NOT NULL,
    `start_time`    TIME         NOT NULL,
    `end_time`      TIME         NOT NULL,
    `room`          VARCHAR(80)  NOT NULL,
    `academic_year` VARCHAR(20)  NOT NULL DEFAULT '2025/2026',
    `semester`      INT          NOT NULL DEFAULT 1,
    `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_tt_assignment` (`assignment_id`),
    CONSTRAINT `fk_tt_assignment` FOREIGN KEY (`assignment_id`) REFERENCES `course_assignments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 13. notifications
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
    `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id`    INT UNSIGNED NOT NULL,
    `title`      VARCHAR(200) NOT NULL,
    `message`    TEXT         NOT NULL,
    `type`       ENUM('info','success','warning','error','general') NOT NULL DEFAULT 'info',
    `is_read`    TINYINT(1)   NOT NULL DEFAULT 0,
    `read_at`    DATETIME     DEFAULT NULL,
    `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_notif_user` (`user_id`),
    KEY `idx_notif_read` (`is_read`),
    CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 14. password_reset_tokens
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `password_reset_tokens`;
CREATE TABLE `password_reset_tokens` (
    `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id`    INT UNSIGNED NOT NULL,
    `token`      VARCHAR(255) NOT NULL,
    `expires_at` DATETIME     NOT NULL,
    `used`       TINYINT(1)   NOT NULL DEFAULT 0,
    `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_prt_token` (`token`),
    CONSTRAINT `fk_prt_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- SEED DATA
-- Default password for all seed accounts: password123
-- Bcrypt Hash: $2a$10$9AYgHUIOLG2vAjE6JZBFle6U8NPDuW6rey18758igjMwDLLi7PEci
-- =============================================================================

-- Users (1 Admin, 1 Registrar, 3 Lecturers, 5 Students)
INSERT INTO `users` (`id`, `first_name`, `last_name`, `email`, `password`, `password_hash`, `role`, `phone`, `is_active`) VALUES
(1, 'Super', 'Admin', 'admin@university.edu', '$2a$10$9AYgHUIOLG2vAjE6JZBFle6U8NPDuW6rey18758igjMwDLLi7PEci', '$2a$10$9AYgHUIOLG2vAjE6JZBFle6U8NPDuW6rey18758igjMwDLLi7PEci', 'admin', '+1-800-000-0001', 1),
(2, 'Regina', 'Patel', 'registrar@university.edu', '$2a$10$9AYgHUIOLG2vAjE6JZBFle6U8NPDuW6rey18758igjMwDLLi7PEci', '$2a$10$9AYgHUIOLG2vAjE6JZBFle6U8NPDuW6rey18758igjMwDLLi7PEci', 'registrar', '+1-800-000-0002', 1),
(3, 'John', 'Doe', 'john.doe@university.edu', '$2a$10$9AYgHUIOLG2vAjE6JZBFle6U8NPDuW6rey18758igjMwDLLi7PEci', '$2a$10$9AYgHUIOLG2vAjE6JZBFle6U8NPDuW6rey18758igjMwDLLi7PEci', 'lecturer', '+1-555-100-0001', 1),
(4, 'Mary', 'Smith', 'mary.smith@university.edu', '$2a$10$9AYgHUIOLG2vAjE6JZBFle6U8NPDuW6rey18758igjMwDLLi7PEci', '$2a$10$9AYgHUIOLG2vAjE6JZBFle6U8NPDuW6rey18758igjMwDLLi7PEci', 'lecturer', '+1-555-100-0002', 1),
(5, 'Peter', 'Jones', 'peter.jones@university.edu', '$2a$10$9AYgHUIOLG2vAjE6JZBFle6U8NPDuW6rey18758igjMwDLLi7PEci', '$2a$10$9AYgHUIOLG2vAjE6JZBFle6U8NPDuW6rey18758igjMwDLLi7PEci', 'lecturer', '+1-555-100-0003', 1),
(6, 'Alice', 'Johnson', 'alice@student.edu', '$2a$10$9AYgHUIOLG2vAjE6JZBFle6U8NPDuW6rey18758igjMwDLLi7PEci', '$2a$10$9AYgHUIOLG2vAjE6JZBFle6U8NPDuW6rey18758igjMwDLLi7PEci', 'student', '+1-555-200-0001', 1),
(7, 'Bob', 'Williams', 'bob@student.edu', '$2a$10$9AYgHUIOLG2vAjE6JZBFle6U8NPDuW6rey18758igjMwDLLi7PEci', '$2a$10$9AYgHUIOLG2vAjE6JZBFle6U8NPDuW6rey18758igjMwDLLi7PEci', 'student', '+1-555-200-0002', 1),
(8, 'Carol', 'Martinez', 'carol@student.edu', '$2a$10$9AYgHUIOLG2vAjE6JZBFle6U8NPDuW6rey18758igjMwDLLi7PEci', '$2a$10$9AYgHUIOLG2vAjE6JZBFle6U8NPDuW6rey18758igjMwDLLi7PEci', 'student', '+1-555-200-0003', 1),
(9, 'David', 'Brown', 'david@student.edu', '$2a$10$9AYgHUIOLG2vAjE6JZBFle6U8NPDuW6rey18758igjMwDLLi7PEci', '$2a$10$9AYgHUIOLG2vAjE6JZBFle6U8NPDuW6rey18758igjMwDLLi7PEci', 'student', '+1-555-200-0004', 1),
(10, 'Eve', 'Davis', 'eve@student.edu', '$2a$10$9AYgHUIOLG2vAjE6JZBFle6U8NPDuW6rey18758igjMwDLLi7PEci', '$2a$10$9AYgHUIOLG2vAjE6JZBFle6U8NPDuW6rey18758igjMwDLLi7PEci', 'student', '+1-555-200-0005', 1);

-- Administrators & Registrars
INSERT INTO `administrators` (`id`, `user_id`) VALUES (1, 1);
INSERT INTO `registrars` (`id`, `user_id`) VALUES (1, 2);

-- Departments
INSERT INTO `departments` (`id`, `department_name`, `department_code`, `name`, `code`, `description`, `head_of_department`, `head_lecturer_id`) VALUES
(1, 'Computer Science', 'CS', 'Computer Science', 'CS', 'Covers computing, software engineering, and artificial intelligence.', 3, 3),
(2, 'Business Administration', 'BUS', 'Business Administration', 'BUS', 'Covers management, finance, marketing, and entrepreneurship.', 4, 4),
(3, 'Electrical Engineering', 'EE', 'Electrical Engineering', 'EE', 'Covers power systems, electronics, telecommunications, and robotics.', 5, 5);

-- Programmes
INSERT INTO `programmes` (`id`, `programme_name`, `programme_code`, `name`, `code`, `department_id`, `duration_years`, `total_credits`, `description`) VALUES
(1, 'Bachelor of Science in Computer Science', 'BSC-CS', 'Bachelor of Science in Computer Science', 'BSC-CS', 1, 4, 120, 'Software engineering, algorithms, databases, and intelligent systems.'),
(2, 'Bachelor of Business Administration', 'BBA', 'Bachelor of Business Administration', 'BBA', 2, 4, 120, 'Corporate finance, managerial economics, marketing, and leadership.'),
(3, 'Bachelor of Science in Electrical Engineering', 'BSC-EE', 'Bachelor of Science in Electrical Engineering', 'BSC-EE', 3, 4, 128, 'Circuits, digital signal processing, embedded systems, and communications.'),
(4, 'Diploma in Information Technology', 'DIT', 'Diploma in Information Technology', 'DIT', 1, 2, 60, 'Practical software, web administration, networks, and cloud computing.');

-- Academic Years & Semesters
INSERT INTO `academic_years` (`id`, `year_label`, `start_date`, `end_date`, `is_current`) VALUES
(1, '2024/2025', '2024-09-01', '2025-06-30', 0),
(2, '2025/2026', '2025-09-01', '2026-06-30', 1);

INSERT INTO `semesters` (`id`, `academic_year_id`, `name`, `start_date`, `end_date`, `registration_start`, `registration_end`, `is_current`) VALUES
(1, 2, 'Semester 1', '2025-09-01', '2026-01-31', '2025-08-15', '2025-09-30', 1),
(2, 2, 'Semester 2', '2026-02-01', '2026-06-30', '2026-01-15', '2026-02-28', 0);

-- Lecturers
INSERT INTO `lecturers` (`id`, `user_id`, `staff_id`, `lecturer_id`, `employee_id`, `department_id`, `designation`, `specialization`, `qualification`, `office_location`, `gender`, `status`, `is_active`) VALUES
(1, 3, 'LEC-2025-0001', 'LC001', 'LEC-2025-0001', 1, 'Senior Lecturer', 'Software Engineering & Databases', 'Ph.D. Computer Science', 'Block A, Room 101', 'male', 'active', 1),
(2, 4, 'LEC-2025-0002', 'LC002', 'LEC-2025-0002', 2, 'Associate Professor', 'Finance & Accounting', 'Ph.D. Economics', 'Block B, Room 205', 'female', 'active', 1),
(3, 5, 'LEC-2025-0003', 'LC003', 'LEC-2025-0003', 3, 'Senior Lecturer', 'Digital Circuits & Power', 'Ph.D. Electrical Engineering', 'Block C, Room 310', 'male', 'active', 1);

-- Students
INSERT INTO `students` (`id`, `user_id`, `student_number`, `student_id`, `programme_id`, `department_id`, `year_of_study`, `current_semester`, `enrollment_date`, `status`, `gender`, `phone`, `address`) VALUES
(1, 6,  'ST2026001', 'ST2026001', 1, 1, 2, 1, '2024-09-01', 'active', 'female', '+1-555-200-0001', '12 Maple St, Springfield'),
(2, 7,  'ST2026002', 'ST2026002', 1, 1, 2, 1, '2024-09-01', 'active', 'male',   '+1-555-200-0002', '45 Oak Ave, Springfield'),
(3, 8,  'ST2026003', 'ST2026003', 2, 2, 1, 1, '2025-01-15', 'active', 'female', '+1-555-200-0003', '78 Pine Rd, Shelbyville'),
(4, 9,  'ST2026004', 'ST2026004', 3, 3, 1, 1, '2025-01-15', 'active', 'male',   '+1-555-200-0004', '9 Elm Blvd, Capital City'),
(5, 10, 'ST2026005', 'ST2026005', 4, 1, 1, 1, '2025-09-01', 'active', 'female', '+1-555-200-0005', '3 Cedar Ln, Springfield');

-- Courses
INSERT INTO `courses` (`id`, `course_code`, `course_name`, `name`, `credits`, `department_id`, `programme_id`, `semester_id`, `semester`, `level`, `year_level`, `max_students`, `description`, `status`, `is_active`) VALUES
(1, 'CS201', 'Database Systems', 'Database Systems', 3, 1, 1, 1, 1, 200, 2, 60, 'Relational models, SQL, normalization, index structures, transactions and concurrency.', 'active', 1),
(2, 'CS202', 'Web Development', 'Web Development', 3, 1, 1, 1, 1, 200, 2, 60, 'Modern front-end frameworks, RESTful APIs, responsive design, and web security.', 'active', 1),
(3, 'CS203', 'Data Structures & Algorithms', 'Data Structures & Algorithms', 4, 1, 1, 1, 1, 200, 2, 60, 'Trees, graphs, dynamic programming, complexity analysis, and greedy algorithms.', 'active', 1),
(4, 'CS204', 'Operating Systems', 'Operating Systems', 3, 1, 1, 1, 1, 200, 2, 50, 'Processes, memory management, virtual memory, file systems, and scheduling.', 'active', 1),
(5, 'BUS101', 'Principles of Management', 'Principles of Management', 3, 2, 2, 1, 1, 100, 1, 80, 'Organizational behavior, planning, decision-making, and organizational leadership.', 'active', 1),
(6, 'BUS102', 'Financial Accounting', 'Financial Accounting', 3, 2, 2, 1, 1, 100, 1, 75, 'Balance sheets, income statements, cash flow statements, and financial reporting.', 'active', 1),
(7, 'EE201', 'Circuits & Signals', 'Circuits & Signals', 4, 3, 3, 1, 1, 200, 2, 45, 'Linear circuit analysis, AC power, Fourier transforms, and Laplace domains.', 'active', 1),
(8, 'IT101', 'Introduction to IT & Networks', 'Introduction to IT & Networks', 3, 1, 4, 1, 1, 100, 1, 60, 'Hardware architecture, LAN/WAN topologies, TCP/IP networking, and cybersecurity basics.', 'active', 1);

-- Course Assignments (Lecturers -> Courses)
INSERT INTO `course_assignments` (`id`, `course_id`, `lecturer_id`, `semester_id`, `academic_year`, `semester`, `section`, `is_active`) VALUES
(1, 1, 1, 1, '2025/2026', 1, 'A', 1),
(2, 2, 1, 1, '2025/2026', 1, 'A', 1),
(3, 3, 1, 1, '2025/2026', 1, 'A', 1),
(4, 4, 1, 1, '2025/2026', 1, 'A', 1),
(5, 5, 2, 1, '2025/2026', 1, 'A', 1),
(6, 6, 2, 1, '2025/2026', 1, 'A', 1),
(7, 7, 3, 1, '2025/2026', 1, 'A', 1),
(8, 8, 1, 1, '2025/2026', 1, 'A', 1);

-- Timetable (5 days a week, structured blocks)
INSERT INTO `timetable` (`id`, `assignment_id`, `course_id`, `day_of_week`, `start_time`, `end_time`, `room`, `academic_year`, `semester`) VALUES
(1, 1, 1, 'Monday',    '08:00:00', '10:00:00', 'Lab B204', '2025/2026', 1),
(2, 2, 2, 'Tuesday',   '09:00:00', '11:00:00', 'Room A102', '2025/2026', 1),
(3, 4, 4, 'Wednesday', '08:00:00', '10:00:00', 'Room A105', '2025/2026', 1),
(4, 1, 1, 'Thursday',  '10:00:00', '12:00:00', 'Lab B204', '2025/2026', 1),
(5, 2, 2, 'Friday',    '08:00:00', '10:00:00', 'Room A102', '2025/2026', 1),
(6, 3, 3, 'Monday',    '14:00:00', '16:00:00', 'Room C101', '2025/2026', 1),
(7, 3, 3, 'Thursday',  '14:00:00', '16:00:00', 'Room C101', '2025/2026', 1),
(8, 5, 5, 'Tuesday',   '13:00:00', '15:00:00', 'Hall BUS-1', '2025/2026', 1),
(9, 6, 6, 'Wednesday', '13:00:00', '15:00:00', 'Hall BUS-2', '2025/2026', 1),
(10, 7, 7, 'Thursday', '09:00:00', '11:00:00', 'Eng Lab 3', '2025/2026', 1),
(11, 8, 8, 'Friday',   '11:00:00', '13:00:00', 'Lab IT-1',  '2025/2026', 1);

-- Course Registrations (Alice: Approved; Bob: Approved; Carol: Pending; David: Pending; Eve: Approved)
INSERT INTO `course_registrations` (`id`, `student_id`, `course_id`, `academic_year`, `semester`, `status`, `registered_at`, `reviewed_by`, `reviewed_at`) VALUES
-- Alice Johnson (ST2026001) - 4 courses approved
(1, 1, 1, '2025/2026', 1, 'approved', '2025-08-20 09:15:00', 2, '2025-08-22 10:00:00'),
(2, 1, 2, '2025/2026', 1, 'approved', '2025-08-20 09:15:00', 2, '2025-08-22 10:00:00'),
(3, 1, 3, '2025/2026', 1, 'approved', '2025-08-20 09:15:00', 2, '2025-08-22 10:00:00'),
(4, 1, 4, '2025/2026', 1, 'approved', '2025-08-20 09:15:00', 2, '2025-08-22 10:00:00'),
-- Bob Williams (ST2026002) - 3 courses approved
(5, 2, 1, '2025/2026', 1, 'approved', '2025-08-21 11:30:00', 2, '2025-08-22 10:30:00'),
(6, 2, 2, '2025/2026', 1, 'approved', '2025-08-21 11:30:00', 2, '2025-08-22 10:30:00'),
(7, 2, 4, '2025/2026', 1, 'approved', '2025-08-21 11:30:00', 2, '2025-08-22 10:30:00'),
-- Carol Martinez (ST2026003) - 2 courses pending
(8, 3, 5, '2025/2026', 1, 'pending',  '2025-09-02 14:10:00', NULL, NULL),
(9, 3, 6, '2025/2026', 1, 'pending',  '2025-09-02 14:10:00', NULL, NULL),
-- David Brown (ST2026004) - 1 course pending
(10, 4, 7, '2025/2026', 1, 'pending', '2025-09-05 16:45:00', NULL, NULL),
-- Eve Davis (ST2026005) - 1 course approved
(11, 5, 8, '2025/2026', 1, 'approved', '2025-09-01 08:30:00', 2, '2025-09-03 09:00:00');

-- Results
INSERT INTO `results` (`id`, `student_id`, `course_id`, `academic_year`, `semester`, `continuous_assessment`, `exam_score`, `total_score`, `mark`, `grade`, `grade_point`, `is_published`, `entered_by`) VALUES
(1, 1, 1, '2025/2026', 1, 35.0, 47.0, 82.0, 82.0, 'A',  4.0, 1, 3),
(2, 1, 2, '2025/2026', 1, 32.0, 42.0, 74.0, 74.0, 'B',  3.0, 1, 3),
(3, 1, 3, '2025/2026', 1, 30.0, 38.0, 68.0, 68.0, 'B-', 2.7, 1, 3),
(4, 1, 4, '2025/2026', 1, 38.0, 48.0, 86.0, 86.0, 'A',  4.0, 1, 3),
(5, 2, 1, '2025/2026', 1, 33.0, 45.0, 78.0, 78.0, 'B+', 3.3, 1, 3),
(6, 2, 2, '2025/2026', 1, 28.0, 34.0, 62.0, 62.0, 'C+', 2.3, 1, 3),
(7, 5, 8, '2025/2026', 1, 40.0, 50.0, 90.0, 90.0, 'A+', 4.0, 1, 3);

-- Notifications
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`) VALUES
(1,  6, 'Registration Approved', 'Your course registration for Semester 1, 2025/2026 has been approved by the Registrar.', 'success', 0, '2025-08-22 10:05:00'),
(2,  6, 'Semester Results Published', 'Official marks for Database Systems (CS201) are now available in your academic record.', 'info', 0, '2025-09-10 14:00:00'),
(3,  6, 'Important Deadline', 'Course add/drop period closes on Friday at 5:00 PM. Please review your enrolled modules.', 'warning', 1, '2025-09-15 08:00:00'),
(4,  3, 'Marks Submission Window Open', 'Please enter and verify assessment marks for CS201 and CS202 before the semester cutoff date.', 'info', 0, '2025-09-01 09:00:00'),
(5,  2, 'Pending Registrations Waiting', 'There are 3 new student registration requests awaiting verification and approval.', 'warning', 0, '2025-09-05 17:00:00'),
(6,  1, 'System Maintenance Notice', 'Scheduled database indexing and system backup will occur this Saturday from 02:00 AM to 04:00 AM.', 'info', 1, '2025-09-18 10:00:00'),
(7,  7, 'Welcome to UMS', 'Welcome to the university student portal. Access your timetable and course resources anytime.', 'general', 1, '2025-08-10 10:05:00'),
(8,  8, 'Registration Under Review', 'Your semester course registration was received and is currently under review by the registrar.', 'info', 0, '2025-09-02 14:15:00');

SET FOREIGN_KEY_CHECKS = 1;
