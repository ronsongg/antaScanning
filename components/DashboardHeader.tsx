import React from 'react';
import { DashboardStats } from '../types';

interface Props {
  stats: DashboardStats;
  connectionStatus: 'online' | 'offline' | 'syncing';
  onMenuClick: () => void;
}

export const DashboardHeader: React.FC<Props> = ({
  stats,
  connectionStatus,
  onMenuClick
}) => {
  return (
    <div className="flex flex-col gap-3 p-4 dark:bg-panel-bg bg-gray-50 dark:border-white/10 border-gray-200 border-b shadow-lg z-20 transition-colors">
      <header className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          {/* Menu Button */}
          <button
            onClick={onMenuClick}
            className="flex size-8 items-center justify-center rounded dark:bg-white/5 bg-gray-200 dark:hover:bg-white/10 hover:bg-gray-300 transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined dark:text-white text-gray-700 text-xl">menu</span>
          </button>

          <h2 className="dark:text-white text-gray-900 text-sm font-black tracking-tight uppercase">安踏项目扫描系统</h2>
        </div>

        {/* Status Indicator */}
        <div className={`flex items-center gap-2 px-2 py-1 rounded-full border ${
            connectionStatus === 'online' ? 'bg-success-green/10 border-success-green/20' :
            connectionStatus === 'syncing' ? 'bg-yellow-500/10 border-yellow-500/20' :
            'bg-error-red/10 border-error-red/20'
        }`}>
          <p className="dark:text-white/60 text-gray-600 text-[9px] font-bold uppercase">连接状态</p>
          <div className={`h-2 w-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.8)] ${
              connectionStatus === 'online' ? 'bg-success-green shadow-success-green' : 
              connectionStatus === 'syncing' ? 'bg-yellow-500 shadow-yellow-500 animate-pulse' :
              'bg-error-red shadow-error-red'
          }`}></div>
          <p className={`text-[10px] font-bold uppercase tracking-wider ${
               connectionStatus === 'online' ? 'text-success-green' :
               connectionStatus === 'syncing' ? 'text-yellow-500' :
               'text-error-red'
          }`}>
              {connectionStatus === 'online' ? '在线' : connectionStatus === 'syncing' ? '同步' : '离线'}
          </p>
        </div>
      </header>

      {/* Progress Section */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-end px-1">
          <div className="flex items-center gap-2">
            <span className="dark:text-white/40 text-gray-500 text-[10px] font-black uppercase tracking-widest">批次进度</span>
            <span className="dark:text-white text-gray-900 text-sm font-bold font-mono">{stats.scanned} / {stats.total}</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-1 dark:bg-white/5 bg-gray-200 dark:hover:bg-white/10 hover:bg-gray-300 px-2 py-1 rounded dark:border-white/10 border-gray-300 border transition-colors">
              <span className="material-symbols-outlined text-xs dark:text-white/70 text-gray-600">format_list_bulleted</span>
              <span className="text-[10px] font-bold dark:text-white/70 text-gray-600">未扫清单</span>
            </button>
            <span className="text-primary text-lg font-black italic">{stats.progress}%</span>
          </div>
        </div>

        <div className="relative rounded-full dark:bg-white/5 bg-gray-200 h-2 overflow-hidden dark:border-white/5 border-gray-300 border">
          <div 
            className="absolute top-0 left-0 h-full rounded-full bg-primary shadow-[0_0_10px_rgba(19,91,236,0.6)] transition-all duration-500 ease-out" 
            style={{ width: `${stats.progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};