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
  vehicle_number?: string; // 车牌号
  batch_id?: string; // 批次ID
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

// ============================================
// 用户认证系统类型定义
// ============================================

export interface User {
  id: string;
  username: string;
  password_hash: string;
  display_name: string;
  created_at: string;
  created_by: string | null;
  last_login_at: string | null;
  is_active: boolean;
}

export interface AuthToken {
  token: string;
  user: Omit<User, 'password_hash'>;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface JWTPayload {
  userId: string;
  username: string;
  displayName: string;
  iat: number;
  exp: number;
}