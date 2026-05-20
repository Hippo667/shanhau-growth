-- 小问号科学周刊 - D1 数据库建表

-- 故事阅读量
CREATE TABLE IF NOT EXISTS story_stats (
  story_id   INTEGER PRIMARY KEY,
  read_count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 种子数据：3 篇首期故事
INSERT OR IGNORE INTO story_stats (story_id, read_count) VALUES (1, 128);
INSERT OR IGNORE INTO story_stats (story_id, read_count) VALUES (2, 96);
INSERT OR IGNORE INTO story_stats (story_id, read_count) VALUES (3, 115);

-- 故事留言
CREATE TABLE IF NOT EXISTS comments (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  story_id   INTEGER NOT NULL,
  emoji      TEXT NOT NULL DEFAULT '🌟',
  content    TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (story_id) REFERENCES story_stats(story_id)
);

CREATE INDEX IF NOT EXISTS idx_comments_story ON comments(story_id, created_at DESC);

-- 孩子来信
CREATE TABLE IF NOT EXISTS letters (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  mood       TEXT NOT NULL,
  content    TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_letters_time ON letters(created_at DESC);
