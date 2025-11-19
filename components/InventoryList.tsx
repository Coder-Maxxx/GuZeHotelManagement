
import React, { useState, useMemo } from 'react';
import { Search, Plus, Filter, Edit2, Trash2, Info, Download } from 'lucide-react';
import { InventoryItem, Category, Location } from '../types';

interface InventoryListProps {
  items: InventoryItem[];
  categories: Category[];
  locations: Location[];
  onAddItem: (item: Omit<InventoryItem, 'id' | 'lastUpdated'>) => void;
  onUpdateItem: (item: InventoryItem) => void;
  onDeleteItem: (id: string) => void;
}

const InventoryList: React.FC<InventoryListProps> = ({ 
  items, 
  categories, 
  locations, 
  onAddItem, 
  onUpdateItem,
  onDeleteItem 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Add Modal State
  const [newItem, setNewItem] = useState({
    name: '',
    category: categories[0]?.name || '',
    location: locations[0]?.name || '',
    quantity: 0,
    unit: '个',
    minStockLevel: 10,
    price: 0,
    description: '',
  });

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchTerm, filterCategory]);

  const handleExport = () => {
    // CSV Header
    const headers = ['商品名称', '分类', '位置', '当前数量', '单位', '单价(¥)', '总价值(¥)', '最低库存预警', '备注/规格', '更新时间'];
    
    // Map items to CSV rows
    const rows = filteredItems.map(item => [
      `"${item.name.replace(/"/g, '""')}"`, // Escape double quotes
      `"${item.category}"`,
      `"${item.location}"`,
      item.quantity,
      item.unit,
      item.price.toFixed(2),
      (item.quantity * item.price).toFixed(2),
      item.minStockLevel,
      `"${(item.description || '').replace(/"/g, '""')}"`,
      `"${new Date(item.lastUpdated).toLocaleString('zh-CN')}"`
    ]);

    // Combine header and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create a Blob with BOM (Byte Order Mark) for correct Chinese display in Excel
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `库存清单_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddItem(newItem);
    setIsAddModalOpen(false);
    // Reset form
    setNewItem({
      name: '',
      category: categories[0]?.name || '',
      location: locations[0]?.name || '',
      quantity: 0,
      unit: '个',
      minStockLevel: 10,
      price: 0,
      description: '',
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      onUpdateItem(editingItem);
      setEditingItem(null);
    }
  };

  const inputBaseClass = "w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-400";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col h-full animate-fade-in">
      {/* Toolbar */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 w-full sm:w-72 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all">
          <Search size={18} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="搜索商品名称..." 
            className="bg-transparent border-none outline-none text-sm w-full text-slate-900 placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <div className="relative">
            <select 
              className="appearance-none pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white cursor-pointer transition-all"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="All">所有分类</option>
              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
          
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
            title="导出为CSV (Excel)"
          >
            <Download size={18} />
            导出表格
          </button>

          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Plus size={18} />
            添加商品
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">商品信息</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">分类/位置</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">库存</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">价值</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">状态</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredItems.length > 0 ? (
              filteredItems.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="p-4 max-w-xs">
                    <div className="font-medium text-slate-900">{item.name}</div>
                    <div className="flex flex-col gap-0.5 mt-0.5">
                      {item.description && (
                        <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded w-fit border border-amber-100 mt-1 flex items-center gap-1">
                          <Info size={10} /> {item.description}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1 items-start">
                      <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium border border-slate-200">
                        {item.category}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        {item.location}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="font-semibold text-slate-900 text-lg">{item.quantity}</div>
                    <div className="text-xs text-slate-500">{item.unit}</div>
                  </td>
                  <td className="p-4 text-right text-sm text-slate-700">
                    <div className="font-medium">¥{(item.quantity * item.price).toFixed(2)}</div>
                    <div className="text-xs text-slate-400">@ ¥{item.price}</div>
                  </td>
                  <td className="p-4 text-center">
                    {item.quantity <= item.minStockLevel ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200 animate-pulse">
                        库存不足
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                        库存充足
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setEditingItem(item)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors border border-transparent hover:border-blue-200"
                        title="编辑"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => onDeleteItem(item.id)}
                        className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors border border-transparent hover:border-red-200"
                        title="删除"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-12 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <Search size={32} className="opacity-20" />
                    <p>未找到匹配的商品。</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in-up">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">新增库存商品</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">&times;</button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">名称 <span className="text-red-500">*</span></label>
                  <input 
                    required type="text" 
                    className={inputBaseClass}
                    value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">分类</label>
                  <select 
                    className={inputBaseClass}
                    value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})}
                  >
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">位置</label>
                  <select 
                    className={inputBaseClass}
                    value={newItem.location} onChange={e => setNewItem({...newItem, location: e.target.value})}
                  >
                    {locations.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">初始数量</label>
                  <input 
                    type="number" min="0"
                    className={inputBaseClass}
                    value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: parseInt(e.target.value) || 0})} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">单位</label>
                  <input 
                    type="text" placeholder="例如: 个"
                    className={inputBaseClass}
                    value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})} 
                  />
                </div>
                 <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">单价 (¥)</label>
                  <input 
                    type="number" min="0" step="0.01"
                    className={inputBaseClass}
                    value={newItem.price} onChange={e => setNewItem({...newItem, price: parseFloat(e.target.value) || 0})} 
                  />
                </div>
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">最低库存预警值</label>
                  <input 
                    type="number" min="0"
                    className={inputBaseClass}
                    value={newItem.minStockLevel} onChange={e => setNewItem({...newItem, minStockLevel: parseInt(e.target.value) || 0})} 
                  />
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">备注 / 规格说明</label>
                  <input 
                    type="text"
                    placeholder="例如：一箱4桶"
                    className={inputBaseClass}
                    value={newItem.description || ''} onChange={e => setNewItem({...newItem, description: e.target.value})} 
                  />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                >
                  取消
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm transition-colors"
                >
                  保存商品
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in-up">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">编辑商品信息</h3>
              <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-slate-600 transition-colors">&times;</button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">名称 <span className="text-red-500">*</span></label>
                  <input 
                    required type="text" 
                    className={inputBaseClass}
                    value={editingItem.name} 
                    onChange={e => setEditingItem({...editingItem, name: e.target.value})} 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">分类</label>
                  <select 
                    className={inputBaseClass}
                    value={editingItem.category} 
                    onChange={e => setEditingItem({...editingItem, category: e.target.value})}
                  >
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">位置</label>
                  <select 
                    className={inputBaseClass}
                    value={editingItem.location} 
                    onChange={e => setEditingItem({...editingItem, location: e.target.value})}
                  >
                    {locations.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">当前数量</label>
                  <input 
                    type="number" min="0"
                    className={inputBaseClass}
                    value={editingItem.quantity} 
                    onChange={e => setEditingItem({...editingItem, quantity: parseInt(e.target.value) || 0})} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">单位</label>
                  <input 
                    type="text"
                    className={inputBaseClass}
                    value={editingItem.unit} 
                    onChange={e => setEditingItem({...editingItem, unit: e.target.value})} 
                  />
                </div>
                 <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">单价 (¥)</label>
                  <input 
                    type="number" min="0" step="0.01"
                    className={inputBaseClass}
                    value={editingItem.price} 
                    onChange={e => setEditingItem({...editingItem, price: parseFloat(e.target.value) || 0})} 
                  />
                </div>
              </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">最低库存预警值</label>
                  <input 
                    type="number" min="0"
                    className={inputBaseClass}
                    value={editingItem.minStockLevel} 
                    onChange={e => setEditingItem({...editingItem, minStockLevel: parseInt(e.target.value) || 0})} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">备注 / 规格说明</label>
                  <input 
                    type="text"
                    className={inputBaseClass}
                    value={editingItem.description || ''} onChange={e => setEditingItem({...editingItem, description: e.target.value})} 
                  />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                >
                  取消
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm transition-colors"
                >
                  保存修改
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryList;
