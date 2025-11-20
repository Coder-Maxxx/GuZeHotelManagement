
import React from 'react';
import { 
  LayoutDashboard, 
  PackageSearch, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Settings, 
  Boxes,
  History,
  LogOut,
  UserCircle
} from 'lucide-react';
import { ViewMode, User } from '../types';

interface SidebarProps {
  currentView: ViewMode;
  currentUser: User | null;
  onViewChange: (view: ViewMode) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, currentUser, onViewChange, onLogout }) => {
  
  const navItems = [
    { id: 'DASHBOARD' as ViewMode, label: '仪表盘总览', icon: LayoutDashboard, subtext: 'Summary' },
    { id: 'INBOUND' as ViewMode, label: '入库登记', icon: ArrowDownLeft, subtext: 'Receiving' },
    { id: 'OUTBOUND' as ViewMode, label: '出库登记', icon: ArrowUpRight, subtext: 'Delivery' },
    { id: 'INVENTORY' as ViewMode, label: '库存状态查询', icon: PackageSearch, subtext: 'Query' },
    { id: 'HISTORY' as ViewMode, label: '出入库记录', icon: History, subtext: 'History' },
    { id: 'SETTINGS' as ViewMode, label: '系统配置', icon: Settings, subtext: 'Customization' },
  ];

  return (
    <div className="w-20 lg:w-64 bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 shadow-xl z-40 transition-all duration-300">
      {/* Logo Area */}
      <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-800">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
          <Boxes className="text-white" size={24} />
        </div>
        <div className="hidden lg:block ml-3">
          <h1 className="font-bold text-lg leading-tight">库存管理系统</h1>
          <p className="text-xs text-slate-400">Hotel Inventory</p>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-6 space-y-2 px-2">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center justify-center lg:justify-start p-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={22} className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
              <div className="hidden lg:block ml-3 text-left">
                <p className={`font-medium text-sm ${isActive ? 'text-white' : 'text-slate-300'}`}>{item.label}</p>
                <p className={`text-[10px] ${isActive ? 'text-blue-200' : 'text-slate-500'}`}>{item.subtext}</p>
              </div>
              {isActive && <div className="hidden lg:block absolute right-2 w-1.5 h-8 bg-white/20 rounded-full" />}
            </button>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      {currentUser && (
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 lg:justify-start justify-center mb-3">
            <div className="bg-slate-700 p-2 rounded-full">
              <UserCircle size={20} className="text-slate-300" />
            </div>
            <div className="hidden lg:block overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{currentUser.username}</p>
              <p className="text-xs text-slate-400 capitalize">{currentUser.role}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center lg:justify-start gap-2 p-2 text-slate-400 hover:text-white hover:bg-red-500/20 hover:border-red-500/30 border border-transparent rounded-lg transition-all"
          >
            <LogOut size={18} />
            <span className="hidden lg:inline text-sm">退出登录</span>
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 pb-4 text-center lg:text-left hidden lg:block">
        <p className="text-[10px] text-slate-600">© 2025 酒店库存系统 v2.7</p>
      </div>
    </div>
  );
};

export default Sidebar;
