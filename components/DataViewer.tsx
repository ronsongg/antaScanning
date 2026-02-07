import React, { useState, useMemo } from 'react';
import { PackageData } from '../types';
import { exportBatchReport } from '../services/excelService';

interface Props {
  data: PackageData[];
  onClose: () => void;
  theme?: 'light' | 'dark';
  activeBatchId?: string | null;
  onStartScan?: (batchId: string) => void;
  onDeleteBatch?: (batchId: string) => void;
}

// 按导入批次分组的数据结构
interface GroupedData {
  batchId: string;
  vehicleNumber: string;
  importDate: string;
  packages: PackageData[];
  stats: {
    total: number;
    scanned: number;
    pending: number;
  };
}

export const DataViewer: React.FC<Props> = ({ data, onClose, theme = 'dark', activeBatchId, onStartScan, onDeleteBatch }) => {
  const isDark = theme === 'dark';

  // 分组数据：按批次ID（batch_id）分组
  const groupedData = useMemo(() => {
    const groups = new Map<string, PackageData[]>();

    data.forEach(pkg => {
      const batchId = pkg.batch_id || '未知批次';

      if (!groups.has(batchId)) {
        groups.set(batchId, []);
      }
      groups.get(batchId)!.push(pkg);
    });

    // 转换为数组并排序（最新的在前）
    const result: GroupedData[] = Array.from(groups.entries())
      .map(([batchId, packages]) => {
        const scanned = packages.filter(p => p.status === 'scanned').length;
        const firstPackage = packages[0];

        return {
          batchId,
          vehicleNumber: firstPackage.vehicle_number || '未知车辆',
          importDate: firstPackage.imported_at
            ? new Date(firstPackage.imported_at).toLocaleString('zh-CN')
            : '未知时间',
          packages,
          stats: {
            total: packages.length,
            scanned,
            pending: packages.length - scanned
          }
        };
      })
      .sort((a, b) => {
        // 按导入时间降序排序（最新的在前）
        const aTime = a.packages[0]?.imported_at ? new Date(a.packages[0].imported_at).getTime() : 0;
        const bTime = b.packages[0]?.imported_at ? new Date(b.packages[0].imported_at).getTime() : 0;
        return bTime - aTime;
      });

    return result;
  }, [data]);

  // 导出批次数据
  const handleExportBatch = (group: GroupedData) => {
    exportBatchReport(group.packages, `${group.vehicleNumber}_${group.importDate}`);
  };

  // 删除批次
  const handleDeleteBatch = (group: GroupedData) => {
    if (!onDeleteBatch) return;

    const message = `确定要删除批次吗？\n\n车牌号: ${group.vehicleNumber}\n导入时间: ${group.importDate}\n总计: ${group.stats.total} 条数据\n已扫描: ${group.stats.scanned} 条\n\n此操作不可恢复！`;

    if (window.confirm(message)) {
      onDeleteBatch(group.batchId);
    }
  };

  return (
    <div
      role="dialog"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: isDark ? '#1a1a2e' : '#ffffff',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '1400px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e5e7eb'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: isDark ? '#16213e' : '#f9fafb'
        }}>
          <div>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: isDark ? '#ffffff' : '#1a202c',
              margin: 0
            }}>
              数据总览
            </h2>
            <p style={{
              fontSize: '0.875rem',
              color: isDark ? 'rgba(255,255,255,0.6)' : '#6b7280',
              margin: '0.25rem 0 0 0'
            }}>
              共 {groupedData.length} 个批次，{data.length} 条记录
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1rem',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            关闭
          </button>
        </div>

        {/* Content - Grouped by Batch ID */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          background: isDark ? '#1a1a2e' : '#ffffff',
          padding: '1.5rem'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
            gap: '1.5rem'
          }}>
            {groupedData.map((group) => (
              <div
                key={group.batchId}
                style={{
                  background: isDark ? 'rgba(255,255,255,0.03)' : '#f9fafb',
                  borderRadius: '12px',
                  border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e5e7eb',
                  overflow: 'hidden',
                  transition: 'all 0.2s',
                  boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = isDark ? '0 8px 24px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = isDark ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)';
                }}
              >
                {/* 批次头部 */}
                <div style={{
                  padding: '1.5rem',
                  background: isDark ? 'rgba(102, 126, 234, 0.1)' : 'linear-gradient(135deg, #667eea, #764ba2)',
                  borderBottom: isDark ? '1px solid rgba(255,255,255,0.1)' : 'none',
                  position: 'relative'
                }}>
                  {/* 删除按钮 */}
                  {onDeleteBatch && (
                    <button
                      onClick={() => handleDeleteBatch(group)}
                      style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        width: '32px',
                        height: '32px',
                        background: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.9)',
                        color: isDark ? '#ef4444' : 'white',
                        border: isDark ? '1px solid rgba(239, 68, 68, 0.4)' : 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        zIndex: 10
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#ef4444';
                        e.currentTarget.style.color = 'white';
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.9)';
                        e.currentTarget.style.color = isDark ? '#ef4444' : 'white';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                      title="删除批次"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>
                        delete
                      </span>
                    </button>
                  )}

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '0.75rem'
                  }}>
                    <span className="material-symbols-outlined" style={{
                      fontSize: '2rem',
                      color: isDark ? '#667eea' : 'white'
                    }}>
                      local_shipping
                    </span>
                    <div>
                      <h3 style={{
                        fontSize: '1.25rem',
                        fontWeight: 'bold',
                        color: isDark ? '#ffffff' : 'white',
                        margin: 0,
                        paddingRight: '2rem' // 为删除按钮留空间
                      }}>
                        {group.vehicleNumber}
                      </h3>
                      <p style={{
                        fontSize: '0.875rem',
                        color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.9)',
                        margin: '0.25rem 0 0 0'
                      }}>
                        {group.importDate}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 统计信息 */}
                <div style={{
                  padding: '1.5rem',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '1rem'
                }}>
                  <div style={{
                    textAlign: 'center',
                    padding: '1rem',
                    background: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
                    borderRadius: '8px',
                    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e5e7eb'
                  }}>
                    <div style={{
                      fontSize: '0.75rem',
                      color: isDark ? 'rgba(255,255,255,0.6)' : '#6b7280',
                      marginBottom: '0.5rem',
                      fontWeight: '500'
                    }}>
                      总计
                    </div>
                    <div style={{
                      fontSize: '2rem',
                      fontWeight: 'bold',
                      color: isDark ? '#ffffff' : '#1a202c',
                      fontFamily: 'monospace'
                    }}>
                      {group.stats.total}
                    </div>
                  </div>
                  <div style={{
                    textAlign: 'center',
                    padding: '1rem',
                    background: isDark ? 'rgba(16, 185, 129, 0.1)' : '#d1fae5',
                    borderRadius: '8px',
                    border: isDark ? '1px solid rgba(16, 185, 129, 0.3)' : 'none'
                  }}>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#10b981',
                      marginBottom: '0.5rem',
                      fontWeight: '500'
                    }}>
                      已扫描
                    </div>
                    <div style={{
                      fontSize: '2rem',
                      fontWeight: 'bold',
                      color: '#10b981',
                      fontFamily: 'monospace'
                    }}>
                      {group.stats.scanned}
                    </div>
                  </div>
                  <div style={{
                    textAlign: 'center',
                    padding: '1rem',
                    background: isDark ? 'rgba(245, 158, 11, 0.1)' : '#fef3c7',
                    borderRadius: '8px',
                    border: isDark ? '1px solid rgba(245, 158, 11, 0.3)' : 'none'
                  }}>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#f59e0b',
                      marginBottom: '0.5rem',
                      fontWeight: '500'
                    }}>
                      待扫描
                    </div>
                    <div style={{
                      fontSize: '2rem',
                      fontWeight: 'bold',
                      color: '#f59e0b',
                      fontFamily: 'monospace'
                    }}>
                      {group.stats.pending}
                    </div>
                  </div>
                </div>

                {/* 进度条 */}
                <div style={{ padding: '0 1.5rem 1.5rem 1.5rem' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{
                      fontSize: '0.75rem',
                      color: isDark ? 'rgba(255,255,255,0.6)' : '#6b7280',
                      fontWeight: '500'
                    }}>
                      扫描进度
                    </span>
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      color: isDark ? '#ffffff' : '#1a202c',
                      fontFamily: 'monospace'
                    }}>
                      {Math.round((group.stats.scanned / group.stats.total) * 100)}%
                    </span>
                  </div>
                  <div style={{
                    background: isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb',
                    borderRadius: '999px',
                    height: '8px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      background: 'linear-gradient(90deg, #10b981, #34d399)',
                      height: '100%',
                      width: `${(group.stats.scanned / group.stats.total) * 100}%`,
                      borderRadius: '999px',
                      transition: 'width 0.5s ease',
                      boxShadow: '0 0 8px rgba(16, 185, 129, 0.5)'
                    }} />
                  </div>
                </div>

                {/* 操作按钮 */}
                <div style={{
                  padding: '1rem 1.5rem 1.5rem 1.5rem',
                  display: 'flex',
                  gap: '0.75rem'
                }}>
                  {/* 开始扫描按钮 */}
                  {onStartScan && (
                    <button
                      onClick={() => {
                        onStartScan(group.batchId);
                        onClose(); // 关闭数据总览，进入扫描界面
                      }}
                      style={{
                        flex: 1,
                        padding: '0.875rem',
                        background: activeBatchId === group.batchId
                          ? 'linear-gradient(135deg, #10b981, #059669)'
                          : 'linear-gradient(135deg, #667eea, #764ba2)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s',
                        boxShadow: activeBatchId === group.batchId
                          ? '0 4px 12px rgba(16, 185, 129, 0.4)'
                          : '0 4px 12px rgba(102, 126, 234, 0.3)',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = activeBatchId === group.batchId
                          ? '0 6px 16px rgba(16, 185, 129, 0.5)'
                          : '0 6px 16px rgba(102, 126, 234, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = activeBatchId === group.batchId
                          ? '0 4px 12px rgba(16, 185, 129, 0.4)'
                          : '0 4px 12px rgba(102, 126, 234, 0.3)';
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>
                        {activeBatchId === group.batchId ? 'check_circle' : 'barcode_scanner'}
                      </span>
                      {activeBatchId === group.batchId ? '正在扫描此批次' : '开始扫描'}
                    </button>
                  )}

                  {/* 导出按钮 */}
                  <button
                    onClick={() => handleExportBatch(group)}
                    style={{
                      flex: onStartScan ? 0.6 : 1,
                      padding: '0.875rem',
                      background: isDark ? 'rgba(255,255,255,0.1)' : '#f3f4f6',
                      color: isDark ? '#ffffff' : '#1a202c',
                      border: isDark ? '1px solid rgba(255,255,255,0.2)' : '1px solid #e5e7eb',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.15)' : '#e5e7eb';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : '#f3f4f6';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>
                      download
                    </span>
                    导出
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 空状态 */}
          {groupedData.length === 0 && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '400px',
              color: isDark ? 'rgba(255,255,255,0.4)' : '#9ca3af'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '5rem', marginBottom: '1rem' }}>
                inventory_2
              </span>
              <p style={{ margin: 0, fontSize: '1.125rem', fontWeight: '500' }}>暂无数据</p>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>请先导入Excel文件</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
