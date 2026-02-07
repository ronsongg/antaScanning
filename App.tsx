import React, { useState } from 'react';
import { useScanner } from './hooks/useScanner';
import { useTheme } from './hooks/useTheme';
import { useAuth } from './contexts/AuthContext';
import { useResponsiveLayout } from './hooks/useResponsiveLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ScannerInput } from './components/ScannerInput';
import { ZoneDisplay } from './components/ZoneDisplay';
import { ScanHistory } from './components/ScanHistory';
import { DashboardHeader } from './components/DashboardHeader';
import { DataViewer } from './components/DataViewer';
import { UserManagement } from './components/UserManagement';
import { UserProfile } from './components/UserProfile';
import { Sidebar } from './components/Sidebar';
import { DesktopLayout } from './components/DesktopLayout';
import { DesktopStatsPanel } from './components/DesktopStatsPanel';
import { DesktopHistoryPanel } from './components/DesktopHistoryPanel';
import { parseExcel, exportReport, exportScannedReport, exportPendingReport } from './services/excelService';

const AppContent: React.FC = () => {
  const {
    handleScan,
    lastScan,
    scanHistory,
    stats,
    connectionStatus,
    importData,
    packageMap,
    activeBatchId,
    activeBatchInfo,
    setActiveBatch,
    deleteBatch
  } = useScanner();

  const { theme, toggleTheme } = useTheme();
  const { currentUser, logout } = useAuth();
  const layout = useResponsiveLayout();
  const [showDataViewer, setShowDataViewer] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        // 先让用户输入车牌号
        const vehicleNumber = window.prompt('请输入车牌号（用于区分不同车次的数据）：');

        if (!vehicleNumber || vehicleNumber.trim() === '') {
          alert('车牌号不能为空，导入已取消');
          e.target.value = '';
          return;
        }

        const data = await parseExcel(e.target.files[0]);

        // 生成批次ID：车牌号_时间戳
        const batchId = `${vehicleNumber.trim()}_${Date.now()}`;
        const importTimestamp = new Date().toISOString();

        // 为每条数据添加车牌号和批次ID
        const dataWithBatch = data.map(item => ({
          ...item,
          vehicle_number: vehicleNumber.trim(),
          batch_id: batchId,
          imported_at: importTimestamp
        }));

        // 统计信息
        const emptyCount = dataWithBatch.filter(item => item.is_empty_tracking).length;
        const validCount = dataWithBatch.length - emptyCount;

        // 显示导入提示
        let message = `车牌号: ${vehicleNumber}\n准备导入 ${dataWithBatch.length} 条数据`;
        if (emptyCount > 0) {
          message += `\n其中包含 ${emptyCount} 条空单号记录（将被保留但无法扫描）`;
        }
        message += `\n\n有效单号: ${validCount} 条`;

        if (window.confirm(message + '\n\n是否继续导入？')) {
          await importData(dataWithBatch);
        }

        e.target.value = ''; // Reset file input
      } catch (err) {
        console.error(err);
        alert('文件解析失败，请确保格式正确\n\n支持的列名：单号、门店、分区');
      }
    }
  };

  const handleExportAll = () => {
    exportReport(Array.from(packageMap.values()));
  };

  const handleExportScanned = () => {
    exportScannedReport(Array.from(packageMap.values()));
  };

  const handleExportPending = () => {
    exportPendingReport(Array.from(packageMap.values()));
  };

  const handleViewData = () => {
    setShowDataViewer(true);
  };

  const handleStartScan = (batchId: string) => {
    setActiveBatch(batchId);
    console.log(`[批次扫描] 已切换到批次: ${batchId}`);
  };

  const handleDeleteBatch = async (batchId: string) => {
    try {
      await deleteBatch(batchId);
      alert('批次删除成功！');
    } catch (err) {
      console.error('删除批次失败:', err);
      alert('批次删除失败，请重试\n错误: ' + (err as Error).message);
    }
  };

  // PC端布局
  if (layout.isDesktop) {
    return (
      <>
        <DesktopLayout
          stats={
            <DesktopStatsPanel
              stats={stats}
              onMenuClick={() => setShowSidebar(true)}
              onViewData={handleViewData}
              onExport={handleExportAll}
              theme={theme}
            />
          }
          scanner={<ScannerInput onScan={handleScan} />}
          display={<ZoneDisplay lastScan={lastScan} />}
          history={<DesktopHistoryPanel history={scanHistory} theme={theme} />}
          connectionStatus={connectionStatus}
          theme={theme}
        />

        {/* Sidebar for Desktop */}
        <Sidebar
          isOpen={showSidebar}
          onClose={() => setShowSidebar(false)}
          onViewData={handleViewData}
          onImport={handleFileUpload}
          theme={theme}
          onToggleTheme={toggleTheme}
          onUserManagement={() => {
            setShowUserManagement(true);
            setShowSidebar(false);
          }}
          onUserProfile={() => {
            setShowUserProfile(true);
            setShowSidebar(false);
          }}
          onLogout={logout}
          currentUser={currentUser}
        />

        {/* Modals */}
        {showDataViewer && (
          <DataViewer
            data={Array.from(packageMap.values())}
            onClose={() => setShowDataViewer(false)}
            theme={theme}
            activeBatchId={activeBatchId}
            onStartScan={handleStartScan}
            onDeleteBatch={handleDeleteBatch}
          />
        )}

        {showUserManagement && (
          <div
            role="dialog"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1000,
              overflow: 'auto'
            }}>
            <div style={{
              minHeight: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem'
            }}>
              <div style={{
                background: 'white',
                borderRadius: '8px',
                width: '100%',
                maxWidth: '1200px',
                maxHeight: '90vh',
                overflow: 'auto',
                position: 'relative',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
              }}>
                <div style={{
                  position: 'sticky',
                  top: 0,
                  background: 'white',
                  borderBottom: '1px solid #e5e7eb',
                  padding: '1rem 2rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  zIndex: 10
                }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>用户管理</h2>
                  <button
                    onClick={() => setShowUserManagement(false)}
                    style={{
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '0.5rem 1rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                  >
                    关闭
                  </button>
                </div>
                <UserManagement />
              </div>
            </div>
          </div>
        )}

        {showUserProfile && (
          <div
            role="dialog"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1000,
              overflow: 'auto'
            }}>
            <div style={{
              minHeight: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem'
            }}>
              <div style={{
                background: 'white',
                borderRadius: '8px',
                width: '100%',
                maxWidth: '800px',
                maxHeight: '90vh',
                overflow: 'auto',
                position: 'relative',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
              }}>
                <div style={{
                  position: 'sticky',
                  top: 0,
                  background: 'white',
                  borderBottom: '1px solid #e5e7eb',
                  padding: '1rem 2rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  zIndex: 10
                }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>个人信息</h2>
                  <button
                    onClick={() => setShowUserProfile(false)}
                    style={{
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '0.5rem 1rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                  >
                    关闭
                  </button>
                </div>
                <UserProfile />
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // 移动端/平板布局
  return (
    <div className={`relative flex h-full w-full max-w-md flex-col shadow-2xl overflow-hidden mx-auto transition-colors ${
      theme === 'dark'
        ? 'bg-background-dark border-x border-white/5'
        : 'bg-white border-x border-gray-200'
    }`}>
      {/* Sidebar */}
      <Sidebar
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
        onViewData={handleViewData}
        onExportAll={handleExportAll}
        onExportScanned={handleExportScanned}
        onExportPending={handleExportPending}
        onImport={handleFileUpload}
        theme={theme}
        onToggleTheme={toggleTheme}
        onUserManagement={() => {
          setShowUserManagement(true);
          setShowSidebar(false);
        }}
        onUserProfile={() => {
          setShowUserProfile(true);
          setShowSidebar(false);
        }}
        onLogout={logout}
        currentUser={currentUser}
      />

      {/* 1. Header & Stats */}
      <DashboardHeader
        stats={stats}
        connectionStatus={connectionStatus}
        onMenuClick={() => setShowSidebar(true)}
      />

      {/* 2. Scanner Input Zone */}
      <div className="px-4 pt-3 pb-1 dark:bg-panel-bg bg-gray-50 z-10 transition-colors">
        <ScannerInput onScan={handleScan} />
      </div>

      {/* 3. Main Display Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 relative z-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] dark:from-primary/5 from-primary/10 via-transparent to-transparent">
        <ZoneDisplay lastScan={lastScan} />
      </main>

      {/* 4. History List */}
      <ScanHistory history={scanHistory} />

      {/* Decorative Footer Line */}
      <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/40 to-primary"></div>

      {/* 5. Data Viewer Modal */}
      {showDataViewer && (
        <DataViewer
          data={Array.from(packageMap.values())}
          onClose={() => setShowDataViewer(false)}
          theme={theme}
          activeBatchId={activeBatchId}
          onStartScan={handleStartScan}
          onDeleteBatch={handleDeleteBatch}
        />
      )}

      {/* 6. User Management Modal */}
      {showUserManagement && (
        <div
          role="dialog"
          style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          overflow: 'auto'
        }}>
          <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '8px',
              width: '100%',
              maxWidth: '1200px',
              maxHeight: '90vh',
              overflow: 'auto',
              position: 'relative',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}>
              <div style={{
                position: 'sticky',
                top: 0,
                background: 'white',
                borderBottom: '1px solid #e5e7eb',
                padding: '1rem 2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 10
              }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>用户管理</h2>
                <button
                  onClick={() => setShowUserManagement(false)}
                  style={{
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.5rem 1rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  关闭
                </button>
              </div>
              <UserManagement />
            </div>
          </div>
        </div>
      )}

      {/* 7. User Profile Modal */}
      {showUserProfile && (
        <div
          role="dialog"
          style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          overflow: 'auto'
        }}>
          <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '8px',
              width: '100%',
              maxWidth: '800px',
              maxHeight: '90vh',
              overflow: 'auto',
              position: 'relative',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}>
              <div style={{
                position: 'sticky',
                top: 0,
                background: 'white',
                borderBottom: '1px solid #e5e7eb',
                padding: '1rem 2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 10
              }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>个人信息</h2>
                <button
                  onClick={() => setShowUserProfile(false)}
                  style={{
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.5rem 1rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  关闭
                </button>
              </div>
              <UserProfile />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ProtectedRoute>
      <AppContent />
    </ProtectedRoute>
  );
};

export default App;