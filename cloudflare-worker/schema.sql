-- ============================================================
-- 山花成长记 - Cloudflare D1 数据库建表
-- 使用方法：wrangler d1 execute shanhau-db --file=schema.sql
-- ============================================================

-- 1. 用户表 (内置认证)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'volunteer', 'parent', 'child')),
  avatar_color TEXT DEFAULT '#E8915C',
  linked_children TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now'))
);

-- 2. 孩子档案
CREATE TABLE IF NOT EXISTS children (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER DEFAULT 8,
  grade TEXT DEFAULT '',
  description TEXT DEFAULT '',
  avatar TEXT DEFAULT '',
  join_date TEXT DEFAULT (date('now')),
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 3. 成长记录
CREATE TABLE IF NOT EXISTS growth_records (
  id TEXT PRIMARY KEY,
  child_id TEXT,
  child_name TEXT DEFAULT '',
  date TEXT DEFAULT (date('now')),
  type TEXT DEFAULT 'milestone' CHECK (type IN ('photo', 'video', 'milestone')),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  media TEXT DEFAULT '[]',
  likes INTEGER DEFAULT 0,
  liked_by TEXT DEFAULT '[]',
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 4. 寄语祝福
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  author TEXT NOT NULL,
  author_id TEXT,
  avatar_color TEXT DEFAULT '#E8915C',
  to_child TEXT DEFAULT '',
  content TEXT NOT NULL,
  date TEXT DEFAULT (date('now')),
  likes INTEGER DEFAULT 0,
  liked_by TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now'))
);

-- 5. 问答帖子
CREATE TABLE IF NOT EXISTS qa_posts (
  id TEXT PRIMARY KEY,
  author TEXT NOT NULL,
  author_id TEXT,
  role TEXT NOT NULL CHECK (role IN ('student', 'volunteer')),
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  date TEXT DEFAULT (date('now')),
  likes INTEGER DEFAULT 0,
  liked_by TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now'))
);

-- 6. 问答回答
CREATE TABLE IF NOT EXISTS qa_answers (
  id TEXT PRIMARY KEY,
  post_id TEXT,
  author TEXT NOT NULL,
  author_id TEXT,
  text TEXT NOT NULL,
  date TEXT DEFAULT (date('now')),
  likes INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 7. 评论
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  parent_type TEXT NOT NULL CHECK (parent_type IN ('growth', 'message')),
  parent_id TEXT NOT NULL,
  author TEXT NOT NULL,
  author_id TEXT,
  text TEXT NOT NULL,
  date TEXT DEFAULT (date('now')),
  created_at TEXT DEFAULT (datetime('now'))
);
