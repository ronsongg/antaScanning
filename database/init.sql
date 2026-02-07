-- ================================================
-- 安踏扫描系统 - 完整数据库初始化脚本
-- 项目：扫描系统
-- 日期：2026-02-07
-- 描述：包含所有表、索引、约束、RLS策略和初始数据
-- ================================================

-- ================================================
-- 第一部分：删除旧结构（可选，仅在重新初始化时使用）
-- ================================================
-- 注意：生产环境请谨慎使用，会删除所有数据！

-- DROP TABLE IF EXISTS packages CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- ================================================
-- 第二部分：创建表结构
-- ================================================

-- ------------------------------------------------
-- 1. 用户表 (users)
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    last_login_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,

    -- 约束
    CONSTRAINT username_length CHECK (char_length(username) >= 3),
    CONSTRAINT display_name_not_empty CHECK (char_length(display_name) > 0)
);

-- ------------------------------------------------
-- 2. 包裹/单号表 (packages)
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_number TEXT UNIQUE NOT NULL,
    zone TEXT NOT NULL,
    store_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    scanned_at TIMESTAMPTZ,
    imported_at TIMESTAMPTZ DEFAULT NOW(),
    is_empty_tracking BOOLEAN DEFAULT false,
    operator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    vehicle_number TEXT,  -- 车牌号
    batch_id TEXT,  -- 批次ID，格式：车牌号_时间戳
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- 约束
    CONSTRAINT status_valid CHECK (status IN ('pending', 'scanned')),
    CONSTRAINT zone_not_empty CHECK (char_length(zone) > 0),
    CONSTRAINT tracking_number_not_empty_unless_flagged CHECK (
        is_empty_tracking = true OR char_length(tracking_number) > 0
    )
);

-- ================================================
-- 第三部分：创建索引
-- ================================================

-- users 表索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- packages 表索引
CREATE INDEX IF NOT EXISTS idx_packages_tracking_number ON packages(tracking_number);
CREATE INDEX IF NOT EXISTS idx_packages_status ON packages(status);
CREATE INDEX IF NOT EXISTS idx_packages_zone ON packages(zone);
CREATE INDEX IF NOT EXISTS idx_packages_store_name ON packages(store_name);
CREATE INDEX IF NOT EXISTS idx_packages_operator_id ON packages(operator_id);
CREATE INDEX IF NOT EXISTS idx_packages_scanned_at ON packages(scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_packages_imported_at ON packages(imported_at DESC);
CREATE INDEX IF NOT EXISTS idx_packages_is_empty_tracking ON packages(is_empty_tracking);
CREATE INDEX IF NOT EXISTS idx_packages_vehicle_number ON packages(vehicle_number);
CREATE INDEX IF NOT EXISTS idx_packages_batch_id ON packages(batch_id);

-- 复合索引（常见查询优化）
CREATE INDEX IF NOT EXISTS idx_packages_status_zone ON packages(status, zone);
CREATE INDEX IF NOT EXISTS idx_packages_status_scanned_at ON packages(status, scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_packages_batch_status ON packages(batch_id, status);

-- ================================================
-- 第四部分：创建触发器（自动更新时间戳）
-- ================================================

-- 创建更新时间戳函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为 packages 表添加更新时间戳触发器
DROP TRIGGER IF EXISTS set_updated_at ON packages;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON packages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- 第五部分：启用行级安全 (RLS)
-- ================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

-- ================================================
-- 第六部分：创建 RLS 策略
-- ================================================

-- ------------------------------------------------
-- users 表策略
-- ------------------------------------------------

-- 删除旧策略（如果存在）
DROP POLICY IF EXISTS "Authenticated users can read users" ON users;
DROP POLICY IF EXISTS "Authenticated users can create users" ON users;
DROP POLICY IF EXISTS "Authenticated users can update users" ON users;
DROP POLICY IF EXISTS "Authenticated users can delete users" ON users;

-- 读取策略：所有认证用户可以读取用户列表
CREATE POLICY "Authenticated users can read users"
ON users FOR SELECT
USING (true);

-- 插入策略：所有认证用户可以创建用户
CREATE POLICY "Authenticated users can create users"
ON users FOR INSERT
WITH CHECK (true);

-- 更新策略：所有认证用户可以更新用户信息
CREATE POLICY "Authenticated users can update users"
ON users FOR UPDATE
USING (true);

-- 删除策略：所有认证用户可以删除用户（应用层控制细节）
CREATE POLICY "Authenticated users can delete users"
ON users FOR DELETE
USING (true);

-- ------------------------------------------------
-- packages 表策略
-- ------------------------------------------------

-- 删除旧策略（如果存在）
DROP POLICY IF EXISTS "Enable read access for all users" ON packages;
DROP POLICY IF EXISTS "Enable insert access for all users" ON packages;
DROP POLICY IF EXISTS "Enable update access for all users" ON packages;
DROP POLICY IF EXISTS "Enable delete access for all users" ON packages;
DROP POLICY IF EXISTS "Authenticated users can access packages" ON packages;

-- 统一策略：所有认证用户可以访问包裹数据
CREATE POLICY "Authenticated users can access packages"
ON packages FOR ALL
USING (true);

-- ================================================
-- 第七部分：插入初始数据
-- ================================================

-- ------------------------------------------------
-- 插入默认管理员账号
-- ------------------------------------------------
-- 注意：密码哈希需要在应用层生成
-- 默认用户名：admin
-- 默认密码：admin123
--
-- 生成密码哈希的方法：
-- 1. 在浏览器控制台运行：
--    import { hashPassword } from './services/cryptoService';
--    const hash = await hashPassword('admin123');
--    console.log(hash);
-- 2. 复制输出的哈希值替换下面的 'PLACEHOLDER_PASSWORD_HASH'

INSERT INTO users (
    id,
    username,
    password_hash,
    display_name,
    created_by,
    is_active
)
VALUES (
    'a0000000-0000-0000-0000-000000000001'::uuid,
    'admin',
    'PLACEHOLDER_PASSWORD_HASH',
    '系统管理员',
    NULL,
    true
)
ON CONFLICT (username) DO NOTHING;

-- ================================================
-- 第八部分：创建有用的视图
-- ================================================

-- ------------------------------------------------
-- 扫描统计视图
-- ------------------------------------------------
CREATE OR REPLACE VIEW v_scan_statistics AS
SELECT
    COUNT(*) AS total_packages,
    COUNT(*) FILTER (WHERE status = 'scanned') AS scanned_count,
    COUNT(*) FILTER (WHERE status = 'pending') AS pending_count,
    COUNT(*) FILTER (WHERE is_empty_tracking = true) AS empty_tracking_count,
    ROUND(
        CAST(COUNT(*) FILTER (WHERE status = 'scanned') AS NUMERIC) /
        NULLIF(COUNT(*), 0) * 100,
        2
    ) AS scan_progress_percentage,
    MAX(scanned_at) AS last_scan_time,
    MAX(imported_at) AS last_import_time
FROM packages;

-- ------------------------------------------------
-- 按分区统计视图
-- ------------------------------------------------
CREATE OR REPLACE VIEW v_zone_statistics AS
SELECT
    zone,
    COUNT(*) AS total_packages,
    COUNT(*) FILTER (WHERE status = 'scanned') AS scanned_count,
    COUNT(*) FILTER (WHERE status = 'pending') AS pending_count,
    ROUND(
        CAST(COUNT(*) FILTER (WHERE status = 'scanned') AS NUMERIC) /
        NULLIF(COUNT(*), 0) * 100,
        2
    ) AS scan_progress_percentage
FROM packages
GROUP BY zone
ORDER BY zone;

-- ------------------------------------------------
-- 按门店统计视图
-- ------------------------------------------------
CREATE OR REPLACE VIEW v_store_statistics AS
SELECT
    store_name,
    COUNT(*) AS total_packages,
    COUNT(*) FILTER (WHERE status = 'scanned') AS scanned_count,
    COUNT(*) FILTER (WHERE status = 'pending') AS pending_count,
    ROUND(
        CAST(COUNT(*) FILTER (WHERE status = 'scanned') AS NUMERIC) /
        NULLIF(COUNT(*), 0) * 100,
        2
    ) AS scan_progress_percentage
FROM packages
GROUP BY store_name
ORDER BY total_packages DESC;

-- ------------------------------------------------
-- 操作员工作统计视图
-- ------------------------------------------------
CREATE OR REPLACE VIEW v_operator_statistics AS
SELECT
    u.id AS operator_id,
    u.username,
    u.display_name,
    COUNT(p.id) AS total_scanned,
    MIN(p.scanned_at) AS first_scan_time,
    MAX(p.scanned_at) AS last_scan_time,
    COUNT(DISTINCT DATE(p.scanned_at)) AS active_days
FROM users u
LEFT JOIN packages p ON p.operator_id = u.id AND p.status = 'scanned'
GROUP BY u.id, u.username, u.display_name
ORDER BY total_scanned DESC;

-- ================================================
-- 第九部分：创建实用函数
-- ================================================

-- ------------------------------------------------
-- 获取扫描进度函数
-- ------------------------------------------------
CREATE OR REPLACE FUNCTION get_scan_progress()
RETURNS TABLE (
    total INTEGER,
    scanned INTEGER,
    pending INTEGER,
    progress NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::INTEGER AS total,
        COUNT(*) FILTER (WHERE status = 'scanned')::INTEGER AS scanned,
        COUNT(*) FILTER (WHERE status = 'pending')::INTEGER AS pending,
        ROUND(
            CAST(COUNT(*) FILTER (WHERE status = 'scanned') AS NUMERIC) /
            NULLIF(COUNT(*), 0) * 100,
            2
        ) AS progress
    FROM packages;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------
-- 批量重置扫描状态函数（用于测试）
-- ------------------------------------------------
CREATE OR REPLACE FUNCTION reset_scan_status(
    p_zone TEXT DEFAULT NULL,
    p_store_name TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    UPDATE packages
    SET
        status = 'pending',
        scanned_at = NULL,
        operator_id = NULL
    WHERE
        (p_zone IS NULL OR zone = p_zone) AND
        (p_store_name IS NULL OR store_name = p_store_name);

    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RETURN affected_rows;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 第十部分：添加表和列注释
-- ================================================

-- users 表注释
COMMENT ON TABLE users IS '用户表：存储系统所有用户信息';
COMMENT ON COLUMN users.id IS '用户唯一标识';
COMMENT ON COLUMN users.username IS '登录用户名（唯一）';
COMMENT ON COLUMN users.password_hash IS '密码哈希（PBKDF2-SHA256 + salt）';
COMMENT ON COLUMN users.display_name IS '用户显示名称';
COMMENT ON COLUMN users.created_at IS '账号创建时间';
COMMENT ON COLUMN users.created_by IS '创建者用户ID（自引用）';
COMMENT ON COLUMN users.last_login_at IS '最后登录时间';
COMMENT ON COLUMN users.is_active IS '账号是否激活（禁用用户无法登录）';

-- packages 表注释
COMMENT ON TABLE packages IS '包裹表：存储所有待扫描和已扫描的包裹信息';
COMMENT ON COLUMN packages.id IS '包裹唯一标识';
COMMENT ON COLUMN packages.tracking_number IS '快递单号（唯一）';
COMMENT ON COLUMN packages.zone IS '分区（如：10-1, 10-2）';
COMMENT ON COLUMN packages.store_name IS '门店名称';
COMMENT ON COLUMN packages.status IS '扫描状态：pending（待扫描）或 scanned（已扫描）';
COMMENT ON COLUMN packages.scanned_at IS '扫描时间';
COMMENT ON COLUMN packages.imported_at IS '数据导入时间';
COMMENT ON COLUMN packages.is_empty_tracking IS '是否为空单号（Excel中单号为空的记录）';
COMMENT ON COLUMN packages.operator_id IS '操作员ID（扫描此包裹的用户）';
COMMENT ON COLUMN packages.created_at IS '记录创建时间';
COMMENT ON COLUMN packages.updated_at IS '记录更新时间（自动维护）';

-- 视图注释
COMMENT ON VIEW v_scan_statistics IS '扫描统计视图：提供整体扫描进度和统计数据';
COMMENT ON VIEW v_zone_statistics IS '分区统计视图：按分区统计扫描进度';
COMMENT ON VIEW v_store_statistics IS '门店统计视图：按门店统计扫描进度';
COMMENT ON VIEW v_operator_statistics IS '操作员统计视图：统计每个操作员的工作量';

-- ================================================
-- 第十一部分：授权（如需要）
-- ================================================

-- 如果使用 service_role 或特定角色，可以在这里添加授权
-- GRANT ALL ON TABLE users TO service_role;
-- GRANT ALL ON TABLE packages TO service_role;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
-- GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ================================================
-- 初始化脚本完成
-- ================================================

-- 验证安装
DO $$
DECLARE
    user_count INTEGER;
    package_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO package_count FROM packages;

    RAISE NOTICE '========================================';
    RAISE NOTICE '数据库初始化完成！';
    RAISE NOTICE '========================================';
    RAISE NOTICE '用户数量: %', user_count;
    RAISE NOTICE '包裹数量: %', package_count;
    RAISE NOTICE '========================================';
    RAISE NOTICE '重要提示：';
    RAISE NOTICE '1. 请更新管理员账号的密码哈希';
    RAISE NOTICE '2. 默认用户名: admin';
    RAISE NOTICE '3. 请在应用层生成密码哈希';
    RAISE NOTICE '========================================';
END $$;

-- ================================================
-- 使用说明
-- ================================================

/*
使用步骤：

1. 在 Supabase Dashboard 中打开 SQL Editor
2. 复制并粘贴整个脚本
3. 点击 "Run" 执行

4. 生成管理员密码哈希：
   a. 启动应用
   b. 打开浏览器控制台
   c. 执行以下代码：

      const crypto = window.crypto;
      const encoder = new TextEncoder();
      const password = 'admin123';

      // 生成盐值
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');

      // 生成哈希
      const passwordBuffer = encoder.encode(password);
      crypto.subtle.importKey('raw', passwordBuffer, 'PBKDF2', false, ['deriveBits'])
        .then(keyMaterial => crypto.subtle.deriveBits(
          { name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' },
          keyMaterial,
          256
        ))
        .then(hashBuffer => {
          const hash = new Uint8Array(hashBuffer);
          const hashHex = Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join('');
          const fullHash = `${saltHex}:${hashHex}`;
          console.log('密码哈希:', fullHash);
        });

   d. 复制输出的哈希值

5. 更新管理员密码：
   UPDATE users
   SET password_hash = '你复制的哈希值'
   WHERE username = 'admin';

6. 完成！现在可以使用 admin/admin123 登录

常用查询：

-- 查看扫描统计
SELECT * FROM v_scan_statistics;

-- 查看分区统计
SELECT * FROM v_zone_statistics;

-- 查看门店统计
SELECT * FROM v_store_statistics;

-- 查看操作员统计
SELECT * FROM v_operator_statistics;

-- 获取扫描进度
SELECT * FROM get_scan_progress();

-- 重置所有扫描状态（测试用）
SELECT reset_scan_status();

-- 重置特定分区的扫描状态
SELECT reset_scan_status('10-1');

-- 重置特定门店的扫描状态
SELECT reset_scan_status(NULL, '门店A');
*/
