-- ============================================================
-- 山花成长记 - Supabase 数据库建表 & 种子数据
-- 使用方法：在 Supabase Dashboard → SQL Editor → 粘贴全部执行
-- ============================================================

-- 1. 用户信息表 (关联 Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'volunteer', 'parent', 'child')),
  avatar_color TEXT DEFAULT '#E8915C',
  linked_children UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 孩子档案
CREATE TABLE IF NOT EXISTS children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  age INT DEFAULT 8,
  grade TEXT DEFAULT '',
  description TEXT DEFAULT '',
  avatar TEXT DEFAULT '',
  join_date DATE DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 成长记录
CREATE TABLE IF NOT EXISTS growth_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  child_name TEXT DEFAULT '',
  date DATE DEFAULT CURRENT_DATE,
  type TEXT DEFAULT 'milestone' CHECK (type IN ('photo', 'video', 'milestone')),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  media JSONB DEFAULT '[]'::jsonb,
  likes INT DEFAULT 0,
  liked_by UUID[] DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 寄语祝福
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id),
  avatar_color TEXT DEFAULT '#E8915C',
  to_child TEXT DEFAULT '',
  content TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  likes INT DEFAULT 0,
  liked_by UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 问答帖子
CREATE TABLE IF NOT EXISTS qa_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id),
  role TEXT NOT NULL CHECK (role IN ('student', 'volunteer')),
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  date DATE DEFAULT CURRENT_DATE,
  likes INT DEFAULT 0,
  liked_by UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 问答回答
CREATE TABLE IF NOT EXISTS qa_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES qa_posts(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id),
  text TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  likes INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 评论
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_type TEXT NOT NULL CHECK (parent_type IN ('growth', 'message')),
  parent_id UUID NOT NULL,
  author TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id),
  text TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RLS 策略：允许认证用户访问所有数据（共享平台）
-- 先删除旧策略（如果存在），再重新创建
-- ============================================================
DO $$ BEGIN
  ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS children ENABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS growth_records ENABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS messages ENABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS qa_posts ENABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS qa_answers ENABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS comments ENABLE ROW LEVEL SECURITY;
  -- Drop existing policies
  DROP POLICY IF EXISTS "auth_read" ON profiles;
  DROP POLICY IF EXISTS "auth_insert" ON profiles;
  DROP POLICY IF EXISTS "auth_update" ON profiles;
  DROP POLICY IF EXISTS "auth_delete" ON profiles;
  DROP POLICY IF EXISTS "auth_read" ON children;
  DROP POLICY IF EXISTS "auth_insert" ON children;
  DROP POLICY IF EXISTS "auth_update" ON children;
  DROP POLICY IF EXISTS "auth_delete" ON children;
  DROP POLICY IF EXISTS "auth_read" ON growth_records;
  DROP POLICY IF EXISTS "auth_insert" ON growth_records;
  DROP POLICY IF EXISTS "auth_update" ON growth_records;
  DROP POLICY IF EXISTS "auth_delete" ON growth_records;
  DROP POLICY IF EXISTS "auth_read" ON messages;
  DROP POLICY IF EXISTS "auth_insert" ON messages;
  DROP POLICY IF EXISTS "auth_update" ON messages;
  DROP POLICY IF EXISTS "auth_delete" ON messages;
  DROP POLICY IF EXISTS "auth_read" ON qa_posts;
  DROP POLICY IF EXISTS "auth_insert" ON qa_posts;
  DROP POLICY IF EXISTS "auth_update" ON qa_posts;
  DROP POLICY IF EXISTS "auth_delete" ON qa_posts;
  DROP POLICY IF EXISTS "auth_read" ON qa_answers;
  DROP POLICY IF EXISTS "auth_insert" ON qa_answers;
  DROP POLICY IF EXISTS "auth_update" ON qa_answers;
  DROP POLICY IF EXISTS "auth_delete" ON qa_answers;
  DROP POLICY IF EXISTS "auth_read" ON comments;
  DROP POLICY IF EXISTS "auth_insert" ON comments;
  DROP POLICY IF EXISTS "auth_update" ON comments;
  DROP POLICY IF EXISTS "auth_delete" ON comments;
END $$;

-- 认证用户可读
CREATE POLICY "auth_read" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read" ON children FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read" ON growth_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read" ON messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read" ON qa_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read" ON qa_answers FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read" ON comments FOR SELECT TO authenticated USING (true);

-- 认证用户可插入
CREATE POLICY "auth_insert" ON profiles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_insert" ON children FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_insert" ON growth_records FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_insert" ON messages FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_insert" ON qa_posts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_insert" ON qa_answers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_insert" ON comments FOR INSERT TO authenticated WITH CHECK (true);

-- 认证用户可更新
CREATE POLICY "auth_update" ON profiles FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_update" ON children FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_update" ON growth_records FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_update" ON messages FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_update" ON qa_posts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_update" ON qa_answers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_update" ON comments FOR UPDATE TO authenticated USING (true);

-- 认证用户可删除
CREATE POLICY "auth_delete" ON profiles FOR DELETE TO authenticated USING (true);
CREATE POLICY "auth_delete" ON children FOR DELETE TO authenticated USING (true);
CREATE POLICY "auth_delete" ON growth_records FOR DELETE TO authenticated USING (true);
CREATE POLICY "auth_delete" ON messages FOR DELETE TO authenticated USING (true);
CREATE POLICY "auth_delete" ON qa_posts FOR DELETE TO authenticated USING (true);
CREATE POLICY "auth_delete" ON qa_answers FOR DELETE TO authenticated USING (true);
CREATE POLICY "auth_delete" ON comments FOR DELETE TO authenticated USING (true);

-- ============================================================
-- 种子数据（可选：在创建演示账号后执行）
-- 因为 children.created_by 引用 auth.users，需要先创建账号
-- 此部分在用户注册后会通过应用自动插入
-- ============================================================
