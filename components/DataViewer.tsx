import React, { useState, useMemo } from 'react';
import { PackageData } from '../types';

interface Props {
  data: PackageData[];
  onClose: () => void;
}

interface DailyStats {
  date: string;
  total: number;
  scanned: number;
  missing: number; // 缺货/未扫描
  items: PackageData[];
}

export const DataViewer: React.FC<Props> = ({ data, onClose }) => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Group data by import date
  const dailyStats = useMemo(() => {
    const statsMap = new Map<string, DailyStats>();

    data.forEach(item => {
      // Use imported_at if available, otherwise use scanned_at, fallback to today
      const dateStr = item.imported_at
        ? new Date(item.imported_at).toISOString().split('T')[0]
        : item.scanned_at
        ? new Date(item.scanned_at).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      if (!statsMap.has(dateStr)) {
        statsMap.set(dateStr, {
          date: dateStr,
          total: 0,
          scanned: 0,
          missing: 0,
          items: []
        });
      }

      const stats = statsMap.get(dateStr)!;
      stats.total++;
      if (item.status === 'scanned') {
        stats.scanned++;
      } else {
        stats.missing++;
      }
      stats.items.push(item);
    });

    // Sort by date descending (newest first)
    return Array.from(statsMap.values()).sort((a, b) =>
      b.date.localeCompare(a.date)
    );
  }, [data]);

  // Filter items for selected date
  const selectedDateItems = useMemo(() => {
    if (!selectedDate) return [];

    const stats = dailyStats.find(s => s.date === selectedDate);
    if (!stats) return [];

    let items = stats.items;

    // Apply search filter
    if (searchTerm) {
      items = items.filter(item =>
        item.tracking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.store_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.zone.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return items;
  }, [selectedDate, dailyStats, searchTerm]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateOnly = dateStr;
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (dateOnly === todayStr) return '今天';
    if (dateOnly === yesterdayStr) return '昨天';

    return date.toLocaleDateString('zh-CN', {
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
  };

  const totalStats = useMemo(() => {
    return dailyStats.reduce((acc, day) => ({
      total: acc.total + day.total,
      scanned: acc.scanned + day.scanned,
      missing: acc.missing + day.missing
    }), { total: 0, scanned: 0, missing: 0 });
  }, [dailyStats]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-panel-bg border border-white/10 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">数据总览 - 每日报表</h2>
            <div className="flex gap-4 text-sm">
              <span className="text-white/60">总计: <span className="text-white font-bold">{totalStats.total}</span></span>
              <span className="text-success-green/60">已扫: <span className="text-success-green font-bold">{totalStats.scanned}</span></span>
              <span className="text-error-red/60">缺货: <span className="text-error-red font-bold">{totalStats.missing}</span></span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-10 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-white">close</span>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Daily List */}
          <div className="w-80 border-r border-white/10 flex flex-col">
            <div className="p-4 border-b border-white/10">
              <h3 className="text-white font-bold text-sm mb-2">日期列表</h3>
              <p className="text-white/40 text-xs">点击查看详细数据</p>
            </div>

            <div className="flex-1 overflow-y-auto">
              {dailyStats.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-white/40">
                  <span className="material-symbols-outlined text-4xl mb-2">calendar_today</span>
                  <p className="text-sm">暂无数据</p>
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {dailyStats.map((day) => (
                    <button
                      key={day.date}
                      onClick={() => setSelectedDate(day.date)}
                      className={`w-full p-4 rounded-lg border transition-all ${
                        selectedDate === day.date
                          ? 'bg-primary/20 border-primary'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-bold">{formatDate(day.date)}</span>
                        <span className="text-white/40 text-xs font-mono">{day.date}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-white/5 rounded p-2">
                          <div className="text-white/60 mb-1">总数</div>
                          <div className="text-white font-bold text-lg">{day.total}</div>
                        </div>
                        <div className="bg-success-green/10 rounded p-2">
                          <div className="text-success-green/60 mb-1">已扫</div>
                          <div className="text-success-green font-bold text-lg">{day.scanned}</div>
                        </div>
                        <div className="bg-error-red/10 rounded p-2">
                          <div className="text-error-red/60 mb-1">缺货</div>
                          <div className="text-error-red font-bold text-lg">{day.missing}</div>
                        </div>
                      </div>

                      {day.missing > 0 && (
                        <div className="mt-2 flex items-center gap-1 text-error-red text-xs">
                          <span className="material-symbols-outlined text-sm">warning</span>
                          <span>缺货率: {((day.missing / day.total) * 100).toFixed(1)}%</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Content - Detail View */}
          <div className="flex-1 flex flex-col">
            {selectedDate ? (
              <>
                {/* Search Bar */}
                <div className="p-4 border-b border-white/10">
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">search</span>
                    <input
                      type="text"
                      placeholder="搜索单号、门店、分区..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-primary/50"
                    />
                  </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-panel-bg border-b border-white/10">
                      <tr>
                        <th className="text-left p-4 text-xs font-bold text-white/60 uppercase">单号</th>
                        <th className="text-left p-4 text-xs font-bold text-white/60 uppercase">分区</th>
                        <th className="text-left p-4 text-xs font-bold text-white/60 uppercase">门店</th>
                        <th className="text-left p-4 text-xs font-bold text-white/60 uppercase">状态</th>
                        <th className="text-left p-4 text-xs font-bold text-white/60 uppercase">扫描时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDateItems.map((item, index) => (
                        <tr
                          key={item.tracking_number}
                          className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                            index % 2 === 0 ? 'bg-white/[0.02]' : ''
                          } ${item.is_empty_tracking ? 'opacity-60' : ''}`}
                        >
                          <td className="p-4 text-sm font-mono">
                            {item.is_empty_tracking ? (
                              <span className="text-white/40 italic">（空单号）</span>
                            ) : (
                              <span className="text-white">{item.tracking_number}</span>
                            )}
                          </td>
                          <td className="p-4 text-sm text-white">
                            <span className="px-2 py-1 bg-primary/20 text-primary rounded font-bold text-xs">
                              {item.zone}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-white/80">{item.store_name}</td>
                          <td className="p-4 text-sm">
                            {item.is_empty_tracking ? (
                              <span className="px-2 py-1 bg-yellow-500/20 text-yellow-500 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
                                <span className="material-symbols-outlined text-xs">help</span>
                                无法判断
                              </span>
                            ) : item.status === 'scanned' ? (
                              <span className="px-2 py-1 bg-success-green/20 text-success-green rounded-full text-xs font-bold flex items-center gap-1 w-fit">
                                <span className="material-symbols-outlined text-xs">check_circle</span>
                                已扫描
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-error-red/20 text-error-red rounded-full text-xs font-bold flex items-center gap-1 w-fit">
                                <span className="material-symbols-outlined text-xs">error</span>
                                缺货
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-sm text-white/60">
                            {item.scanned_at
                              ? new Date(item.scanned_at).toLocaleString('zh-CN')
                              : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {selectedDateItems.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-white/40">
                      <span className="material-symbols-outlined text-5xl mb-2">inbox</span>
                      <p>没有找到匹配的数据</p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 flex items-center justify-between bg-panel-bg">
                  <p className="text-sm text-white/60">
                    显示 <span className="text-white font-bold">{selectedDateItems.length}</span> 条记录
                  </p>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-white/40">
                <span className="material-symbols-outlined text-6xl mb-4">calendar_month</span>
                <p className="text-lg">请选择日期查看详细数据</p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="p-4 border-t border-white/10 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg font-medium transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
