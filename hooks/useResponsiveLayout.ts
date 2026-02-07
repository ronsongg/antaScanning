/**
 * 响应式布局 Hook
 * 检测设备类型并返回布局配置
 */

import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export interface LayoutConfig {
  deviceType: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  containerMaxWidth: string;
  columns: number;
}

export function useResponsiveLayout(): LayoutConfig {
  const [deviceType, setDeviceType] = useState<DeviceType>('mobile');

  useEffect(() => {
    const updateDeviceType = () => {
      const width = window.innerWidth;

      if (width >= 1280) {
        setDeviceType('desktop');
      } else if (width >= 768) {
        setDeviceType('tablet');
      } else {
        setDeviceType('mobile');
      }
    };

    // 初始检测
    updateDeviceType();

    // 监听窗口大小变化
    window.addEventListener('resize', updateDeviceType);
    return () => window.removeEventListener('resize', updateDeviceType);
  }, []);

  return {
    deviceType,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
    containerMaxWidth: deviceType === 'desktop' ? '100%' : deviceType === 'tablet' ? '768px' : '448px',
    columns: deviceType === 'desktop' ? 3 : deviceType === 'tablet' ? 2 : 1
  };
}
