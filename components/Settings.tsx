
import React, { useState } from 'react';
import { Plus, X, Settings as SettingsIcon, Database, RotateCcw, Code, Play, Copy, Check, ShieldAlert } from 'lucide-react';
import { Category, Location, User } from '../types';
import UserManagement from './UserManagement';
import { db } from '../services/storage';

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
  
  // SQL Import State
  const [sqlInput, setSqlInput] = useState('');
  const [executingSql, setExecutingSql] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  
  // Custom Confirm Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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

  const confirmExecuteSql = async () => {
    setShowConfirmModal(false);
    setExecutingSql(true);
    try {
      await db.executeSql(sqlInput);
      alert("✅ SQL 执行成功！请前往[库存状态查询]查看导入结果。");
      setSqlInput('');
    } catch (e: any) {
      alert(`❌ 执行失败: ${e.message}\n请检查 SQL 语法或 RPC 函数是否已在 Supabase 中创建。`);
    } finally {
      setExecutingSql(false);
    }
  };

  const handleExecuteClick = () => {
    if (!sqlInput.trim()) {
      alert("请输入 SQL 语句");
      return;
    }

    // --- 安全检查拦截器 ---
    const dangerousKeywords = ['DROP ', 'DELETE ', 'TRUNCATE ', 'ALTER ', 'DROP\n', 'DELETE\n'];
    const upperSql = sqlInput.toUpperCase();
    
    const foundRisk = dangerousKeywords.find(keyword => upperSql.includes(keyword));

    if (foundRisk) {
      alert(`🛑 安全拦截：检测到危险操作关键字 "${foundRisk.trim()}"。\n\n为了防止数据意外丢失，智能导入功能禁止删除或修改表结构。\n仅允许执行 INSERT (新增) 或 UPDATE (更新) 操作。`);
      return;
    }
    // --------------------

    setShowConfirmModal(true);
  };

  const aiPrompt = `请帮我把这张图片里的商品识别出来，并生成 SQL 插入语句。
为了确保存档记录，请对每个商品同时生成两句 SQL（分别插入 items 和 transactions 表）：

1. items 表：id (如 'imp_01'), name, quantity, unit, price, category, location (默认'总库房'), "lastUpdated" (NOW()), "minStockLevel" (10)。
2. transactions 表：id (如 'tx_imp_01'), "itemId" (对应上面的id), "itemName", type ('INBOUND'), quantity, timestamp (NOW()), "user" ('AI导入'), notes ('智能导入')。

请直接给我 SQL 代码，不要其他的。`;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(aiPrompt);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2000);
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
        <div className="space-y-6">
          {/* AI Smart Import / SQL Execute */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                <Code size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">智能导入 (SQL)</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">利用 AI 识别单据图片并生成 SQL，批量导入商品。</p>
              </div>
            </div>

            {/* AI Prompt Helper */}
            <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg border border-emerald-100 dark:border-emerald-900/30 text-sm">
               <div className="flex items-center justify-between mb-2">
                 <p className="font-bold text-emerald-800 dark:text-emerald-400">💡 AI 提示词模版 (发送给 ChatGPT/文心一言):</p>
                 <button 
                   onClick={handleCopyPrompt}
                   className="text-xs flex items-center gap-1 px-2 py-1 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                 >
                   {promptCopied ? <Check size={12} /> : <Copy size={12} />}
                   {promptCopied ? "已复制" : "一键复制"}
                 </button>
               </div>
               <div className="bg-white dark:bg-slate-900 p-3 rounded border border-emerald-100 dark:border-emerald-900/50 font-mono text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                 {aiPrompt}
               </div>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <textarea
                  className="w-full h-32 px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-mono text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  placeholder="在这里粘贴 AI 生成的 SQL 语句... 例如: INSERT INTO items (id, name...) VALUES ..."
                  value={sqlInput}
                  onChange={(e) => setSqlInput(e.target.value)}
                />
                {/* Security Badge */}
                <div className="absolute bottom-3 right-3 flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 select-none">
                   <ShieldAlert size={12} />
                   <span>安全模式: 已禁用 DELETE/DROP</span>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleExecuteClick}
                  disabled={executingSql || !sqlInput.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play size={16} />
                  {executingSql ? '执行中...' : '执行导入'}
                </button>
              </div>
            </div>
          </div>

          {/* Reset Data */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300">
                <Database size={20} />
              </div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">危险操作</h2>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30 gap-4">
              <div>
                <h4 className="font-medium text-red-800 dark:text-red-300">清空库存数量 (盘点重置)</h4>
                <p className="text-sm text-red-600 dark:text-red-400/80 mt-1">
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
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up border border-slate-100 dark:border-slate-700">
            <div className="p-6">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center text-yellow-600 dark:text-yellow-400 mb-4 mx-auto">
                <Code size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white text-center mb-2">确认执行 SQL 导入？</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
                您即将直接向数据库写入数据。请确保这段 SQL 代码是由 AI 生成并检查过的。
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors"
                >
                  取消
                </button>
                <button 
                  onClick={confirmExecuteSql}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 shadow-sm transition-colors"
                >
                  确认执行
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
