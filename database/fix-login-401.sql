-- ================================================
-- 修复登录 401 错误 - 一键修复脚本
-- 问题：RLS 阻止匿名用户查询 users 表导致登录失败
-- 解决：允许所有用户访问（适合内部管理系统）
-- ================================================

-- 步骤 1: 删除所有旧的 users 表 RLS 策略
DROP POLICY IF EXISTS "Authenticated users can read users" ON users;
DROP POLICY IF EXISTS "Authenticated users can create users" ON users;
DROP POLICY IF EXISTS "Authenticated users can update users" ON users;
DROP POLICY IF EXISTS "Authenticated users can delete users" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for all users" ON users;
DROP POLICY IF EXISTS "Enable update for all users" ON users;
DROP POLICY IF EXISTS "Enable delete for all users" ON users;

-- 步骤 2: 创建新的宽松策略（允许所有访问）
CREATE POLICY "Enable read access for all users"
ON users FOR SELECT
USING (true);

CREATE POLICY "Enable insert for all users"
ON users FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update for all users"
ON users FOR UPDATE
USING (true);

CREATE POLICY "Enable delete for all users"
ON users FOR DELETE
USING (true);

-- 步骤 3: 同样修复 packages 表策略
DROP POLICY IF EXISTS "Authenticated users can access packages" ON packages;
DROP POLICY IF EXISTS "Enable read access for all users" ON packages;
DROP POLICY IF EXISTS "Enable insert access for all users" ON packages;
DROP POLICY IF EXISTS "Enable update access for all users" ON packages;
DROP POLICY IF EXISTS "Enable delete access for all users" ON packages;

CREATE POLICY "Enable all access for packages"
ON packages FOR ALL
USING (true);

-- 步骤 4: 验证用户表有数据
DO $$
DECLARE
    user_count INTEGER;
    admin_exists BOOLEAN;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT EXISTS(SELECT 1 FROM users WHERE username = 'admin') INTO admin_exists;

    RAISE NOTICE '==========================================';
    RAISE NOTICE 'RLS 策略修复完成！';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '用户总数: %', user_count;
    RAISE NOTICE 'admin 账号存在: %', admin_exists;

    IF NOT admin_exists THEN
        RAISE NOTICE '⚠️  警告：admin 账号不存在，需要创建';
        RAISE NOTICE '请执行以下 SQL 创建 admin 账号：';
        RAISE NOTICE 'INSERT INTO users (username, password_hash, display_name) VALUES (''admin'', ''YOUR_HASH'', ''系统管理员'');';
    ELSE
        -- 检查密码哈希是否是占位符
        DECLARE
            pwd_hash TEXT;
        BEGIN
            SELECT password_hash INTO pwd_hash FROM users WHERE username = 'admin';
            IF pwd_hash LIKE 'PLACEHOLDER%' THEN
                RAISE NOTICE '⚠️  警告：admin 密码仍是占位符，需要更新';
                RAISE NOTICE '请使用 hash-generator.html 生成真实密码哈希';
            ELSE
                RAISE NOTICE '✅ admin 账号配置正常';
            END IF;
        END;
    END IF;
    RAISE NOTICE '==========================================';
END $$;

-- ================================================
-- 说明
-- ================================================
-- 安全说明：
-- 1. 这个配置允许匿名用户访问 users 和 packages 表
-- 2. 适合内部管理系统（无公网暴露）
-- 3. 密码哈希是单向的，无法反推原密码
-- 4. 真正的权限控制在应用层完成
--
-- 如果需要更高安全性，可以：
-- 1. 创建 Postgres 函数进行登录验证
-- 2. 使用视图隐藏敏感字段
-- 3. 部署到私有网络
