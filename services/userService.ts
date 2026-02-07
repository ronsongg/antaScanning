/**
 * 用户管理服务
 * 处理用户的 CRUD 操作
 */

import { supabase } from './supabaseClient';
import { hashPassword } from './cryptoService';
import type { User } from '../types';

/**
 * 创建用户
 * @param username 用户名
 * @param displayName 显示名称
 * @param password 密码
 * @param createdBy 创建者ID
 * @returns 创建的用户对象（不含密码哈希）
 */
export async function createUser(
  username: string,
  displayName: string,
  password: string,
  createdBy: string
): Promise<Omit<User, 'password_hash'>> {
  // 验证输入
  if (!username || username.length < 3) {
    throw new Error('用户名至少 3 位');
  }

  if (!displayName) {
    throw new Error('显示名称不能为空');
  }

  if (!password || password.length < 6) {
    throw new Error('密码至少 6 位');
  }

  // 检查用户名是否已存在
  const { data: existing } = await supabase
    .from('users')
    .select('username')
    .eq('username', username)
    .single();

  if (existing) {
    throw new Error('用户名已被使用');
  }

  // 生成密码哈希
  const passwordHash = await hashPassword(password);

  // 插入数据库
  const { data, error } = await supabase
    .from('users')
    .insert({
      username,
      password_hash: passwordHash,
      display_name: displayName,
      created_by: createdBy,
      is_active: true
    })
    .select()
    .single();

  if (error) {
    console.error('创建用户失败:', error);
    throw new Error('创建用户失败');
  }

  // 移除密码哈希
  const { password_hash, ...userWithoutHash } = data;
  return userWithoutHash as Omit<User, 'password_hash'>;
}

/**
 * 获取用户列表
 * @param activeOnly 是否仅返回激活的用户
 * @returns 用户列表（不含密码哈希）
 */
export async function listUsers(activeOnly: boolean = false): Promise<Omit<User, 'password_hash'>[]> {
  let query = supabase
    .from('users')
    .select('id, username, display_name, created_at, created_by, last_login_at, is_active')
    .order('created_at', { ascending: false });

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('获取用户列表失败:', error);
    throw new Error('获取用户列表失败');
  }

  return data || [];
}

/**
 * 切换用户状态
 * @param userId 用户ID
 * @param isActive 新状态
 */
export async function toggleUserStatus(userId: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ is_active: isActive })
    .eq('id', userId);

  if (error) {
    console.error('更新用户状态失败:', error);
    throw new Error('更新用户状态失败');
  }
}

/**
 * 删除用户
 * @param userId 用户ID
 */
export async function deleteUser(userId: string): Promise<void> {
  // 检查是否有关联的包裹记录
  const { data: packages } = await supabase
    .from('packages')
    .select('id')
    .eq('operator_id', userId)
    .limit(1);

  if (packages && packages.length > 0) {
    throw new Error('该用户有关联的扫描记录，无法删除');
  }

  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);

  if (error) {
    console.error('删除用户失败:', error);
    throw new Error('删除用户失败');
  }
}

/**
 * 更新最后登录时间
 * @param userId 用户ID
 */
export async function updateLastLogin(userId: string): Promise<void> {
  await supabase
    .from('users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', userId);
}

/**
 * 根据ID获取用户信息
 * @param userId 用户ID
 * @returns 用户对象（不含密码哈希）
 */
export async function getUserById(userId: string): Promise<Omit<User, 'password_hash'> | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id, username, display_name, created_at, created_by, last_login_at, is_active')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * 搜索用户
 * @param searchTerm 搜索关键词（用户名或显示名称）
 * @returns 匹配的用户列表
 */
export async function searchUsers(searchTerm: string): Promise<Omit<User, 'password_hash'>[]> {
  if (!searchTerm) {
    return listUsers();
  }

  const { data, error } = await supabase
    .from('users')
    .select('id, username, display_name, created_at, created_by, last_login_at, is_active')
    .or(`username.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('搜索用户失败:', error);
    throw new Error('搜索用户失败');
  }

  return data || [];
}
