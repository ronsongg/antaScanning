/**
 * AuthContext - 全局认证状态管理
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import * as authService from '../services/authService';
import type { User, LoginCredentials } from '../types';

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: Omit<User, 'password_hash'> | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<Omit<User, 'password_hash'> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 初始化：从 LocalStorage 恢复会话
  useEffect(() => {
    const initAuth = async () => {
      try {
        const isValid = await authService.validateToken();
        if (isValid) {
          const user = await authService.getCurrentUser();
          if (user) {
            setCurrentUser(user);
            setIsAuthenticated(true);
          }
        }
      } catch (err) {
        console.error('初始化认证失败:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // 登录
  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);

    try {
      const authToken = await authService.login(credentials);
      setCurrentUser(authToken.user);
      setIsAuthenticated(true);
      console.log('登录成功，状态已更新:', authToken.user);
    } catch (err) {
      const message = err instanceof Error ? err.message : '登录失败';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 登出
  const logout = useCallback(() => {
    authService.logout();
    setCurrentUser(null);
    setIsAuthenticated(false);
    setError(null);
    console.log('登出成功，状态已清除');
  }, []);

  // 修改密码
  const changePassword = useCallback(async (oldPassword: string, newPassword: string) => {
    setError(null);
    try {
      await authService.changePassword(oldPassword, newPassword);
    } catch (err) {
      const message = err instanceof Error ? err.message : '修改密码失败';
      setError(message);
      throw err;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        login,
        logout,
        changePassword,
        isLoading,
        error
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
