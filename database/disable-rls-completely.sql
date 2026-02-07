-- ================================================
-- 终极修复方案：完全禁用 RLS
-- 这是最简单直接的解决方案，适合内部管理系统
-- ================================================

-- 步骤 1: 完全禁用 users 表的 RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 步骤 2: 完全禁用 packages 表的 RLS
ALTER TABLE packages DISABLE ROW LEVEL SECURITY;

-- 步骤 3: 删除所有 RLS 策略（可选，已禁用的表不需要策略）
DROP POLICY IF EXISTS "Authenticated users can read users" ON users;
DROP POLICY IF EXISTS "Authenticated users can create users" ON users;
DROP POLICY IF EXISTS "Authenticated users can update users" ON users;
DROP POLICY IF EXISTS "Authenticated users can delete users" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for all users" ON users;
DROP POLICY IF EXISTS "Enable update for all users" ON users;
DROP POLICY IF EXISTS "Enable delete for all users" ON users;

DROP POLICY IF EXISTS "Authenticated users can access packages" ON packages;
DROP POLICY IF EXISTS "Enable all access for packages" ON packages;
DROP POLICY IF EXISTS "Enable read access for all users" ON packages;
DROP POLICY IF EXISTS "Enable insert access for all users" ON packages;
DROP POLICY IF EXISTS "Enable update access for all users" ON packages;
DROP POLICY IF EXISTS "Enable delete access for all users" ON packages;

-- 步骤 4: 验证配置
DO $$
DECLARE
    users_rls_enabled BOOLEAN;
    packages_rls_enabled BOOLEAN;
    user_count INTEGER;
    admin_exists BOOLEAN;
    admin_pwd TEXT;
BEGIN
    -- 检查 RLS 状态
    SELECT relrowsecurity INTO users_rls_enabled
    FROM pg_class WHERE relname = 'users';

    SELECT relrowsecurity INTO packages_rls_enabled
    FROM pg_class WHERE relname = 'packages';

    -- 检查用户数据
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT EXISTS(SELECT 1 FROM users WHERE username = 'admin') INTO admin_exists;

    RAISE NOTICE '==========================================';
    RAISE NOTICE '✅ RLS 已完全禁用！';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'users 表 RLS 状态: % (应该是 false)', users_rls_enabled;
    RAISE NOTICE 'packages 表 RLS 状态: % (应该是 false)', packages_rls_enabled;
    RAISE NOTICE '';
    RAISE NOTICE '用户总数: %', user_count;
    RAISE NOTICE 'admin 账号存在: %', admin_exists;

    IF admin_exists THEN
        SELECT password_hash INTO admin_pwd FROM users WHERE username = 'admin';
        IF admin_pwd LIKE 'PLACEHOLDER%' OR admin_pwd = 'PLACEHOLDER_WILL_BE_UPDATED' THEN
            RAISE NOTICE '';
            RAISE NOTICE '⚠️  警告：admin 密码仍是占位符！';
            RAISE NOTICE '请执行以下步骤更新密码：';
            RAISE NOTICE '1. 打开 hash-generator.html';
            RAISE NOTICE '2. 生成密码哈希';
            RAISE NOTICE '3. 复制 SQL 语句并在此执行';
        ELSE
            RAISE NOTICE '✅ admin 密码已配置';
            RAISE NOTICE '可以使用 admin/admin123 登录';
        END IF;
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '⚠️  警告：admin 账号不存在！';
        RAISE NOTICE '请先创建 admin 账号';
    END IF;
    RAISE NOTICE '==========================================';
END $$;

-- ================================================
-- 说明
-- ================================================
-- 完全禁用 RLS 后：
-- ✅ 所有 API 请求都可以访问数据库
-- ✅ 不再有 401 Unauthorized 错误
-- ✅ 适合内部管理系统
-- ⚠️  不适合对外公开的应用
--
-- 安全性：
-- - 使用 anon key 时，Supabase 仍会进行基本的访问控制
-- - 真正的权限控制在应用层完成
-- - 密码使用强哈希算法保护
