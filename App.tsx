import React, { useState } from 'react';
import { useScanner } from './hooks/useScanner';
import { useTheme } from './hooks/useTheme';
import { ScannerInput } from './components/ScannerInput';
import { ZoneDisplay } from './components/ZoneDisplay';
import { ScanHistory } from './components/ScanHistory';
import { DashboardHeader } from './components/DashboardHeader';
import { DataViewer } from './components/DataViewer';
import { Sidebar } from './components/Sidebar';
import { parseExcel, exportReport, exportScannedReport, exportPendingReport } from './services/excelService';

const App: React.FC = () => {
  const {
    handleScan,
    lastScan,
    scanHistory,
    stats,
    connectionStatus,
    importData,
    packageMap
  } = useScanner();

  const { theme, toggleTheme } = useTheme();
  const [showDataViewer, setShowDataViewer] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const data = await parseExcel(e.target.files[0]);

        // 统计信息
        const emptyCount = data.filter(item => item.is_empty_tracking).length;
        const validCount = data.length - emptyCount;

        // 显示导入提示
        let message = `准备导入 ${data.length} 条数据`;
        if (emptyCount > 0) {
          message += `\n其中包含 ${emptyCount} 条空单号记录（将被保留但无法扫描）`;
        }
        message += `\n\n有效单号: ${validCount} 条`;

        if (window.confirm(message + '\n\n是否继续导入？')) {
          await importData(data);
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
        />
      )}
    </div>
  );
};

export default App;