/**
 * 密码哈希生成工具页面
 */

import React, { useState } from 'react';

export function PasswordHashGenerator() {
  const [password, setPassword] = useState('admin123');
  const [hash, setHash] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateHash = async () => {
    setIsGenerating(true);
    try {
      const encoder = new TextEncoder();
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');

      const passwordBuffer = encoder.encode(password);
      const keyMaterial = await crypto.subtle.importKey('raw', passwordBuffer, 'PBKDF2', false, ['deriveBits']);
      const hashBuffer = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' },
        keyMaterial,
        256
      );

      const hashArray = new Uint8Array(hashBuffer);
      const hashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
      const fullHash = `${saltHex}:${hashHex}`;

      setHash(fullHash);
    } catch (err) {
      alert('生成失败：' + (err instanceof Error ? err.message : '未知错误'));
    } finally {
      setIsGenerating(false);
    }
  };

  const copySQL = () => {
    const sql = `UPDATE users SET password_hash = '${hash}' WHERE username = 'admin';`;
    navigator.clipboard.writeText(sql).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{
      padding: '2rem',
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1a202c' }}>
        🔐 密码哈希生成工具
      </h1>

      <div style={{
        background: '#fef3c7',
        border: '1px solid #fbbf24',
        borderRadius: '8px',
        padding: '1rem',
        marginBottom: '2rem'
      }}>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#78350f' }}>
          ⚠️ <strong>重要：</strong>这是用于生成管理员密码哈希的工具。生成后需要在 Supabase 中执行 SQL 更新数据库。
        </p>
      </div>

      <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        {/* 密码输入 */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '500',
            marginBottom: '0.5rem',
            color: '#374151'
          }}>
            输入密码
          </label>
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '1rem'
            }}
            placeholder="admin123"
          />
        </div>

        {/* 生成按钮 */}
        <button
          onClick={generateHash}
          disabled={isGenerating || !password}
          style={{
            width: '100%',
            padding: '0.875rem',
            background: isGenerating ? '#9ca3af' : '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: isGenerating || !password ? 'not-allowed' : 'pointer',
            marginBottom: '2rem'
          }}
        >
          {isGenerating ? '生成中...' : '生成密码哈希'}
        </button>

        {/* 结果显示 */}
        {hash && (
          <>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                marginBottom: '0.5rem',
                color: '#374151'
              }}>
                密码哈希（复制到数据库）
              </label>
              <div style={{
                padding: '1rem',
                background: '#f3f4f6',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                wordBreak: 'break-all',
                border: '1px solid #d1d5db'
              }}>
                {hash}
              </div>
            </div>

            <div style={{
              marginBottom: '1.5rem',
              padding: '1rem',
              background: '#e0e7ff',
              borderRadius: '6px',
              border: '1px solid #818cf8'
            }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                marginBottom: '0.5rem',
                color: '#3730a3'
              }}>
                在 Supabase SQL Editor 中执行以下 SQL：
              </label>
              <div style={{
                padding: '1rem',
                background: '#1e1e1e',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                color: '#00ff00',
                wordBreak: 'break-all'
              }}>
                UPDATE users SET password_hash = '{hash}' WHERE username = 'admin';
              </div>
            </div>

            <button
              onClick={copySQL}
              style={{
                width: '100%',
                padding: '0.875rem',
                background: copied ? '#10b981' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              {copied ? '✓ 已复制 SQL 语句' : '复制 SQL 语句'}
            </button>
          </>
        )}
      </div>

      {/* 使用步骤 */}
      <div style={{
        marginTop: '2rem',
        padding: '1.5rem',
        background: '#f9fafb',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#1a202c' }}>
          📋 使用步骤
        </h2>
        <ol style={{ margin: 0, paddingLeft: '1.5rem', color: '#4b5563', lineHeight: '1.8' }}>
          <li>确保密码输入框中是 <code>admin123</code>（或你想设置的密码）</li>
          <li>点击 "生成密码哈希" 按钮</li>
          <li>点击 "复制 SQL 语句" 按钮</li>
          <li>打开 Supabase Dashboard → SQL Editor</li>
          <li>粘贴并执行 SQL 语句</li>
          <li>返回登录页面，使用 admin/admin123 登录</li>
        </ol>
      </div>
    </div>
  );
}
