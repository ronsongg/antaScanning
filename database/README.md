# Supabase 数据库配置指南

## 📝 快速开始

### 1. 创建 Supabase 项目

1. 访问 [https://supabase.com](https://supabase.com)
2. 点击 **"Start your project"** 或 **"New Project"**
3. 填写项目信息：
   - **Project Name**: `anta-scanning-system`（或任意名称）
   - **Database Password**: 设置一个强密码（保存好！）
   - **Region**: 选择离你最近的区域
     - 中国用户建议：`Singapore` 或 `Tokyo`
4. 点击 **"Create new project"**
5. 等待约 2-3 分钟完成初始化

### 2. 创建数据库表

#### 方法 A：使用 SQL 编辑器（推荐）

1. 在左侧菜单点击 **SQL Editor**
2. 点击 **"+ New query"**
3. 复制 `supabase-schema.sql` 文件的全部内容
4. 粘贴到编辑器中
5. 点击右下角 **"Run"** 按钮执行
6. 看到 ✅ **"Success. No rows returned"** 即成功

#### 方法 B：使用表格编辑器

1. 在左侧菜单点击 **Table Editor**
2. 点击 **"Create a new table"**
3. 配置如下：

**表名**: `packages`

**列配置**:
| 列名 | 类型 | 默认值 | 其他 |
|------|------|--------|------|
| id | uuid | gen_random_uuid() | 主键 |
| tracking_number | text | - | 唯一 |
| zone | text | - | - |
| store_name | text | - | - |
| status | text | 'pending' | - |
| is_empty_tracking | bool | false | - |
| imported_at | timestamptz | now() | - |
| scanned_at | timestamptz | - | 可空 |
| created_at | timestamptz | now() | - |
| updated_at | timestamptz | now() | - |
| operator_id | text | - | 可空 |

4. 点击 **"Save"**
5. 然后执行 `supabase-schema.sql` 中的索引和触发器部分

### 3. 配置 API 密钥

1. 在左侧菜单点击 **Settings** ⚙️
2. 点击 **API**
3. 找到以下信息：

```
Project URL: https://xxxxx.supabase.co
anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. 配置前端连接

编辑项目中的 `services/supabaseClient.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://你的项目ID.supabase.co';
const supabaseAnonKey = '你的anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const TABLES = {
  PACKAGES: 'packages'
};
```

### 5. 启用实时订阅（可选但推荐）

1. 在左侧菜单点击 **Database**
2. 点击 **Replication** 标签
3. 找到 `packages` 表
4. 开启 **"Enable replication"** 开关
5. 这样多个设备可以实时同步数据

### 6. 配置 Row Level Security（生产环境）

**开发环境（当前配置）**: 允许所有人访问

**生产环境建议**: 添加认证

```sql
-- 删除开放策略
DROP POLICY "Enable read access for all users" ON packages;
DROP POLICY "Enable insert access for all users" ON packages;
DROP POLICY "Enable update access for all users" ON packages;
DROP POLICY "Enable delete access for all users" ON packages;

-- 创建认证用户策略
CREATE POLICY "Authenticated users can read"
ON packages FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert"
ON packages FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update"
ON packages FOR UPDATE
TO authenticated
USING (true);
```

## 🔧 数据库管理

### 查看数据

1. 点击 **Table Editor**
2. 选择 `packages` 表
3. 可以直接查看、编辑、删除数据

### 查看统计

在 SQL Editor 中运行：

```sql
SELECT * FROM packages_daily_stats;
```

### 清空数据（谨慎操作！）

```sql
TRUNCATE TABLE packages;
```

### 备份数据

1. 点击 **Database** → **Backups**
2. 点击 **"Enable automatic backups"**（付费功能）
3. 或手动导出：SQL Editor → 运行查询 → 导出 CSV

## 📊 表结构说明

### packages 表

| 字段 | 说明 | 示例 |
|------|------|------|
| id | 主键（自动生成） | `a1b2c3d4-...` |
| tracking_number | 快递单号（唯一） | `SF1234567890` |
| zone | 分拣分区 | `10-1`, `A-08` |
| store_name | 目的地门店 | `北京朝阳店` |
| status | 状态 | `pending` / `scanned` |
| is_empty_tracking | 是否空单号 | `true` / `false` |
| imported_at | 导入时间 | `2026-02-06 15:30:00` |
| scanned_at | 扫描时间 | `2026-02-06 16:00:00` |
| operator_id | 操作员ID | `user_001` |

### 索引说明

- `tracking_number`: 单号查询（扫描时）
- `status`: 状态筛选（查看待扫描）
- `zone`: 分区查询
- `imported_at`: 日期筛选
- `scanned_at`: 扫描时间排序

## 🚀 性能优化

### 查询优化

- ✅ 使用索引字段查询
- ✅ 使用 `packages_daily_stats` 视图获取统计
- ✅ 限制返回数量 `.limit(1000)`

### 连接优化

- ✅ 使用 Supabase CDN
- ✅ 启用连接池
- ✅ 使用离线优先架构（已实现）

## 🔒 安全建议

### 开发环境
- ✅ 使用 `anon` 密钥
- ✅ 开放 RLS 策略

### 生产环境
- ⚠️ 使用认证系统
- ⚠️ 限制 RLS 策略
- ⚠️ 开启 SSL
- ⚠️ 定期备份
- ⚠️ 监控 API 使用量

## 📈 监控

1. **Database** → **Usage**: 查看数据库大小
2. **API** → **Logs**: 查看 API 调用日志
3. **Database** → **Query Performance**: 查看慢查询

## 🆘 常见问题

### Q: 连接失败？
A: 检查 `supabaseUrl` 和 `supabaseAnonKey` 是否正确

### Q: RLS 阻止访问？
A: 确认已创建正确的 RLS 策略

### Q: 实时订阅不工作？
A: 确认已启用 Replication

### Q: 查询慢？
A: 检查是否使用了索引字段

## 📚 相关文档

- [Supabase 官方文档](https://supabase.com/docs)
- [PostgreSQL 文档](https://www.postgresql.org/docs/)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
