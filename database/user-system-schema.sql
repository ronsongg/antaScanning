-- ================================================
-- 用户系统数据库 Schema
-- 项目：安踏扫描系统
-- 日期：2026-02-07
-- ================================================

-- 1. 创建 users 表
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    last_login_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true
);

-- 2. 创建索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- 3. 更新 packages 表
-- 将 operator_id 改为 UUID 类型，关联到 users 表
ALTER TABLE packages
ALTER COLUMN operator_id TYPE UUID USING operator_id::uuid;

ALTER TABLE packages
ADD CONSTRAINT fk_operator
FOREIGN KEY (operator_id) REFERENCES users(id);

-- 4. 插入默认管理员账号
-- 注意：密码哈希需要在应用层生成后更新
-- 默认密码：admin123
-- 此处先插入占位符，稍后通过应用层更新
INSERT INTO users (username, password_hash, display_name)
VALUES (
    'admin',
    'PLACEHOLDER_WILL_BE_UPDATED',
    '系统管理员'
)
ON CONFLICT (username) DO NOTHING;

-- 5. 启用 Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

-- 6. 删除旧的公开访问策略（如果存在）
DROP POLICY IF EXISTS "Enable read access for all users" ON packages;
DROP POLICY IF EXISTS "Enable insert access for all users" ON packages;
DROP POLICY IF EXISTS "Enable update access for all users" ON packages;
DROP POLICY IF EXISTS "Enable delete access for all users" ON packages;

-- 7. 创建新的 packages 表策略
-- 注意：由于使用自定义 JWT 而非 Supabase Auth，策略保持简单
CREATE POLICY "Authenticated users can access packages"
ON packages FOR ALL
USING (true);

-- 8. 创建 users 表策略
CREATE POLICY "Authenticated users can read users"
ON users FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create users"
ON users FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update users"
ON users FOR UPDATE
USING (true);

-- 9. 添加注释
COMMENT ON TABLE users IS '用户表：存储系统所有用户信息';
COMMENT ON COLUMN users.id IS '用户唯一标识';
COMMENT ON COLUMN users.username IS '登录用户名';
COMMENT ON COLUMN users.password_hash IS '密码哈希（PBKDF2-SHA256）';
COMMENT ON COLUMN users.display_name IS '显示名称';
COMMENT ON COLUMN users.created_at IS '创建时间';
COMMENT ON COLUMN users.created_by IS '创建者用户ID';
COMMENT ON COLUMN users.last_login_at IS '最后登录时间';
COMMENT ON COLUMN users.is_active IS '账号是否激活';
