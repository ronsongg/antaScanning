import React, { useState } from 'react';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  onClick?: () => void;
  submenu?: MenuItem[];
}

interface Props {
  onViewData: () => void;
  onExportAll: () => void;
  onExportScanned: () => void;
  onExportPending: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const MenuDropdown: React.FC<Props> = ({
  onViewData,
  onExportAll,
  onExportScanned,
  onExportPending,
  onImport
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

  const menuItems: MenuItem[] = [
    {
      id: 'data',
      label: '数据管理',
      icon: 'database',
      submenu: [
        { id: 'view-data', label: '查看数据', icon: 'visibility', onClick: onViewData },
        { id: 'import', label: '导入Excel', icon: 'upload_file' },
      ]
    },
    {
      id: 'export',
      label: '导出报表',
      icon: 'download',
      submenu: [
        { id: 'export-all', label: '导出全部', icon: 'description', onClick: onExportAll },
        { id: 'export-scanned', label: '已扫描记录', icon: 'check_circle', onClick: onExportScanned },
        { id: 'export-pending', label: '未扫描记录', icon: 'pending', onClick: onExportPending },
      ]
    },
  ];

  return (
    <div
      className="relative"
      onMouseLeave={() => {
        setIsOpen(false);
        setActiveSubmenu(null);
      }}
    >
      <button
        className="flex size-8 items-center justify-center rounded bg-white/5 hover:bg-white/10 transition-colors"
        onMouseEnter={() => setIsOpen(true)}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="material-symbols-outlined text-white text-xl">menu</span>
      </button>

      {/* Primary Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-panel-bg border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
          {menuItems.map((item) => (
            <div key={item.id} className="relative">
              <button
                className="w-full flex items-center justify-between px-4 py-3 text-sm text-white hover:bg-white/5 transition-colors group"
                onMouseEnter={() => setActiveSubmenu(item.id)}
                onClick={() => {
                  if (!item.submenu && item.onClick) {
                    item.onClick();
                    setIsOpen(false);
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-base text-primary">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.submenu && (
                  <span className="material-symbols-outlined text-sm text-white/40">chevron_right</span>
                )}
              </button>

              {/* Secondary Dropdown */}
              {item.submenu && activeSubmenu === item.id && (
                <div className="absolute left-full top-0 ml-1 w-52 bg-panel-bg border border-white/10 rounded-lg shadow-xl overflow-hidden">
                  {item.submenu.map((subItem) => (
                    <div key={subItem.id}>
                      {subItem.id === 'import' ? (
                        <label className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/5 transition-colors cursor-pointer">
                          <span className="material-symbols-outlined text-base text-primary/80">{subItem.icon}</span>
                          <span>{subItem.label}</span>
                          <input
                            type="file"
                            className="hidden"
                            accept=".xlsx, .xls"
                            onChange={(e) => {
                              onImport(e);
                              setIsOpen(false);
                              setActiveSubmenu(null);
                            }}
                          />
                        </label>
                      ) : (
                        <button
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/5 transition-colors"
                          onClick={() => {
                            if (subItem.onClick) {
                              subItem.onClick();
                            }
                            setIsOpen(false);
                            setActiveSubmenu(null);
                          }}
                        >
                          <span className="material-symbols-outlined text-base text-primary/80">{subItem.icon}</span>
                          <span>{subItem.label}</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
