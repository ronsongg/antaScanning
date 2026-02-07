import React, { useState } from 'react';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  onClick?: () => void;
  submenu?: MenuItem[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onViewData: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onUserManagement?: () => void;
  onUserProfile?: () => void;
  onLogout?: () => void;
  currentUser?: any;
}

export const Sidebar: React.FC<Props> = ({
  isOpen,
  onClose,
  onViewData,
  onImport,
  theme,
  onToggleTheme,
  onUserManagement,
  onUserProfile,
  onLogout,
  currentUser
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const menuSections: MenuItem[] = [
    {
      id: 'data',
      label: '数据管理',
      icon: 'database',
      submenu: [
        { id: 'view-data', label: '批次管理', icon: 'inventory', onClick: onViewData },
        { id: 'import', label: '导入Excel', icon: 'upload_file' },
      ]
    },
    {
      id: 'user',
      label: '用户中心',
      icon: 'account_circle',
      submenu: [
        ...(onUserProfile ? [{ id: 'profile', label: '个人信息', icon: 'person', onClick: onUserProfile }] : []),
        ...(onUserManagement ? [{ id: 'management', label: '用户管理', icon: 'manage_accounts', onClick: onUserManagement }] : []),
      ]
    },
  ];

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  const handleMenuClick = (onClick?: () => void) => {
    if (onClick) {
      onClick();
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-80 dark:bg-panel-bg bg-white dark:border-white/10 border-gray-200 border-r shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 dark:border-white/10 border-gray-200 border-b">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">dashboard</span>
            </div>
            <div>
              <h2 className="dark:text-white text-gray-900 font-bold text-lg">工作台菜单</h2>
              <p className="dark:text-white/40 text-gray-500 text-xs">Anta Scanning System</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-8 flex items-center justify-center rounded-lg dark:bg-white/5 bg-gray-100 dark:hover:bg-white/10 hover:bg-gray-200 transition-colors"
          >
            <span className="material-symbols-outlined dark:text-white text-gray-700 text-xl">close</span>
          </button>
        </div>

        {/* User Info Card */}
        {currentUser && (
          <div className="mx-4 mt-4 p-4 rounded-lg dark:bg-white/5 bg-gray-100 border dark:border-white/10 border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="size-12 rounded-full dark:bg-primary/20 bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-2xl">account_circle</span>
              </div>
              <div className="flex-1">
                <p className="dark:text-white text-gray-900 font-bold text-sm">{currentUser.display_name}</p>
                <p className="dark:text-white/60 text-gray-600 text-xs">@{currentUser.username}</p>
              </div>
            </div>

            <div className="flex gap-2">
              {onUserProfile && (
                <button
                  onClick={() => {
                    onUserProfile();
                    onClose();
                  }}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg dark:bg-white/5 bg-white dark:hover:bg-white/10 hover:bg-gray-50 transition-colors border dark:border-white/10 border-gray-200"
                >
                  <span className="material-symbols-outlined text-primary text-sm">person</span>
                  <span className="dark:text-white text-gray-900 text-xs font-medium">个人信息</span>
                </button>
              )}
              {onLogout && (
                <button
                  onClick={() => {
                    if (confirm('确定要退出登录吗？')) {
                      onLogout();
                      onClose();
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg dark:bg-white/5 bg-white dark:hover:bg-white/10 hover:bg-gray-50 transition-colors border dark:border-white/10 border-gray-200"
                >
                  <span className="material-symbols-outlined text-error-red text-sm">logout</span>
                  <span className="text-error-red text-xs font-medium">退出</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Menu Content */}
        <div className="p-4 overflow-y-auto h-[calc(100%-88px)]">
          <nav className="space-y-2">
            {menuSections.map((section) => (
              <div key={section.id} className="mb-2">
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg dark:bg-white/5 bg-gray-100 dark:hover:bg-white/10 hover:bg-gray-200 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-xl">
                      {section.icon}
                    </span>
                    <span className="dark:text-white text-gray-900 font-medium">{section.label}</span>
                  </div>
                  <span
                    className={`material-symbols-outlined dark:text-white/40 text-gray-500 transition-transform duration-200 ${
                      expandedSection === section.id ? 'rotate-180' : ''
                    }`}
                  >
                    expand_more
                  </span>
                </button>

                {/* Submenu */}
                <div
                  className={`mt-2 ml-4 space-y-1 overflow-hidden transition-all duration-200 ${
                    expandedSection === section.id ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  {section.submenu?.map((item) => (
                    <div key={item.id}>
                      {item.id === 'import' ? (
                        <label className="flex items-center gap-3 px-4 py-3 rounded-lg dark:hover:bg-white/5 hover:bg-gray-100 transition-colors cursor-pointer group">
                          <span className="material-symbols-outlined text-primary/60 text-lg group-hover:text-primary transition-colors">
                            {item.icon}
                          </span>
                          <span className="dark:text-white/80 text-gray-700 text-sm dark:group-hover:text-white group-hover:text-gray-900 transition-colors">
                            {item.label}
                          </span>
                          <input
                            type="file"
                            className="hidden"
                            accept=".xlsx, .xls"
                            onChange={(e) => {
                              onImport(e);
                              onClose();
                            }}
                          />
                        </label>
                      ) : (
                        <button
                          onClick={() => handleMenuClick(item.onClick)}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg dark:hover:bg-white/5 hover:bg-gray-100 transition-colors group"
                        >
                          <span className="material-symbols-outlined text-primary/60 text-lg group-hover:text-primary transition-colors">
                            {item.icon}
                          </span>
                          <span className="dark:text-white/80 text-gray-700 text-sm dark:group-hover:text-white group-hover:text-gray-900 transition-colors">
                            {item.label}
                          </span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* Divider */}
          <div className="my-6 border-t border-white/10"></div>

          {/* Theme Toggle */}
          <div className="mb-4">
            <button
              onClick={onToggleTheme}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg dark:bg-white/5 bg-gray-100 dark:hover:bg-white/10 hover:bg-gray-200 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-xl">
                  {theme === 'dark' ? 'dark_mode' : 'light_mode'}
                </span>
                <span className="dark:text-white text-gray-900 font-medium">主题模式</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="dark:text-white/60 text-gray-600 text-sm">{theme === 'dark' ? '深色' : '浅色'}</span>
                <div className={`relative w-12 h-6 rounded-full transition-colors ${
                  theme === 'dark' ? 'bg-primary' : 'bg-gray-300'
                }`}>
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    theme === 'dark' ? 'translate-x-6' : 'translate-x-0'
                  }`}></div>
                </div>
              </div>
            </button>
          </div>

          {/* Additional Info/Actions */}
          <div className="space-y-3">
            <div className="px-4 py-3 bg-primary/10 border border-primary/20 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-lg">info</span>
                <div>
                  <p className="dark:text-white text-gray-900 font-medium text-sm mb-1">系统提示</p>
                  <p className="dark:text-white/60 text-gray-600 text-xs leading-relaxed">
                    使用扫描枪扫描单号，系统会自动识别并分配到对应分区。
                  </p>
                </div>
              </div>
            </div>

            <div className="px-4 py-3 dark:bg-white/5 bg-gray-100 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="dark:text-white/60 text-gray-600 text-xs">系统版本</span>
                <span className="dark:text-white text-gray-900 text-xs font-mono">v1.0.0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="dark:text-white/60 text-gray-600 text-xs">最后更新</span>
                <span className="dark:text-white text-gray-900 text-xs">2026-02-06</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
