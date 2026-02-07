import React from 'react';
import { ScanResult } from '../types';

interface Props {
  lastScan: ScanResult | null;
}

export const ZoneDisplay: React.FC<Props> = ({ lastScan }) => {
  // Default State
  if (!lastScan) {
    return (
      <div className="w-full py-12 rounded-2xl glass-panel text-center backdrop-blur-sm transition-all duration-300">
        <p className="dark:text-white/30 text-gray-400 text-xs font-black uppercase tracking-[0.4em] mb-4">等待扫描</p>
        <span className="material-symbols-outlined text-[80px] dark:text-white/10 text-gray-300 animate-pulse">qr_code_scanner</span>
      </div>
    );
  }

  // Error State
  if (lastScan.status === 'error' || lastScan.status === 'duplicate') {
    return (
      <div className="w-full py-6 rounded-2xl bg-error-red/10 border border-error-red/30 text-center backdrop-blur-sm shadow-[0_0_30px_rgba(239,68,68,0.2)] animate-shake">
        <p className="text-error-red/70 text-xs font-black uppercase tracking-[0.4em] mb-1">异常警告</p>
        <h1 className="text-error-red text-[40px] md:text-[60px] font-black leading-tight tracking-tighter drop-shadow-md">
            {lastScan.status === 'duplicate' ? '重复扫描' : '单号无效'}
        </h1>
        <div className="mt-4 flex flex-col items-center gap-2">
            <p className="dark:text-white/50 text-gray-600 text-[12px] font-mono">{lastScan.code}</p>
        </div>
      </div>
    );
  }

  // Success State
  const { zone, store_name } = lastScan.packageData!;

  return (
    <div className="w-full py-6 rounded-2xl glass-panel text-center backdrop-blur-sm bg-primary/5 border-primary/20 shadow-[0_0_40px_rgba(19,91,236,0.15)] animate-pop-in">
      <p className="dark:text-white/40 text-gray-500 text-xs font-black uppercase tracking-[0.4em] mb-1">分拣分区</p>
      <h1 className="dark:text-white text-gray-900 text-[100px] md:text-[120px] font-black leading-none tracking-tighter drop-shadow-[0_15px_15px_rgba(0,0,0,0.6)]">
        {zone}
      </h1>
      <div className="mt-4 flex flex-col items-center gap-2">
        <p className="dark:text-white/30 text-gray-400 text-[10px] font-bold uppercase tracking-widest">目的地门店</p>
        <div className="inline-flex items-center gap-2 bg-primary/20 text-primary-light px-6 py-2.5 rounded-xl border border-primary/40 shadow-lg">
          <span className="material-symbols-outlined text-lg text-primary">storefront</span>
          <span className="text-xl font-black tracking-tight dark:text-white text-gray-900">{store_name}</span>
        </div>
      </div>
    </div>
  );
};