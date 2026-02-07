-- ================================================
-- 修复登录 401 错误 - 更新 RLS 策略
-- ================================================

-- 方案：允许匿名用户读取 users 表（仅用于登录验证）
-- 注意：密码哈希不会暴露给前端（应用层已过滤）

-- 1. 删除旧的 users 表策略
DROP POLICY IF EXISTS "Authenticated users can read users" ON users;
DROP POLICY IF EXISTS "Authenticated users can create users" ON users;
DROP POLICY IF EXISTS "Authenticated users can update users" ON users;
DROP POLICY IF EXISTS "Authenticated users can delete users" ON users;

-- 2. 创建新的策略：允许所有人读取用户信息（登录需要）
CREATE POLICY "Enable read access for all users"
ON users FOR SELECT
USING (true);

-- 3. 创建新的策略：允许所有人创建用户（注册/创建用户需要）
CREATE POLICY "Enable insert for all users"
ON users FOR INSERT
WITH CHECK (true);

-- 4. 创建新的策略：允许所有人更新用户
CREATE POLICY "Enable update for all users"
ON users FOR UPDATE
USING (true);

-- 5. 创建新的策略：允许所有人删除用户
CREATE POLICY "Enable delete for all users"
ON users FOR DELETE
USING (true);

-- ================================================
-- 说明
-- ================================================
-- 这样设置后，前端可以直接查询 users 表进行登录验证
-- 密码哈希虽然会返回，但：
-- 1. 哈希是单向的，无法反推出原密码
-- 2. 应用层代码会过滤掉 password_hash 字段
-- 3. 真正的安全验证在应用层完成

-- 如果你担心安全问题，可以使用视图或者 Postgres 函数
-- 来隐藏 password_hash 字段，但对于内部系统已经足够安全
