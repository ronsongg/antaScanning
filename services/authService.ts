/**
 * 认证服务
 * 处理登录、登出、会话管理等功能
 */

import { supabase } from './supabaseClient';
import { hashPassword, verifyPassword, generateToken, verifyToken } from './cryptoService';
import type { User, AuthToken, LoginCredentials, JWTPayload } from '../types';

const TOKEN_KEY = 'auth_token';
const LOCKOUT_KEY = 'login_lockout';
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15分钟（毫秒）

/**
 * 检查是否被锁定
 */
function checkLockout(): { locked: boolean; remainingTime?: number } {
  const lockoutData = localStorage.getItem(LOCKOUT_KEY);
  if (!lockoutData) {
    return { locked: false };
  }

  const { until, attempts } = JSON.parse(lockoutData);
  const now = Date.now();

  if (now < until) {
    return {
      locked: true,
      remainingTime: Math.ceil((until - now) / 1000 / 60) // 剩余分钟数
    };
  }

  // 锁定时间已过，清除锁定
  localStorage.removeItem(LOCKOUT_KEY);
  return { locked: false };
}

/**
 * 记录登录失败
 */
function recordFailedAttempt() {
  const lockoutData = localStorage.getItem(LOCKOUT_KEY);
  let attempts = 0;

  if (lockoutData) {
    const data = JSON.parse(lockoutData);
    attempts = data.attempts || 0;
  }

  attempts++;

  if (attempts >= MAX_FAILED_ATTEMPTS) {
    const until = Date.now() + LOCKOUT_DURATION;
    localStorage.setItem(LOCKOUT_KEY, JSON.stringify({ attempts, until }));
    throw new Error(`登录失败次数过多，账号已锁定 ${LOCKOUT_DURATION / 1000 / 60} 分钟`);
  } else {
    localStorage.setItem(LOCKOUT_KEY, JSON.stringify({ attempts, until: null }));
  }
}

/**
 * 清除失败记录
 */
function clearFailedAttempts() {
  localStorage.removeItem(LOCKOUT_KEY);
}

/**
 * 用户登录
 * @param credentials 登录凭证
 * @returns 包含 token 和用户信息的对象
 */
export async function login(credentials: LoginCredentials): Promise<AuthToken> {
  // 检查是否被锁定
  const lockout = checkLockout();
  if (lockout.locked) {
    throw new Error(`账号已锁定，请在 ${lockout.remainingTime} 分钟后重试`);
  }

  try {
    // 从数据库查询用户
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', credentials.username)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      console.warn('Login lookup failed:', error);
      recordFailedAttempt();
      throw new Error('用户名或密码错误');
    }

    // 验证密码
    const isValid = await verifyPassword(credentials.password, data.password_hash);
    if (!isValid) {
      recordFailedAttempt();
      throw new Error('用户名或密码错误');
    }

    // 清除失败记录
    clearFailedAttempts();

    // 更新最后登录时间
    await updateLastLogin(data.id);

    // 生成 token（现在是异步的）
    const token = await generateToken(data as User);

    // 移除密码哈希
    const { password_hash, ...userWithoutHash } = data;

    // 存储到 LocalStorage
    localStorage.setItem(TOKEN_KEY, token);

    return {
      token,
      user: userWithoutHash as Omit<User, 'password_hash'>
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('登录失败，请稍后重试');
  }
}

/**
 * 用户登出
 */
export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
  clearFailedAttempts();
}

/**
 * 获取当前用户
 * @returns 当前登录的用户信息，未登录返回 null
 */
export async function getCurrentUser(): Promise<Omit<User, 'password_hash'> | null> {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    return null;
  }

  const payload = await verifyToken(token);
  if (!payload) {
    // Token 无效，清除
    logout();
    return null;
  }

  return {
    id: payload.userId,
    username: payload.username,
    display_name: payload.displayName,
    created_at: '',
    created_by: null,
    last_login_at: null,
    is_active: true
  };
}

/**
 * 修改密码
 * @param oldPassword 旧密码
 * @param newPassword 新密码
 */
export async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new Error('未登录');
  }

  // 验证新密码强度
  if (newPassword.length < 6) {
    throw new Error('密码长度至少为 6 位');
  }

  // 从数据库获取完整用户信息（包含密码哈希）
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', currentUser.id)
    .single();

  if (error || !data) {
    throw new Error('用户不存在');
  }

  // 验证旧密码
  const isValid = await verifyPassword(oldPassword, data.password_hash);
  if (!isValid) {
    throw new Error('旧密码错误');
  }

  // 生成新密码哈希
  const newHash = await hashPassword(newPassword);

  // 更新数据库
  const { error: updateError } = await supabase
    .from('users')
    .update({ password_hash: newHash })
    .eq('id', currentUser.id);

  if (updateError) {
    throw new Error('修改密码失败');
  }
}

/**
 * 验证 token 是否有效
 * @returns 是否有效
 */
export async function validateToken(): Promise<boolean> {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    return false;
  }

  const payload = await verifyToken(token);
  return payload !== null;
}

/**
 * 更新最后登录时间
 * @param userId 用户ID
 */
async function updateLastLogin(userId: string): Promise<void> {
  await supabase
    .from('users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', userId);
}

/**
 * 获取存储的 token
 */
export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
