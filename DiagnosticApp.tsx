/**
 * 诊断页面 - 用于排查登录页面不显示的问题
 * 临时替换 App.tsx 来测试
 */

import React, { useState, useEffect } from 'react';

export default function DiagnosticApp() {
  const [diagnostics, setDiagnostics] = useState<string[]>([]);

  useEffect(() => {
    const results: string[] = [];

    // 1. 检查环境变量
    results.push('=== 环境变量检查 ===');
    results.push(`JWT_SECRET: ${import.meta.env.VITE_JWT_SECRET ? '已设置' : '未设置'}`);

    // 2. 检查 localStorage
    results.push('\n=== LocalStorage 检查 ===');
    try {
      const token = localStorage.getItem('auth_token');
      results.push(`auth_token: ${token ? '存在' : '不存在'}`);
    } catch (e) {
      results.push(`localStorage 错误: ${e}`);
    }

    // 3. 检查导入
    results.push('\n=== 导入检查 ===');
    try {
      import('./hooks/useAuth').then(() => {
        results.push('✅ useAuth 导入成功');
        setDiagnostics([...results]);
      }).catch(err => {
        results.push(`❌ useAuth 导入失败: ${err.message}`);
        setDiagnostics([...results]);
      });

      import('./components/LoginPage').then(() => {
        results.push('✅ LoginPage 导入成功');
        setDiagnostics([...results]);
      }).catch(err => {
        results.push(`❌ LoginPage 导入失败: ${err.message}`);
        setDiagnostics([...results]);
      });

      import('./components/ProtectedRoute').then(() => {
        results.push('✅ ProtectedRoute 导入成功');
        setDiagnostics([...results]);
      }).catch(err => {
        results.push(`❌ ProtectedRoute 导入失败: ${err.message}`);
        setDiagnostics([...results]);
      });

      import('./services/authService').then(() => {
        results.push('✅ authService 导入成功');
        setDiagnostics([...results]);
      }).catch(err => {
        results.push(`❌ authService 导入失败: ${err.message}`);
        setDiagnostics([...results]);
      });

      import('./services/cryptoService').then(() => {
        results.push('✅ cryptoService 导入成功');
        setDiagnostics([...results]);
      }).catch(err => {
        results.push(`❌ cryptoService 导入失败: ${err.message}`);
        setDiagnostics([...results]);
      });
    } catch (e) {
      results.push(`导入检查错误: ${e}`);
    }

    setDiagnostics(results);
  }, []);

  return (
    <div style={{
      padding: '2rem',
      fontFamily: 'monospace',
      background: '#1a1a1a',
      color: '#00ff00',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#00ff00', marginBottom: '2rem' }}>🔍 系统诊断工具</h1>

      <div style={{
        background: '#000',
        padding: '1.5rem',
        borderRadius: '8px',
        border: '1px solid #00ff00'
      }}>
        {diagnostics.map((line, i) => (
          <div key={i} style={{ marginBottom: '0.5rem' }}>
            {line}
          </div>
        ))}

        {diagnostics.length === 0 && (
          <div>正在运行诊断...</div>
        )}
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2 style={{ color: '#00ff00', marginBottom: '1rem' }}>手动测试登录页面</h2>
        <button
          onClick={() => {
            import('./components/LoginPage').then(module => {
              console.log('LoginPage 模块:', module);
              alert('LoginPage 导入成功，检查控制台');
            }).catch(err => {
              console.error('LoginPage 导入失败:', err);
              alert('LoginPage 导入失败: ' + err.message);
            });
          }}
          style={{
            padding: '1rem 2rem',
            background: '#00ff00',
            color: '#000',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            marginRight: '1rem'
          }}
        >
          测试导入 LoginPage
        </button>

        <button
          onClick={() => {
            import('./hooks/useAuth').then(module => {
              console.log('useAuth 模块:', module);
              alert('useAuth 导入成功，检查控制台');
            }).catch(err => {
              console.error('useAuth 导入失败:', err);
              alert('useAuth 导入失败: ' + err.message);
            });
          }}
          style={{
            padding: '1rem 2rem',
            background: '#00ff00',
            color: '#000',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          测试导入 useAuth
        </button>
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#333', borderRadius: '6px' }}>
        <h3 style={{ color: '#ffff00', marginBottom: '1rem' }}>请检查：</h3>
        <ol style={{ color: '#fff', lineHeight: '2' }}>
          <li>打开浏览器控制台（F12）查看是否有错误</li>
          <li>查看 Network 标签页，是否有加载失败的文件</li>
          <li>确认上面的诊断结果是否有 ❌ 错误</li>
        </ol>
      </div>
    </div>
  );
}
