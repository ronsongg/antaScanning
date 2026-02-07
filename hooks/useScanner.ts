import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase, TABLES } from '../services/supabaseClient';
import { indexedDB as indexedDBService } from '../services/indexedDBService';
import { PackageData, ScanResult, DashboardStats } from '../types';
import { speak } from '../services/speechService';

// Optimistic UI updates require local state management
export const useScanner = () => {
  // --- State ---
  // Use a Map for O(1) lookup performance to meet the 100ms requirement
  const [packageMap, setPackageMap] = useState<Map<string, PackageData>>(new Map());
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'syncing'>('online');
  const syncQueueRef = useRef<Array<{ tracking_number: string; data: Partial<PackageData> }>>([]);

  // Stats derivation
  const stats: DashboardStats = useMemo(() => {
    const total = packageMap.size;
    let scanned = 0;
    packageMap.forEach(p => { if (p.status === 'scanned') scanned++; });
    return {
      total,
      scanned,
      pending: total - scanned,
      progress: total === 0 ? 0 : Math.round((scanned / total) * 100)
    };
  }, [packageMap]);

  // --- Actions ---

  // 1. Load Initial Data (Offline-First)
  const loadData = useCallback(async () => {
    setConnectionStatus('syncing');

    try {
      // 优先从IndexedDB加载（极快，不受网络影响）
      console.log('[离线优先] 从本地IndexedDB加载数据...');
      const localData = await indexedDBService.getAll();

      if (localData.length > 0) {
        console.log(`[离线优先] 本地加载成功: ${localData.length}条数据`);
        const newMap = new Map<string, PackageData>();
        localData.forEach((pkg: PackageData) => {
          newMap.set(pkg.tracking_number, pkg);
        });
        setPackageMap(newMap);
        setConnectionStatus('online');
      }

      // 后台从Supabase同步最新数据
      console.log('[后台同步] 从Supabase获取最新数据...');
      const { data, error } = await supabase.from(TABLES.PACKAGES).select('*');

      if (error) throw error;

      if (data && data.length > 0) {
        console.log(`[后台同步] 云端数据: ${data.length}条`);
        const newMap = new Map<string, PackageData>();
        data.forEach((pkg: PackageData) => {
          newMap.set(pkg.tracking_number, pkg);
        });

        // 更新内存和本地数据库
        setPackageMap(newMap);
        await indexedDBService.saveAll(data);
        console.log('[后台同步] 本地数据库已更新');
      }

      setConnectionStatus('online');
    } catch (err) {
      console.error('[离线模式] 加载失败，使用本地缓存:', err);
      setConnectionStatus('offline');

      // 网络失败时，确保使用本地数据
      const localData = await indexedDBService.getAll();
      if (localData.length > 0) {
        const newMap = new Map<string, PackageData>();
        localData.forEach((pkg: PackageData) => {
          newMap.set(pkg.tracking_number, pkg);
        });
        setPackageMap(newMap);
        console.log(`[离线模式] 使用本地缓存: ${localData.length}条数据`);
      }
    }
  }, []);

  // 2. Realtime Subscription
  useEffect(() => {
    loadData();

    const channel = supabase
      .channel('public:packages')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: TABLES.PACKAGES }, (payload) => {
        const updatedPackage = payload.new as PackageData;
        setPackageMap(prev => {
          const next = new Map(prev);
          next.set(updatedPackage.tracking_number, updatedPackage);
          return next;
        });
        
        // Optional: Update history if it wasn't us who scanned it
        // This logic can be refined based on user_id if auth is implemented
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: TABLES.PACKAGES }, (payload) => {
          const newPackage = payload.new as PackageData;
          setPackageMap(prev => {
              const next = new Map(prev);
              next.set(newPackage.tracking_number, newPackage);
              return next;
          });
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setConnectionStatus('online');
        if (status === 'CHANNEL_ERROR') setConnectionStatus('offline');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  // 3. Core Scanning Logic
  const handleScan = useCallback(async (code: string) => {
    const timestamp = new Date().toISOString();
    const cleanCode = code.trim();

    if (!cleanCode) {
      // 空单号扫描
      speak('无法判断', 'error');
      const result: ScanResult = {
        code: '',
        timestamp,
        status: 'error',
        message: '单号为空，无法判断'
      };
      setLastScan(result);
      setScanHistory(prev => [result, ...prev].slice(0, 50));
      return;
    }

    // Local Lookup (O(1))
    const pkg = packageMap.get(cleanCode);

    let result: ScanResult;

    if (!pkg) {
      // Case: Not Found - 无法判断
      speak('无法判断', 'error');
      result = {
        code: cleanCode,
        timestamp,
        status: 'error',
        message: '单号不存在，无法判断'
      };
    } else if (pkg.status === 'scanned') {
      // Case: Duplicate
      speak('重复扫描', 'error');
      result = { code: cleanCode, timestamp, status: 'duplicate', message: '已扫描', packageData: pkg };
    } else {
      // Case: Success
      const zoneText = pkg.zone.replace('-', '杠'); // "10-1" -> "10杠1"
      speak(zoneText, 'success');

      const updatedPkg: PackageData = { ...pkg, status: 'scanned', scanned_at: timestamp };

      // Optimistic Update: Update Map immediately
      setPackageMap(prev => {
        const next = new Map(prev);
        next.set(cleanCode, updatedPkg);
        return next;
      });

      result = {
        code: cleanCode,
        timestamp,
        status: 'success',
        message: '扫描成功',
        packageData: updatedPkg
      };

      // 立即保存到IndexedDB（本地持久化，极快）
      indexedDBService.save(updatedPkg).catch(err => {
        console.error('[IndexedDB] 保存失败:', err);
      });

      // 异步同步到云端数据库（后台执行，不阻塞）
      supabase
        .from(TABLES.PACKAGES)
        .update({ status: 'scanned', scanned_at: timestamp })
        .eq('tracking_number', cleanCode)
        .then(({ error }) => {
          if (error) {
            console.error('[云同步] 失败，已加入重试队列:', error);
            setConnectionStatus('offline');

            // 添加到同步队列，稍后重试
            syncQueueRef.current.push({
              tracking_number: cleanCode,
              data: { status: 'scanned', scanned_at: timestamp }
            });
          } else {
            console.log('[云同步] 成功:', cleanCode);
          }
        });
    }

    setLastScan(result);
    setScanHistory(prev => [result, ...prev].slice(0, 50)); // Keep last 50
  }, [packageMap]);

  // 4. Batch Import
  const importData = useCallback(async (data: PackageData[]) => {
    const importTimestamp = new Date().toISOString();

    // Add import timestamp to all data
    const dataWithTimestamp = data.map(d => ({
      ...d,
      imported_at: importTimestamp
    }));

    // 1. 立即更新本地Map（即时响应）
    setPackageMap(prev => {
        const next = new Map(prev);
        dataWithTimestamp.forEach(d => next.set(d.tracking_number, d));
        return next;
    });

    // 2. 保存到IndexedDB（本地持久化）
    try {
      await indexedDBService.saveAll(dataWithTimestamp);
      console.log('[IndexedDB] 批量保存成功:', dataWithTimestamp.length);
    } catch (err) {
      console.error('[IndexedDB] 批量保存失败:', err);
    }

    // 3. 异步同步到云端（后台执行）
    const { error } = await supabase.from(TABLES.PACKAGES).insert(dataWithTimestamp);
    if (error) {
        console.error('[云同步] 导入失败:', error);
        alert('云端同步失败，数据已保存在本地\n错误: ' + error.message);
    } else {
        console.log('[云同步] 导入成功:', dataWithTimestamp.length);
        alert('导入成功!');
    }
  }, []);

  // 5. 同步队列处理（定期重试失败的同步）
  useEffect(() => {
    const syncInterval = setInterval(async () => {
      if (syncQueueRef.current.length > 0 && connectionStatus !== 'offline') {
        console.log(`[同步队列] 处理 ${syncQueueRef.current.length} 条待同步数据...`);

        const queue = [...syncQueueRef.current];
        syncQueueRef.current = [];

        for (const item of queue) {
          try {
            const { error } = await supabase
              .from(TABLES.PACKAGES)
              .update(item.data)
              .eq('tracking_number', item.tracking_number);

            if (error) {
              // 重试失败，放回队列
              syncQueueRef.current.push(item);
            } else {
              console.log('[同步队列] 成功:', item.tracking_number);
            }
          } catch (err) {
            // 重试失败，放回队列
            syncQueueRef.current.push(item);
          }
        }
      }
    }, 10000); // 每10秒尝试同步一次

    return () => clearInterval(syncInterval);
  }, [connectionStatus]);

  return {
    packageMap,
    stats,
    lastScan,
    scanHistory,
    connectionStatus,
    handleScan,
    importData
  };
};