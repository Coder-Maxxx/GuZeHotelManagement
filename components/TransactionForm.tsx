
import React, { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, CheckCircle } from 'lucide-react';
import { InventoryItem, TransactionType } from '../types';

interface TransactionFormProps {
  type: TransactionType;
  items: InventoryItem[];
  onSubmit: (itemId: string, quantity: number, notes: string) => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ type, items, onSubmit }) => {
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);

  const isInbound = type === TransactionType.INBOUND;
  const selectedItem = items.find(i => i.id === selectedItemId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || quantity <= 0) return;
    
    onSubmit(selectedItemId, quantity, notes);
    
    // Reset form and show success
    setQuantity(1);
    setNotes('');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const inputClass = "w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none transition-all";

  return (
    <div className="max-w-2xl mx-auto">
      <div className={`bg-white rounded-xl shadow-lg overflow-hidden border-t-4 ${isInbound ? 'border-green-500' : 'border-orange-500'}`}>
        
        {/* Header */}
        <div className={`p-6 ${isInbound ? 'bg-green-50' : 'bg-orange-50'} flex items-center gap-4`}>
          <div className={`p-3 rounded-full ${isInbound ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
            {isInbound ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
          </div>
          <div>
            <h2 className={`text-xl font-bold ${isInbound ? 'text-green-800' : 'text-orange-800'}`}>
              {isInbound ? '入库登记' : '出库登记'}
            </h2>
            <p className={`text-sm ${isInbound ? 'text-green-600' : 'text-orange-600'}`}>
              {isInbound ? '登记新到达的库存。' : '记录库存使用或发出。'}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">选择商品</label>
            <select 
              required
              className={inputClass}
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
            >
              <option value="">-- 请选择商品 --</option>
              {items.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} (当前库存: {item.quantity} {item.unit})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                数量 {selectedItem && `(${selectedItem.unit})`}
              </label>
              <input 
                type="number" 
                min="1" 
                max={(!isInbound && selectedItem) ? selectedItem.quantity : undefined}
                required
                className={inputClass}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              />
              {!isInbound && selectedItem && (
                <p className="text-xs text-slate-500 mt-1">最大可用: {selectedItem.quantity}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">备注 / 单号</label>
              <input 
                type="text" 
                placeholder={isInbound ? "例如: 采购单号 #12345" : "例如: 客房部申请单 #99"}
                className={inputClass}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit"
              className={`w-full py-4 rounded-lg font-bold text-white shadow-md transform transition-all hover:-translate-y-0.5 active:translate-y-0 ${
                isInbound 
                  ? 'bg-green-600 hover:bg-green-700 shadow-green-200' 
                  : 'bg-orange-500 hover:bg-orange-600 shadow-orange-200'
              }`}
            >
              {isInbound ? '确认入库' : '确认出库'}
            </button>
          </div>
        </form>

        {/* Success Message */}
        {showSuccess && (
          <div className="absolute top-4 right-4 bg-slate-800 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in-down">
            <CheckCircle className="text-green-400" size={20} />
            <div>
              <p className="font-medium">交易已记录</p>
              <p className="text-xs text-slate-400">库存更新成功。</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionForm;
