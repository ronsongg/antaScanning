import * as XLSX from 'xlsx';
import { PackageData } from '../types';

export const parseExcel = (file: File): Promise<PackageData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet) as any[];

        // Map generic Excel columns to our schema
        // Expected columns: 单号, 门店, 分区
        const mappedData: PackageData[] = jsonData.map((row, index) => {
          const trackingNumber = String(row['单号'] || row['tracking_number'] || '').trim();

          return {
            tracking_number: trackingNumber || `EMPTY_${Date.now()}_${index}`, // 生成唯一ID给空单号
            store_name: String(row['门店'] || row['store_name'] || '未知门店'),
            zone: String(row['分区'] || row['zone'] || '未分配区域'),
            status: 'pending' as const,
            is_empty_tracking: !trackingNumber, // 标记是否为空单号
          };
        });

        // 统计信息
        const emptyCount = mappedData.filter(item => item.is_empty_tracking).length;
        const validCount = mappedData.length - emptyCount;

        console.log(`导入数据: 总计${mappedData.length}条, 有效单号${validCount}条, 空单号${emptyCount}条`);

        resolve(mappedData);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
};

export const exportReport = (data: PackageData[], filename?: string) => {
  const ws = XLSX.utils.json_to_sheet(data.map(item => ({
    '单号': item.tracking_number,
    '分区': item.zone,
    '门店': item.store_name,
    '状态': item.status === 'scanned' ? '已扫描' : '未扫描',
    '扫描时间': item.scanned_at ? new Date(item.scanned_at).toLocaleString('zh-CN') : '-'
  })));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "扫描报表");
  const dateStr = new Date().toISOString().slice(0, 10);
  const defaultFilename = `分拣报表_${dateStr}.xlsx`;
  XLSX.writeFile(wb, filename || defaultFilename);
};

export const exportScannedReport = (data: PackageData[]) => {
  const scannedData = data.filter(item => item.status === 'scanned');
  const dateStr = new Date().toISOString().slice(0, 10);
  exportReport(scannedData, `已扫描报表_${dateStr}.xlsx`);
};

export const exportPendingReport = (data: PackageData[]) => {
  const pendingData = data.filter(item => item.status === 'pending');
  const dateStr = new Date().toISOString().slice(0, 10);
  exportReport(pendingData, `未扫描报表_${dateStr}.xlsx`);
};

// 导出指定批次的数据
export const exportBatchReport = (data: PackageData[], batchDate: string) => {
  const dateStr = batchDate.replace(/\//g, '-'); // 2026/2/7 -> 2026-2-7
  exportReport(data, `批次报表_${dateStr}.xlsx`);
};