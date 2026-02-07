/**
 * PC端统计卡片组件
 */

import React from 'react';
import { DashboardStats } from '../types';

interface Props {
  stats: DashboardStats;
  onMenuClick: () => void;
  onViewData?: () => void;
  onExport?: () => void;
  theme: 'light' | 'dark';
}

export function DesktopStatsPanel({ stats, onMenuClick, onViewData, onExport, theme }: Props) {
  const isDark = theme === 'dark';

  return (
    <>
      {/* Logo & Menu Card */}
      <div style={{
        background: isDark ? '#1a1a2e' : 'white',
        borderRadius: '16px',
        padding: '1.5rem',
        boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.1)',
        border: isDark ? '1px solid rgba(255,255,255,0.1)' : 'none'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem'
        }}>
          <h1 style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color: isDark ? '#ffffff' : '#1a202c',
            margin: 0
          }}>
            安踏扫描系统
          </h1>
          <button
            onClick={onMenuClick}
            style={{
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#5568d3'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#667eea'}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>
        <p style={{
          fontSize: '0.875rem',
          color: isDark ? 'rgba(255,255,255,0.6)' : '#6b7280',
          margin: 0
        }}>
          实时扫描统计面板
        </p>
      </div>

      {/* Progress Card */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea, #764ba2)',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
        color: 'white'
      }}>
        <div style={{
          fontSize: '3rem',
          fontWeight: 'bold',
          marginBottom: '0.5rem',
          fontFamily: 'monospace'
        }}>
          {stats.progress}%
        </div>
        <div style={{
          fontSize: '0.875rem',
          opacity: 0.9,
          marginBottom: '1.5rem'
        }}>
          扫描进度
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '999px',
          height: '12px',
          overflow: 'hidden',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            background: 'white',
            height: '100%',
            width: `${stats.progress}%`,
            borderRadius: '999px',
            transition: 'width 0.5s ease',
            boxShadow: '0 0 10px rgba(255,255,255,0.5)'
          }} />
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem',
          fontSize: '0.875rem'
        }}>
          <div>
            <div style={{ opacity: 0.8 }}>已扫描</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'monospace' }}>
              {stats.scanned}
            </div>
          </div>
          <div>
            <div style={{ opacity: 0.8 }}>待扫描</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'monospace' }}>
              {stats.pending}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Card */}
      <div style={{
        background: isDark ? '#1a1a2e' : 'white',
        borderRadius: '16px',
        padding: '1.5rem',
        boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.1)',
        border: isDark ? '1px solid rgba(255,255,255,0.1)' : 'none'
      }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: isDark ? '#ffffff' : '#1a202c',
          marginBottom: '1rem'
        }}>
          统计信息
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.75rem',
            background: isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb',
            borderRadius: '8px',
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : 'none'
          }}>
            <span style={{ fontSize: '0.875rem', color: isDark ? 'rgba(255,255,255,0.6)' : '#6b7280' }}>总计</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: isDark ? '#ffffff' : '#1a202c', fontFamily: 'monospace' }}>
              {stats.total}
            </span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.75rem',
            background: isDark ? 'rgba(16, 185, 129, 0.1)' : '#d1fae5',
            borderRadius: '8px',
            border: isDark ? '1px solid rgba(16, 185, 129, 0.3)' : 'none'
          }}>
            <span style={{ fontSize: '0.875rem', color: isDark ? '#10b981' : '#065f46' }}>已扫描</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: isDark ? '#10b981' : '#065f46', fontFamily: 'monospace' }}>
              {stats.scanned}
            </span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.75rem',
            background: isDark ? 'rgba(245, 158, 11, 0.1)' : '#fef3c7',
            borderRadius: '8px',
            border: isDark ? '1px solid rgba(245, 158, 11, 0.3)' : 'none'
          }}>
            <span style={{ fontSize: '0.875rem', color: isDark ? '#f59e0b' : '#92400e' }}>待扫描</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: isDark ? '#f59e0b' : '#92400e', fontFamily: 'monospace' }}>
              {stats.pending}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{
        background: isDark ? '#1a1a2e' : 'white',
        borderRadius: '16px',
        padding: '1.5rem',
        boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.1)',
        border: isDark ? '1px solid rgba(255,255,255,0.1)' : 'none'
      }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: isDark ? '#ffffff' : '#1a202c',
          marginBottom: '1rem'
        }}>
          快捷操作
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {onViewData && (
            <button
              onClick={onViewData}
              style={{
                padding: '0.875rem',
                background: isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb',
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : '#f3f4f6';
                e.currentTarget.style.borderColor = '#667eea';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb';
                e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb';
              }}
            >
              <span className="material-symbols-outlined" style={{ color: '#667eea' }}>visibility</span>
              <span style={{ fontSize: '0.875rem', fontWeight: '500', color: isDark ? '#ffffff' : '#1a202c' }}>
                查看数据
              </span>
            </button>
          )}
          {onExport && (
            <button
              onClick={onExport}
              style={{
                padding: '0.875rem',
                background: isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb',
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : '#f3f4f6';
                e.currentTarget.style.borderColor = '#667eea';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb';
                e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb';
              }}
            >
              <span className="material-symbols-outlined" style={{ color: '#667eea' }}>download</span>
              <span style={{ fontSize: '0.875rem', fontWeight: '500', color: isDark ? '#ffffff' : '#1a202c' }}>
                导出报表
              </span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
