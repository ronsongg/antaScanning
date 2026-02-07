# 用户系统设计方案

**项目**：安踏扫描系统
**日期**：2026-02-07
**类型**：团队协作模式 - 权限管理 + 操作追踪，数据共享

---

## 设计目标

为扫描系统添加用户认证和操作追踪功能：
- 所有用户权限相同（无角色区分）
- 记录每个操作的执行者
- 简单密码认证系统
- 管理员可创建/管理其他用户账号
- 数据存储在 Supabase

---

## 一、数据库设计

### 1.1 新增 users 表

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    last_login_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_is_active ON users(is_active);
```

### 1.2 更新 packages 表

```sql
-- 将 operator_id 改为 UUID 类型，关联到 users 表
ALTER TABLE packages
ALTER COLUMN operator_id TYPE UUID USING operator_id::uuid;

ALTER TABLE packages
ADD CONSTRAINT fk_operator
FOREIGN KEY (operator_id) REFERENCES users(id);
```

### 1.3 预设管理员账号

```sql
-- 插入默认管理员账号（密码：admin123）
INSERT INTO users (username, password_hash, display_name)
VALUES (
    'admin',
    -- 这里是 'admin123' 的哈希值（实现时生成）
    '{HASHED_PASSWORD}',
    '系统管理员'
);
```

### 1.4 更新 RLS 策略

```sql
-- 删除旧的公开访问策略
DROP POLICY "Enable read access for all users" ON packages;
DROP POLICY "Enable insert access for all users" ON packages;
DROP POLICY "Enable update access for all users" ON packages;
DROP POLICY "Enable delete access for all users" ON packages;

-- 新增：仅认证用户可访问（通过自定义验证）
-- 注意：由于使用自定义 JWT，不使用 Supabase Auth，策略保持简单
CREATE POLICY "Authenticated users can access packages"
ON packages FOR ALL
USING (true);

-- users 表策略
CREATE POLICY "Authenticated users can read users"
ON users FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create users"
ON users FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update users"
ON users FOR UPDATE
USING (true);
```

---

## 二、认证流程

### 2.1 登录流程

```
用户输入用户名/密码
  ↓
验证密码哈希
  ↓
生成 JWT token（有效期 7 天）
  ↓
返回 token + 用户信息
  ↓
存储到 LocalStorage
```

### 2.2 会话保持

```
应用启动
  ↓
检查 LocalStorage 中的 token
  ↓
验证 token 有效性
  ↓
有效？自动登录 : 显示登录页
```

### 2.3 登出流程

```
用户点击登出
  ↓
清除 LocalStorage token
  ↓
重定向到登录页
```

---

## 三、安全措施

### 3.1 密码加密

使用 **Web Crypto API** 实现 PBKDF2 算法：
- 迭代次数：100,000
- 哈希算法：SHA-256
- 盐值：随机生成，存储在哈希中
- 格式：`salt:hash`

### 3.2 JWT Token

```typescript
// Token payload
{
  userId: string,
  username: string,
  displayName: string,
  iat: number,  // 签发时间
  exp: number   // 过期时间（7天后）
}
```

### 3.3 防暴力破解

- 本地记录登录失败次数
- 连续失败 5 次 → 锁定 15 分钟
- 锁定信息存储在 LocalStorage

---

## 四、前端组件

### 4.1 新增组件

**LoginPage.tsx** - 登录页面
- 用户名输入框
- 密码输入框（显示/隐藏切换）
- "记住我"选项（可选）
- 登录按钮
- 错误提示信息

**UserManagement.tsx** - 用户管理
- 用户列表表格（用户名、显示名称、创建时间、最后登录、状态）
- 添加用户按钮 → 弹出表单
- 启用/禁用用户开关
- 删除用户按钮（确认对话框）
- 搜索框（按用户名/显示名称）

**UserProfile.tsx** - 个人信息
- 显示当前用户信息
- 修改密码表单
- 登出按钮

**ProtectedRoute.tsx** - 路由保护
- 检查登录状态
- 未登录 → 显示 LoginPage
- 已登录 → 显示子组件

### 4.2 更新现有组件

**DashboardHeader.tsx**
- 右上角显示当前用户名
- 点击用户名 → 显示下拉菜单（个人信息、登出）

**Sidebar.tsx**
- 添加"用户管理"菜单项

**ScanHistory.tsx**
- 显示每条记录的操作员名称

**DataViewer.tsx**
- 表格中添加"操作员"列

---

## 五、服务层

### 5.1 cryptoService.ts

```typescript
// 密码哈希
hashPassword(password: string): Promise<string>

// 验证密码
verifyPassword(password: string, hash: string): Promise<boolean>

// 生成 JWT
generateToken(user: User): string

// 验证 JWT
verifyToken(token: string): User | null
```

### 5.2 authService.ts

```typescript
// 登录
login(username: string, password: string): Promise<{token: string, user: User}>

// 登出
logout(): void

// 获取当前用户
getCurrentUser(): User | null

// 修改密码
changePassword(oldPassword: string, newPassword: string): Promise<void>

// 验证 token
validateToken(): boolean
```

### 5.3 userService.ts

```typescript
// 创建用户
createUser(username: string, displayName: string, password: string): Promise<User>

// 获取用户列表
listUsers(): Promise<User[]>

// 切换用户状态
toggleUserStatus(userId: string, isActive: boolean): Promise<void>

// 删除用户
deleteUser(userId: string): Promise<void>

// 更新最后登录时间
updateLastLogin(userId: string): Promise<void>
```

---

## 六、Hooks

### 6.1 useAuth Hook

```typescript
interface UseAuthReturn {
  isAuthenticated: boolean;
  currentUser: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  isLoading: boolean;
}
```

**功能：**
- 管理全局登录状态
- 自动从 LocalStorage 恢复会话
- Token 过期自动登出

### 6.2 更新 useScanner Hook

```typescript
// 在 handleScan 中添加
const { currentUser } = useAuth();

// 扫描时关联操作员
await supabase
  .from('packages')
  .update({
    status: 'scanned',
    scanned_at: new Date().toISOString(),
    operator_id: currentUser?.id  // 关联当前用户
  })
  .eq('tracking_number', trackingNumber);
```

---

## 七、数据流

### 7.1 应用启动流程

```
App.tsx 加载
  ↓
useAuth 初始化
  ↓
检查 LocalStorage token
  ↓
token 有效？
  ├─ 是 → 解析用户信息 → 显示主界面（App）
  └─ 否 → 显示登录页（LoginPage）
```

### 7.2 扫描操作流程

```
用户扫描条形码
  ↓
handleScan() 触发
  ↓
获取 currentUser.id
  ↓
更新 package.operator_id = currentUser.id
  ↓
同步到 Supabase
  ↓
记录到 IndexedDB（离线支持）
  ↓
更新界面显示
```

### 7.3 用户管理流程

```
点击"添加用户"
  ↓
输入用户名、显示名称、密码
  ↓
cryptoService.hashPassword()
  ↓
userService.createUser()
  ↓
插入 Supabase users 表
  ↓
刷新用户列表
  ↓
显示成功提示
```

---

## 八、错误处理

### 8.1 登录失败

- 显示："用户名或密码错误"
- 不泄露具体错误原因（安全）
- 失败 5 次 → 锁定 15 分钟

### 8.2 Token 过期

- 自动清除 LocalStorage
- 提示："会话已过期，请重新登录"
- 跳转到登录页

### 8.3 网络错误

- 离线模式禁用用户管理
- 扫描功能继续工作（IndexedDB）
- 显示"离线模式"标识

### 8.4 创建用户失败

- 用户名已存在 → "用户名已被使用"
- 密码太弱 → "密码至少 6 位"
- 网络错误 → "创建失败，请检查网络"

---

## 九、实现步骤

### Step 1: 数据库准备
1. 创建 `users` 表和索引
2. 更新 `packages` 表的 `operator_id` 类型
3. 创建预设管理员账号
4. 更新 RLS 策略

### Step 2: 后端服务
1. 实现 `cryptoService.ts`（密码哈希、JWT）
2. 实现 `authService.ts`（登录/登出/token）
3. 实现 `userService.ts`（用户 CRUD）

### Step 3: 认证系统
1. 创建 `useAuth` hook
2. 实现 JWT token 生成和验证
3. LocalStorage 会话管理

### Step 4: 前端组件
1. 创建 `LoginPage.tsx`
2. 创建 `UserManagement.tsx`
3. 创建 `UserProfile.tsx`
4. 创建 `ProtectedRoute.tsx`
5. 更新 `Sidebar.tsx`（添加用户管理入口）

### Step 5: 集成与测试
1. 更新 `App.tsx`（添加认证路由）
2. 更新 `useScanner`（关联操作员）
3. 更新 `ScanHistory`（显示操作员）
4. 更新 `DataViewer`（显示操作员）
5. 测试完整流程

---

## 十、新增依赖

```json
{
  "dependencies": {
    "jsonwebtoken": "^9.0.2",
    "jwt-decode": "^4.0.0"
  }
}
```

---

## 十一、文件结构

```
扫描系统/
├── components/
│   ├── LoginPage.tsx          # 新增
│   ├── UserManagement.tsx     # 新增
│   ├── UserProfile.tsx        # 新增
│   └── ProtectedRoute.tsx     # 新增
├── hooks/
│   └── useAuth.ts             # 新增
├── services/
│   ├── authService.ts         # 新增
│   ├── userService.ts         # 新增
│   └── cryptoService.ts       # 新增
├── database/
│   └── user-system-schema.sql # 新增
├── types.ts                   # 更新（添加 User 类型）
└── App.tsx                    # 更新（添加认证路由）
```

---

## 十二、类型定义

```typescript
// types.ts 新增
export interface User {
  id: string;
  username: string;
  password_hash: string;
  display_name: string;
  created_at: string;
  created_by: string | null;
  last_login_at: string | null;
  is_active: boolean;
}

export interface AuthToken {
  token: string;
  user: Omit<User, 'password_hash'>;
}

export interface LoginCredentials {
  username: string;
  password: string;
}
```

---

## 十三、后续优化（可选）

- [ ] 密码强度验证（至少 8 位，包含字母+数字）
- [ ] 密码修改历史（防止重复使用旧密码）
- [ ] 操作日志记录（谁在什么时间做了什么）
- [ ] 导出报告时包含操作员签名
- [ ] 用户头像上传
- [ ] 多语言支持

---

**设计完成时间**：2026-02-07
**预计实现时间**：4-6 小时
