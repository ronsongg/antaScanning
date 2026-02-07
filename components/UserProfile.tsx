/**
 * 用户个人信息页面
 */

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function UserProfile() {
  const { currentUser, logout, changePassword } = useAuth();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwords, setPasswords] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage({ type: 'error', text: '两次输入的新密码不一致' });
      return;
    }

    if (passwords.newPassword.length < 6) {
      setMessage({ type: 'error', text: '新密码至少 6 位' });
      return;
    }

    setIsSubmitting(true);
    try {
      await changePassword(passwords.oldPassword, passwords.newPassword);
      setMessage({ type: 'success', text: '密码修改成功' });
      setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setShowChangePassword(false);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : '修改密码失败'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem', color: '#1a202c' }}>
        个人信息
      </h1>

      {/* 用户信息卡片 */}
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '2rem',
        marginBottom: '1.5rem',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
            用户名
          </label>
          <div style={{ fontSize: '1rem', fontWeight: '500', color: '#1f2937' }}>
            {currentUser.username}
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
            显示名称
          </label>
          <div style={{ fontSize: '1rem', fontWeight: '500', color: '#1f2937' }}>
            {currentUser.display_name}
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
            用户ID
          </label>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', fontFamily: 'monospace' }}>
            {currentUser.id}
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
            最后登录
          </label>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            {currentUser.last_login_at
              ? new Date(currentUser.last_login_at).toLocaleString('zh-CN')
              : '未记录'}
          </div>
        </div>
      </div>

      {/* 修改密码区域 */}
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '2rem',
        marginBottom: '1.5rem',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1a202c' }}>
            密码管理
          </h2>
          {!showChangePassword && (
            <button
              onClick={() => setShowChangePassword(true)}
              style={{
                padding: '0.5rem 1rem',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              修改密码
            </button>
          )}
        </div>

        {showChangePassword && (
          <form onSubmit={handleChangePassword}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                旧密码
              </label>
              <input
                type="password"
                value={passwords.oldPassword}
                onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })}
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
                新密码
              </label>
              <input
                type="password"
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px'
                }}
                required
                minLength={6}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                确认新密码
              </label>
              <input
                type="password"
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px'
                }}
                required
                minLength={6}
              />
            </div>

            {message && (
              <div style={{
                padding: '0.75rem',
                borderRadius: '6px',
                marginBottom: '1rem',
                background: message.type === 'success' ? '#d1fae5' : '#fee2e2',
                border: `1px solid ${message.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
                color: message.type === 'success' ? '#065f46' : '#dc2626',
                fontSize: '0.875rem'
              }}>
                {message.text}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => {
                  setShowChangePassword(false);
                  setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
                  setMessage(null);
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
                {isSubmitting ? '修改中...' : '确认修改'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 登出按钮 */}
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={() => {
            if (confirm('确定要退出登录吗？')) {
              logout();
            }
          }}
          style={{
            padding: '0.75rem 2rem',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}
        >
          退出登录
        </button>
      </div>
    </div>
  );
}
