
import React, { useState } from 'react';
import { Plus, X, Settings as SettingsIcon, Database, RotateCcw } from 'lucide-react';
import { Category, Location } from '../types';

interface SettingsProps {
  categories: Category[];
  locations: Location[];
  onAddCategory: (name: string, color: string) => void;
  onAddLocation: (name: string) => void;
  onDeleteCategory: (id: string) => void;
  onDeleteLocation: (id: string) => void;
  onResetData: () => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  categories, 
  locations, 
  onAddCategory, 
  onAddLocation,
  onDeleteCategory,
  onDeleteLocation,
  onResetData
}) => {
  const [newCatName, setNewCatName] = useState('');
  const [newLocName, setNewLocName] = useState('');

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCatName.trim()) {
      // Random bright color for demo
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

  const inputClass = "flex-1 px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-400";

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Categories Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
              <SettingsIcon size={20} />
            </div>
            <h2 className="text-lg font-bold text-slate-800">分类管理</h2>
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
              <div key={cat.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg group border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }}></div>
                  <span className="font-medium text-slate-700">{cat.name}</span>
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
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              <SettingsIcon size={20} />
            </div>
            <h2 className="text-lg font-bold text-slate-800">仓库位置管理</h2>
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
              <div key={loc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg group border border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-white border border-slate-200 rounded flex items-center justify-center text-xs font-bold text-slate-500">
                    LOC
                  </span>
                  <span className="font-medium text-slate-700">{loc.name}</span>
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

      {/* Data Management */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
            <Database size={20} />
          </div>
          <h2 className="text-lg font-bold text-slate-800">数据管理</h2>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 gap-4">
          <div>
            <h4 className="font-medium text-slate-900">重置系统数据</h4>
            <p className="text-sm text-slate-500 mt-1">这将清除本地存储的所有数据，并恢复到初始的演示数据状态。此操作无法撤销。</p>
          </div>
          <button 
            onClick={onResetData}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-lg font-medium transition-all shadow-sm"
          >
            <RotateCcw size={16} />
            重置数据
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
