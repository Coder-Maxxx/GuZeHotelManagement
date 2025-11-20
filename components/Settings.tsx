
import React, { useState } from 'react';
import { Plus, X, Settings as SettingsIcon, Database, RotateCcw } from 'lucide-react';
import { Category, Location, User } from '../types';
import UserManagement from './UserManagement';

interface SettingsProps {
  categories: Category[];
  locations: Location[];
  currentUser: User;
  onAddCategory: (name: string, color: string) => void;
  onAddLocation: (name: string) => void;
  onDeleteCategory: (id: string) => void;
  onDeleteLocation: (id: string) => void;
  onResetData: () => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  categories, 
  locations, 
  currentUser,
  onAddCategory, 
  onAddLocation,
  onDeleteCategory,
  onDeleteLocation,
  onResetData
}) => {
  const [newCatName, setNewCatName] = useState('');
  const [newLocName, setNewLocName] = useState('');
  
  const isAdmin = currentUser.role === 'admin';

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCatName.trim()) {
      const colors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      onAddCategory(newCatName.trim(), randomColor);
      setNewCatName('');
    }
  };

  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLocName.trim()) {
      onAddLocation(newLocName.trim());
      setNewLocName('');
    }
  };

  const inputClass = "flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-600 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500";

  return (
    <div className="space-y-8">
      {/* 用户管理 - 放在最上面，因为这是新增的重要功能 */}
      <UserManagement currentUser={currentUser} />

      {/* 管理员专区：分类和位置 */}
      {isAdmin ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Categories Settings */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                <SettingsIcon size={20} />
              </div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">分类管理</h2>
            </div>

            <form onSubmit={handleAddCategory} className="flex gap-2 mb-6">
              <input 
                type="text" 
                placeholder="新分类名称..." 
                className={inputClass}
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
              />
              <button type="submit" className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 transition-colors">
                <Plus size={24} />
              </button>
            </form>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg group border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }}></div>
                    <span className="font-medium text-slate-700 dark:text-slate-200">{cat.name}</span>
                  </div>
                  <button 
                    onClick={() => onDeleteCategory(cat.id)}
                    className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Location Settings */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                <SettingsIcon size={20} />
              </div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">仓库位置管理</h2>
            </div>

            <form onSubmit={handleAddLocation} className="flex gap-2 mb-6">
              <input 
                type="text" 
                placeholder="新位置名称..." 
                className={inputClass}
                value={newLocName}
                onChange={(e) => setNewLocName(e.target.value)}
              />
              <button type="submit" className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors">
                <Plus size={24} />
              </button>
            </form>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {locations.map(loc => (
                <div key={loc.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg group border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-300">
                      LOC
                    </span>
                    <span className="font-medium text-slate-700 dark:text-slate-200">{loc.name}</span>
                  </div>
                  <button 
                    onClick={() => onDeleteLocation(loc.id)}
                    className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-center border border-slate-200 dark:border-slate-700">
          仅管理员可配置分类和仓库位置。
        </div>
      )}

      {/* Data Management - Admin Only */}
      {isAdmin && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300">
              <Database size={20} />
            </div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">数据管理</h2>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-200 dark:border-slate-700 gap-4">
            <div>
              <h4 className="font-medium text-slate-900 dark:text-white">清空库存数量 (盘点重置)</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                此操作将保留所有商品资料、分类和位置信息，但会把<b>所有库存数量归零</b>，并<b>清空所有出入库历史记录</b>。<br/>
                通常用于新一轮盘点开始前。此操作不可撤销。
              </p>
            </div>
            <button 
              onClick={onResetData}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 rounded-lg font-medium transition-all shadow-sm whitespace-nowrap"
            >
              <RotateCcw size={16} />
              库存归零
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;