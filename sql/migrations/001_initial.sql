-- Create tables for sigao-ai import
-- 设置客户端字符集，确保中文正确处理
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

CREATE DATABASE IF NOT EXISTS sigao_ai DEFAULT CHARACTER SET = 'utf8mb4' DEFAULT COLLATE = 'utf8mb4_unicode_ci';
USE sigao_ai;

CREATE TABLE IF NOT EXISTS translations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(128) NOT NULL,
  lang VARCHAR(16) DEFAULT 'zh',
  copyright_holder VARCHAR(255),
  license VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(64) NOT NULL UNIQUE,
  name_cn VARCHAR(128) NOT NULL,
  book_type VARCHAR(64) DEFAULT NULL,
  testament ENUM('旧约','新约') DEFAULT '新约',
  order_index INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS verses (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  translation_id INT NOT NULL,
  book_id INT NOT NULL,
  chapter INT NULL,
  verse_ref VARCHAR(64) NULL,
  line_index INT NOT NULL,
  type ENUM('verse','note') NOT NULL DEFAULT 'verse',
  text TEXT,
  text_plain TEXT,
  content_hash CHAR(64),
  original_row INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_verses_translation FOREIGN KEY (translation_id) REFERENCES translations(id) ON DELETE CASCADE,
  CONSTRAINT fk_verses_book FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ensure display order per chapter
CREATE UNIQUE INDEX ux_translation_book_chapter_line ON verses (translation_id, book_id, chapter, line_index);
CREATE INDEX idx_translation_book_chapter_verse_ref ON verses (translation_id, book_id, chapter, verse_ref(32));

CREATE TABLE IF NOT EXISTS ai_responses_cache (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  translation_id INT,
  book_id INT,
  chapter INT,
  verse_ref VARCHAR(64),
  function_type VARCHAR(64),
  lang VARCHAR(16),
  input_hash CHAR(64),
  response_json JSON,
  tokens_used INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ttl_expires_at DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- import_staging removed: we import directly into main tables (no staging table)
