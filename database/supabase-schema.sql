-- =============================================
-- 安踏项目扫描系统数据库设计
-- Supabase PostgreSQL
-- =============================================

-- 1. 创建 packages 表（包裹/单号表）
CREATE TABLE IF NOT EXISTS packages (
    -- 主键
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- 核心字段
    tracking_number TEXT NOT NULL UNIQUE,  -- 快递单号（唯一）
    zone TEXT NOT NULL,                     -- 分拣分区（如 "10-1", "A-08"）
    store_name TEXT NOT NULL,               -- 目的地门店
    status TEXT NOT NULL DEFAULT 'pending', -- 状态: pending | scanned

    -- 标记字段
    is_empty_tracking BOOLEAN DEFAULT FALSE, -- 是否为空单号

    -- 时间戳
    imported_at TIMESTAMPTZ DEFAULT NOW(),   -- 导入时间
    scanned_at TIMESTAMPTZ,                  -- 扫描时间
    created_at TIMESTAMPTZ DEFAULT NOW(),    -- 创建时间
    updated_at TIMESTAMPTZ DEFAULT NOW(),    -- 更新时间

    -- 操作员（可选，用于多人协作）
    operator_id TEXT,                        -- 操作员ID

    -- 约束
    CONSTRAINT valid_status CHECK (status IN ('pending', 'scanned'))
);

-- 2. 创建索引（提升查询性能）
CREATE INDEX IF NOT EXISTS idx_packages_tracking_number ON packages(tracking_number);
CREATE INDEX IF NOT EXISTS idx_packages_status ON packages(status);
CREATE INDEX IF NOT EXISTS idx_packages_zone ON packages(zone);
CREATE INDEX IF NOT EXISTS idx_packages_imported_at ON packages(imported_at);
CREATE INDEX IF NOT EXISTS idx_packages_scanned_at ON packages(scanned_at);

-- 3. 创建更新时间自动触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_packages_updated_at
    BEFORE UPDATE ON packages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. 启用行级安全策略 (RLS)
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

-- 5. 创建公开访问策略（开发环境，生产环境需要修改）
-- 注意：这允许匿名用户访问，生产环境应该使用认证策略

-- 允许所有人查询
CREATE POLICY "Enable read access for all users"
ON packages FOR SELECT
USING (true);

-- 允许所有人插入
CREATE POLICY "Enable insert access for all users"
ON packages FOR INSERT
WITH CHECK (true);

-- 允许所有人更新
CREATE POLICY "Enable update access for all users"
ON packages FOR UPDATE
USING (true);

-- 允许所有人删除
CREATE POLICY "Enable delete access for all users"
ON packages FOR DELETE
USING (true);

-- =============================================
-- 可选：统计视图（快速查询统计数据）
-- =============================================

CREATE OR REPLACE VIEW packages_daily_stats AS
SELECT
    DATE(imported_at) as date,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'scanned') as scanned,
    COUNT(*) FILTER (WHERE status = 'pending') as pending,
    COUNT(*) FILTER (WHERE is_empty_tracking = true) as empty_tracking,
    ROUND(
        (COUNT(*) FILTER (WHERE status = 'scanned')::DECIMAL / COUNT(*)) * 100,
        2
    ) as completion_rate
FROM packages
GROUP BY DATE(imported_at)
ORDER BY date DESC;

-- =============================================
-- 测试数据（可选）
-- =============================================

-- 插入测试数据
INSERT INTO packages (tracking_number, zone, store_name, status) VALUES
('TEST001', '10-1', '测试门店A', 'pending'),
('TEST002', '10-2', '测试门店B', 'scanned'),
('TEST003', 'A-08', '测试门店C', 'pending')
ON CONFLICT (tracking_number) DO NOTHING;

-- =============================================
-- 有用的查询示例
-- =============================================

-- 查询每日统计
-- SELECT * FROM packages_daily_stats;

-- 查询未扫描的包裹
-- SELECT * FROM packages WHERE status = 'pending' ORDER BY imported_at DESC;

-- 查询某个分区的包裹
-- SELECT * FROM packages WHERE zone = '10-1';

-- 查询今天导入的包裹
-- SELECT * FROM packages WHERE DATE(imported_at) = CURRENT_DATE;

-- 查询扫描率
-- SELECT
--     COUNT(*) as total,
--     COUNT(*) FILTER (WHERE status = 'scanned') as scanned,
--     ROUND((COUNT(*) FILTER (WHERE status = 'scanned')::DECIMAL / COUNT(*)) * 100, 2) as rate
-- FROM packages;
