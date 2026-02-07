export type ScanStatus = 'pending' | 'success' | 'duplicate' | 'error';

export interface PackageData {
  id?: string;
  tracking_number: string;
  zone: string;
  store_name: string;
  status: 'pending' | 'scanned';
  scanned_at?: string | null;
  imported_at?: string; // 导入日期
  is_empty_tracking?: boolean; // 是否为空单号
  operator_id?: string; // For multi-device distinction if needed
}

export interface ScanResult {
  code: string;
  timestamp: string;
  status: ScanStatus;
  message: string;
  packageData?: PackageData;
}

export interface DashboardStats {
  total: number;
  scanned: number;
  pending: number;
  progress: number;
}