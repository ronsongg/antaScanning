import React from 'react';
import { ScanResult } from '../types';

interface Props {
  history: ScanResult[];
}

export const ScanHistory: React.FC<Props> = ({ history }) => {
  return (
    <div className="h-[40%] dark:bg-panel-bg/80 bg-white/80 backdrop-blur-md rounded-t-[1.5rem] dark:border-white/10 border-gray-200 border-t flex flex-col overflow-hidden shadow-[0_-10px_25px_rgba(0,0,0,0.5)]">
      <div className="px-5 py-4 dark:border-white/5 border-gray-200 border-b dark:bg-panel-bg bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="dark:text-white text-gray-900 text-xs font-black uppercase tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">history</span>
            实时记录
          </h3>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full dark:bg-black/30 bg-gray-200 dark:border-white/5 border-gray-300 border">
            <span className="size-1 rounded-full bg-success-green animate-pulse"></span>
            <span className="dark:text-white/40 text-gray-600 text-[9px] font-bold uppercase tracking-tighter">实时同步中</span>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button className="shrink-0 px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-full shadow-lg">全部</button>
          <button className="shrink-0 px-3 py-1 dark:bg-white/5 bg-gray-100 dark:text-white/50 text-gray-600 text-[10px] font-bold rounded-full dark:border-white/5 border-gray-300 border dark:hover:bg-white/10 hover:bg-gray-200">成功</button>
          <button className="shrink-0 px-3 py-1 dark:bg-white/5 bg-gray-100 dark:text-white/50 text-gray-600 text-[10px] font-bold rounded-full dark:border-white/5 border-gray-300 border dark:hover:bg-white/10 hover:bg-gray-200">异常</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-2 space-y-2 pb-8">
        {history.length === 0 && (
            <div className="text-center py-8 dark:text-white/20 text-gray-400 text-xs">暂无扫描记录</div>
        )}

        {history.map((scan, index) => {
           const isSuccess = scan.status === 'success';
           const isError = scan.status === 'error' || scan.status === 'duplicate';

           return (
            <div key={`${scan.code}-${index}`} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                index === 0 ? 'dark:bg-white/10 bg-primary/5 dark:border-white/20 border-primary/20' : 'dark:bg-white/5 bg-gray-50 dark:border-white/5 border-gray-200 opacity-80'
            }`}>
                <div className="flex items-center gap-3">
                <div className={`size-9 rounded-md flex items-center justify-center border ${
                    isSuccess
                        ? 'bg-success-green/10 border-success-green/20'
                        : 'bg-error-red/10 border-error-red/20'
                }`}>
                    <span className={`material-symbols-outlined text-xl ${
                        isSuccess ? 'text-success-green' : 'text-error-red'
                    }`}>
                        {isSuccess ? 'check_circle' : 'warning'}
                    </span>
                </div>
                <div>
                    <p className="dark:text-white text-gray-900 font-black text-sm leading-tight tracking-tight">{scan.code}</p>
                    <p className="dark:text-white/40 text-gray-500 text-[9px] uppercase font-bold tracking-widest">
                        {scan.packageData ? `${scan.packageData.store_name} • ${scan.packageData.zone}` : scan.message}
                    </p>
                </div>
                </div>
                <div className="text-right">
                <p className="dark:text-white/70 text-gray-600 font-mono text-[10px] mb-0.5">{new Date(scan.timestamp).toLocaleTimeString('en-GB')}</p>
                <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                    isSuccess ? 'text-success-green bg-success-green/10' : 'text-error-red bg-error-red/10'
                }`}>
                    {scan.status === 'success' ? '成功' : scan.status === 'duplicate' ? '重复' : '异常'}
                </span>
                </div>
            </div>
           );
        })}
      </div>
    </div>
  );
};