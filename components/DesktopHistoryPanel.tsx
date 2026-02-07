/**
 * PC端扫描历史面板
 */

import React from 'react';
import { ScanResult } from '../types';

interface Props {
  history: ScanResult[];
  theme: 'light' | 'dark';
}

export function DesktopHistoryPanel({ history, theme }: Props) {
  const isDark = theme === 'dark';
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return { bg: '#d1fae5', text: '#065f46', icon: 'check_circle' };
      case 'duplicate': return { bg: '#fef3c7', text: '#92400e', icon: 'content_copy' };
      case 'error': return { bg: '#fee2e2', text: '#991b1b', icon: 'error' };
      default: return { bg: '#f3f4f6', text: '#6b7280', icon: 'help' };
    }
  };

  return (
    <>
      {/* Header */}
      <div style={{
        padding: '1.5rem',
        borderBottom: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e5e7eb',
        background: isDark ? 'rgba(255,255,255,0.02)' : '#f9fafb'
      }}>
        <h2 style={{
          fontSize: '1.125rem',
          fontWeight: 'bold',
          color: isDark ? '#ffffff' : '#1a202c',
          margin: '0 0 0.5rem 0'
        }}>
          扫描历史
        </h2>
        <p style={{
          fontSize: '0.875rem',
          color: isDark ? 'rgba(255,255,255,0.6)' : '#6b7280',
          margin: 0
        }}>
          最近 {history.length} 条记录
        </p>
      </div>

      {/* History List */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '1rem'
      }}>
        {history.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: isDark ? 'rgba(255,255,255,0.4)' : '#9ca3af'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '4rem', marginBottom: '1rem' }}>
              history
            </span>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>暂无扫描记录</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {history.map((item, index) => {
              const statusStyle = getStatusColor(item.status);
              return (
                <div
                  key={index}
                  style={{
                    padding: '1rem',
                    background: index === 0
                      ? (isDark ? 'rgba(102, 126, 234, 0.1)' : '#f0f9ff')
                      : (isDark ? 'rgba(255,255,255,0.05)' : '#ffffff'),
                    border: index === 0
                      ? '2px solid #667eea'
                      : (isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e5e7eb'),
                    borderRadius: '12px',
                    transition: 'all 0.2s'
                  }}
                >
                  {/* Status & Time */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.75rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.375rem 0.75rem',
                      background: statusStyle.bg,
                      borderRadius: '999px'
                    }}>
                      <span className="material-symbols-outlined" style={{
                        fontSize: '1rem',
                        color: statusStyle.text
                      }}>
                        {statusStyle.icon}
                      </span>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: statusStyle.text
                      }}>
                        {item.message}
                      </span>
                    </div>
                    <span style={{
                      fontSize: '0.75rem',
                      color: isDark ? 'rgba(255,255,255,0.4)' : '#9ca3af',
                      fontFamily: 'monospace'
                    }}>
                      {new Date(item.timestamp).toLocaleTimeString('zh-CN')}
                    </span>
                  </div>

                  {/* Code */}
                  {item.code && (
                    <div style={{
                      padding: '0.75rem',
                      background: isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb',
                      borderRadius: '8px',
                      marginBottom: item.packageData ? '0.75rem' : 0,
                      border: isDark ? '1px solid rgba(255,255,255,0.1)' : 'none'
                    }}>
                      <div style={{
                        fontSize: '0.75rem',
                        color: isDark ? 'rgba(255,255,255,0.6)' : '#6b7280',
                        marginBottom: '0.25rem'
                      }}>
                        扫描单号
                      </div>
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: isDark ? '#ffffff' : '#1a202c',
                        fontFamily: 'monospace'
                      }}>
                        {item.code}
                      </div>
                    </div>
                  )}

                  {/* Package Info */}
                  {item.packageData && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.75rem'
                    }}>
                      <div style={{
                        padding: '0.75rem',
                        background: isDark ? 'rgba(139, 92, 246, 0.1)' : '#ede9fe',
                        borderRadius: '8px',
                        border: isDark ? '1px solid rgba(139, 92, 246, 0.3)' : 'none'
                      }}>
                        <div style={{
                          fontSize: '0.75rem',
                          color: isDark ? '#a78bfa' : '#5b21b6',
                          marginBottom: '0.25rem'
                        }}>
                          分区
                        </div>
                        <div style={{
                          fontSize: '1.125rem',
                          fontWeight: 'bold',
                          color: isDark ? '#a78bfa' : '#5b21b6'
                        }}>
                          {item.packageData.zone}
                        </div>
                      </div>
                      <div style={{
                        padding: '0.75rem',
                        background: isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6',
                        borderRadius: '8px',
                        border: isDark ? '1px solid rgba(255,255,255,0.1)' : 'none'
                      }}>
                        <div style={{
                          fontSize: '0.75rem',
                          color: isDark ? 'rgba(255,255,255,0.6)' : '#4b5563',
                          marginBottom: '0.25rem'
                        }}>
                          门店
                        </div>
                        <div style={{
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: isDark ? '#ffffff' : '#1f2937',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {item.packageData.store_name}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
