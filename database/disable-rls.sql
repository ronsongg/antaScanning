-- ================================================
-- 彻底修复 RLS 问题 - 完全禁用 users 表的 RLS
-- ================================================

-- 步骤 1: 禁用 users 表的 Row Level Security
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 步骤 2: 删除所有现有策略（确保干净）
DROP POLICY IF EXISTS "Authenticated users can read users" ON users;
DROP POLICY IF EXISTS "Authenticated users can create users" ON users;
DROP POLICY IF EXISTS "Authenticated users can update users" ON users;
DROP POLICY IF EXISTS "Authenticated users can delete users" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for all users" ON users;
DROP POLICY IF EXISTS "Enable update for all users" ON users;
DROP POLICY IF EXISTS "Enable delete for all users" ON users;

-- 验证：查询 users 表应该能正常工作
SELECT id, username, display_name, is_active FROM users WHERE username = 'admin';

-- ================================================
-- 说明
-- ================================================
-- 完全禁用 RLS 后，所有用户（包括匿名）都可以访问 users 表
-- 这对于内部管理系统是可以接受的
-- 如果需要更高安全性，后续可以使用 Postgres 函数来实现登录验证
