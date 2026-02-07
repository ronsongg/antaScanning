/**
 * PC端布局包装器
 * 提供三列布局：统计卡片 | 主扫描区 | 历史记录
 */

import React, { ReactNode } from 'react';

interface DesktopLayoutProps {
  stats: ReactNode;
  scanner: ReactNode;
  display: ReactNode;
  history: ReactNode;
  connectionStatus: 'online' | 'offline' | 'syncing';
  theme: 'light' | 'dark';
}

export function DesktopLayout({
  stats,
  scanner,
  display,
  history,
  connectionStatus,
  theme
}: DesktopLayoutProps) {
  const isDark = theme === 'dark';

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '320px 1fr 380px',
      gap: '1.5rem',
      height: '100vh',
      padding: '1.5rem',
      background: isDark
        ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      overflow: 'hidden'
    }}>
      {/* 左侧：统计面板 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        overflow: 'auto'
      }}>
        {stats}
      </div>

      {/* 中间：主扫描区域 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        background: isDark ? '#1a1a2e' : 'white',
        borderRadius: '16px',
        boxShadow: isDark
          ? '0 20px 60px rgba(0,0,0,0.5)'
          : '0 20px 60px rgba(0,0,0,0.3)',
        overflow: 'hidden',
        border: isDark ? '1px solid rgba(255,255,255,0.1)' : 'none'
      }}>
        {/* 扫描输入区 */}
        <div style={{
          padding: '2rem',
          borderBottom: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e5e7eb',
          background: isDark
            ? 'rgba(255,255,255,0.02)'
            : 'linear-gradient(to bottom, #f9fafb, #ffffff)'
        }}>
          {scanner}
        </div>

        {/* 主显示区 */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isDark
            ? 'radial-gradient(circle at center, rgba(102, 126, 234, 0.1), transparent)'
            : 'radial-gradient(circle at center, rgba(102, 126, 234, 0.1), transparent)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {display}

          {/* 装饰性背景 */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '600px',
            height: '600px',
            background: isDark
              ? 'radial-gradient(circle, rgba(102, 126, 234, 0.08), transparent)'
              : 'radial-gradient(circle, rgba(102, 126, 234, 0.05), transparent)',
            borderRadius: '50%',
            pointerEvents: 'none',
            zIndex: 0
          }} />
        </div>

        {/* 状态栏 */}
        <div style={{
          padding: '1rem 2rem',
          borderTop: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e5e7eb',
          background: isDark ? 'rgba(255,255,255,0.02)' : '#f9fafb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: connectionStatus === 'online' ? '#10b981' :
                          connectionStatus === 'syncing' ? '#f59e0b' : '#ef4444',
              boxShadow: `0 0 8px ${connectionStatus === 'online' ? '#10b981' :
                                    connectionStatus === 'syncing' ? '#f59e0b' : '#ef4444'}`
            }} />
            <span style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: connectionStatus === 'online' ? '#10b981' :
                     connectionStatus === 'syncing' ? '#f59e0b' : '#ef4444'
            }}>
              {connectionStatus === 'online' ? '在线' :
               connectionStatus === 'syncing' ? '同步中' : '离线'}
            </span>
          </div>
          <span style={{
            fontSize: '0.75rem',
            color: isDark ? 'rgba(255,255,255,0.4)' : '#9ca3af'
          }}>
            安踏扫描系统 v1.0.0
          </span>
        </div>
      </div>

      {/* 右侧：扫描历史 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        background: isDark ? '#1a1a2e' : 'white',
        borderRadius: '16px',
        boxShadow: isDark
          ? '0 20px 60px rgba(0,0,0,0.5)'
          : '0 20px 60px rgba(0,0,0,0.3)',
        overflow: 'hidden',
        border: isDark ? '1px solid rgba(255,255,255,0.1)' : 'none'
      }}>
        {history}
      </div>
    </div>
  );
}
