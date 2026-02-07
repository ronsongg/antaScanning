/**
 * 用户管理页面
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import * as userService from '../services/userService';
import type { User } from '../types';

export function UserManagement() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<Omit<User, 'password_hash'>[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    displayName: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 加载用户列表
  const loadUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = searchTerm
        ? await userService.searchUsers(searchTerm)
        : await userService.listUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载用户列表失败');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [searchTerm]);

  // 添加用户
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsSubmitting(true);
    try {
      await userService.createUser(
        newUser.username,
        newUser.displayName,
        newUser.password,
        currentUser.id
      );
      setShowAddModal(false);
      setNewUser({ username: '', displayName: '', password: '' });
      await loadUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : '创建用户失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 切换用户状态
  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    if (!confirm(`确定要${currentStatus ? '禁用' : '启用'}该用户吗？`)) return;

    try {
      await userService.toggleUserStatus(userId, !currentStatus);
      await loadUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : '操作失败');
    }
  };

  // 删除用户
  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`确定要删除用户 "${username}" 吗？此操作不可恢复！`)) return;

    try {
      await userService.deleteUser(userId);
      await loadUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败');
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1a202c', margin: 0 }}>
          用户管理
        </h1>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '0.875rem'
          }}
        >
          + 添加用户
        </button>
      </div>

      {/* 搜索框 */}
      <div style={{ marginBottom: '1.5rem' }}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="搜索用户名或显示名称..."
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '0.875rem'
          }}
        />
      </div>

      {/* 错误提示 */}
      {error && (
        <div style={{
          padding: '1rem',
          background: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '6px',
          marginBottom: '1rem',
          color: '#dc2626'
        }}>
          {error}
        </div>
      )}

      {/* 用户列表 */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
          加载中...
        </div>
      ) : users.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
          暂无用户
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>用户名</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>显示名称</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>创建时间</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>最后登录</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>状态</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#1f2937' }}>{user.username}</td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#1f2937' }}>{user.display_name}</td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                    {new Date(user.created_at).toLocaleString('zh-CN')}
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                    {user.last_login_at ? new Date(user.last_login_at).toLocaleString('zh-CN') : '未登录'}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      background: user.is_active ? '#d1fae5' : '#fee2e2',
                      color: user.is_active ? '#065f46' : '#991b1b'
                    }}>
                      {user.is_active ? '启用' : '禁用'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <button
                      onClick={() => handleToggleStatus(user.id, user.is_active)}
                      style={{
                        marginRight: '0.5rem',
                        padding: '0.375rem 0.75rem',
                        background: user.is_active ? '#fbbf24' : '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.75rem'
                      }}
                    >
                      {user.is_active ? '禁用' : '启用'}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id, user.username)}
                      disabled={user.username === 'admin'}
                      style={{
                        padding: '0.375rem 0.75rem',
                        background: user.username === 'admin' ? '#d1d5db' : '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: user.username === 'admin' ? 'not-allowed' : 'pointer',
                        fontSize: '0.75rem'
                      }}
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 添加用户模态框 */}
      {showAddModal && (
        <div
          role="dialog"
          style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '500px'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
              添加新用户
            </h2>
            <form onSubmit={handleAddUser}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                  用户名
                </label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px'
                  }}
                  required
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                  显示名称
                </label>
                <input
                  type="text"
                  value={newUser.displayName}
                  onChange={(e) => setNewUser({ ...newUser, displayName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px'
                  }}
                  required
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                  密码
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px'
                  }}
                  required
                  minLength={6}
                />
                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  密码至少 6 位
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewUser({ username: '', displayName: '', password: '' });
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#e5e7eb',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: isSubmitting ? '#9ca3af' : '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSubmitting ? '创建中...' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
