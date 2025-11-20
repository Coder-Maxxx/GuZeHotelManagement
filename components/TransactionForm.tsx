
import React, { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, CheckCircle, Plus, Trash2 } from 'lucide-react';
import { InventoryItem, TransactionType } from '../types';

interface TransactionFormProps {
  type: TransactionType;
  items: InventoryItem[];
  onSubmit: (entries: { itemId: string; quantity: number; notes: string }[]) => void;
}

interface Entry {
  id: number;
  itemId: string;
  quantity: number;
  notes: string;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ type, items, onSubmit }) => {
  const [entries, setEntries] = useState<Entry[]>([
    { id: Date.now(), itemId: '', quantity: 1, notes: '' }
  ]);
  const [showSuccess, setShowSuccess] = useState(false);

  const isInbound = type === TransactionType.INBOUND;

  const handleAddRow = () => {
    setEntries([...entries, { id: Date.now(), itemId: '', quantity: 1, notes: '' }]);
  };

  const handleRemoveRow = (id: number) => {
    if (entries.length > 1) {
      setEntries(entries.filter(e => e.id !== id));
    }
  };

  const handleEntryChange = (id: number, field: keyof Entry, value: any) => {
    setEntries(entries.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    const validEntries = entries.filter(e => e.itemId && e.quantity > 0);
    if (validEntries.length === 0) return;

    onSubmit(validEntries.map(({ itemId, quantity, notes }) => ({ itemId, quantity, notes })));
    
    // Reset form and show success
    setEntries([{ id: Date.now(), itemId: '', quantity: 1, notes: '' }]);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const inputClass = "w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm";

  return (
    <div className="max-w-4xl mx-auto">
      <div className={`bg-white rounded-xl shadow-lg overflow-hidden border-t-4 ${isInbound ? 'border-green-500' : 'border-orange-500'}`}>
        
        {/* Header */}
        <div className={`p-6 ${isInbound ? 'bg-green-50' : 'bg-orange-50'} flex items-center justify-between`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${isInbound ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
              {isInbound ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
            </div>
            <div>
              <h2 className={`text-xl font-bold ${isInbound ? 'text-green-800' : 'text-orange-800'}`}>
                {isInbound ? '批量入库登记' : '批量出库登记'}
              </h2>
              <p className={`text-sm ${isInbound ? 'text-green-600' : 'text-orange-600'}`}>
                {isInbound ? '登记新到达的库存商品。' : '记录库存消耗或领用。'}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {entries.map((entry, index) => {
              const selectedItem = items.find(i => i.id === entry.itemId);
              return (
                <div key={entry.id} className="flex flex-col md:flex-row gap-4 items-start md:items-center p-4 bg-slate-50 rounded-lg border border-slate-200 relative group">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-200 rounded-l-lg group-hover:bg-blue-400 transition-colors"></div>
                  
                  {/* Index */}
                  <span className="text-slate-400 font-medium text-sm w-6 text-center">{index + 1}</span>

                  {/* Item Select */}
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-semibold text-slate-500 mb-1 md:hidden">商品</label>
                    <select 
                      required
                      className={inputClass}
                      value={entry.itemId}
                      onChange={(e) => handleEntryChange(entry.id, 'itemId', e.target.value)}
                    >
                      <option value="">-- 选择商品 --</option>
                      {items.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name} (现有: {item.quantity} {item.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity */}
                  <div className="w-full md:w-32">
                     <label className="block text-xs font-semibold text-slate-500 mb-1 md:hidden">数量</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        min="1" 
                        max={(!isInbound && selectedItem) ? selectedItem.quantity : undefined}
                        required
                        className={inputClass}
                        value={entry.quantity}
                        onChange={(e) => handleEntryChange(entry.id, 'quantity', parseInt(e.target.value) || 0)}
                      />
                      {selectedItem && <span className="absolute right-3 top-2 text-xs text-slate-400">{selectedItem.unit}</span>}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-semibold text-slate-500 mb-1 md:hidden">备注</label>
                    <input 
                      type="text" 
                      placeholder={isInbound ? "采购单号/来源" : "领用人/用途"}
                      className={inputClass}
                      value={entry.notes}
                      onChange={(e) => handleEntryChange(entry.id, 'notes', e.target.value)}
                    />
                  </div>

                  {/* Remove Button */}
                  <div className="w-full md:w-auto flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(entry.id)}
                      disabled={entries.length === 1}
                      className={`p-2 rounded-lg transition-colors ${entries.length === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
            <button
              type="button"
              onClick={handleAddRow}
              className="flex items-center gap-2 text-blue-600 font-medium hover:text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors w-full sm:w-auto justify-center"
            >
              <Plus size={18} />
              添加一行
            </button>

            <button 
              type="submit"
              className={`w-full sm:w-auto px-8 py-3 rounded-lg font-bold text-white shadow-md transform transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 ${
                isInbound 
                  ? 'bg-green-600 hover:bg-green-700 shadow-green-200' 
                  : 'bg-orange-500 hover:bg-orange-600 shadow-orange-200'
              }`}
            >
              {isInbound ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
              确认提交 {entries.length} 项{isInbound ? '入库' : '出库'}
            </button>
          </div>
        </form>

        {/* Success Message */}
        {showSuccess && (
          <div className="absolute top-4 right-4 bg-slate-800 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in-down z-50">
            <CheckCircle className="text-green-400" size={20} />
            <div>
              <p className="font-medium">批量交易已记录</p>
              <p className="text-xs text-slate-400">库存更新成功。</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionForm;
