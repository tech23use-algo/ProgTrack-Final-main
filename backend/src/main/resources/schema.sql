-- ═══════════════════════════════════════════════════════════════════
-- ProgTrack  –  Full MySQL Schema
-- Engine : InnoDB  |  Charset : utf8mb4  |  Managed by Hibernate DDL
-- ═══════════════════════════════════════════════════════════════════
-- NOTE: Hibernate (ddl-auto=update) creates / alters these tables
-- automatically at startup.  This file is kept as a reference and
-- can also be used to initialise a brand-new database manually:
--
--   mysql -u root -p goal_tracker < schema.sql
--
-- ───────────────────────────────────────────────────────────────────

CREATE DATABASE IF NOT EXISTS goal_tracker
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE goal_tracker;

-- ─── USERS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    email         VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name  VARCHAR(80)  NOT NULL,
    role          ENUM('ADMIN','MANAGER','USER') NOT NULL DEFAULT 'USER',
    active        TINYINT(1)   NOT NULL DEFAULT 1,
    manager_id    BIGINT       NULL,          -- FK → users.id (set by admin)
    created_at    DATETIME(6)  NOT NULL,

    PRIMARY KEY (id),
    UNIQUE  KEY uq_users_email      (email),
    KEY            idx_users_role        (role),
    KEY            idx_users_manager     (manager_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── GOALS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS goal (
    id                     BIGINT       NOT NULL AUTO_INCREMENT,
    title                  VARCHAR(120) NOT NULL,
    description            TEXT         NULL,
    target_date            DATE         NULL,
    hours_per_day          DOUBLE       NULL,
    assigned_by_manager_id BIGINT       NULL,
    user_id                BIGINT       NOT NULL,

    PRIMARY KEY (id),
    KEY idx_goal_user (user_id),
    CONSTRAINT fk_goal_user FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── MILESTONES ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS milestone (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    title             VARCHAR(200) NOT NULL,
    description       TEXT         NULL,
    status            ENUM('TODO','DONE') NOT NULL DEFAULT 'TODO',
    estimated_minutes INT          NULL,
    day_number        INT          NULL,
    goal_id           BIGINT       NOT NULL,

    PRIMARY KEY (id),
    KEY idx_milestone_goal (goal_id),
    CONSTRAINT fk_milestone_goal FOREIGN KEY (goal_id) REFERENCES goal (id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── GOAL COMMENTS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS goal_comment (
    id          BIGINT      NOT NULL AUTO_INCREMENT,
    goal_id     BIGINT      NOT NULL,
    manager_id  BIGINT      NOT NULL,
    text        TEXT        NOT NULL,
    created_at  DATETIME(6) NOT NULL,

    PRIMARY KEY (id),
    KEY idx_comment_goal (goal_id),
    CONSTRAINT fk_comment_goal FOREIGN KEY (goal_id) REFERENCES goal (id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── AUDIT LOG ──────────────────────────────────────────────────────
-- Records every privileged action taken by admins / managers.
CREATE TABLE IF NOT EXISTS audit_log (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    actor_id   BIGINT       NOT NULL,   -- who performed the action
    action     VARCHAR(50)  NOT NULL,   -- e.g. CREATE_USER, CHANGE_ROLE
    target_id  BIGINT       NULL,       -- affected user / resource id
    timestamp  DATETIME(6)  NOT NULL,

    PRIMARY KEY (id),
    KEY idx_audit_actor     (actor_id),
    KEY idx_audit_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
