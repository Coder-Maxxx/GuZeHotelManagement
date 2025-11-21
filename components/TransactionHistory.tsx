
import React, { useState } from 'react';
import { Search, ArrowDownLeft, ArrowUpRight, RotateCcw, Calendar, User, FileText, History, Download, CheckSquare, Square } from 'lucide-react';
import { Transaction, TransactionType } from '../types';
import * as XLSX from 'xlsx';

interface TransactionHistoryProps {
  transactions: Transaction[];
  onUndo: (transaction: Transaction) => void;
  onBatchUndo?: (transactions: Transaction[]) => void; // New prop
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions, onUndo, onBatchUndo }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredTransactions = transactions.filter(t => 
    t.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.notes && t.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Selection Logic
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredTransactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTransactions.map(t => t.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleBatchUndoAction = () => {
    if (onBatchUndo) {
      const selectedTxs = transactions.filter(t => selectedIds.has(t.id));
      if (window.confirm(`确定要撤销选中的 ${selectedTxs.length} 条记录吗？库存将自动回滚。`)) {
        onBatchUndo(selectedTxs);
        setSelectedIds(new Set());
      }
    }
  };

  const handleExport = () => {
    const headers = ['交易ID', '商品名称', '类型', '数量', '操作人', '备注', '时间'];
    const data = filteredTransactions.map(t => ([
      t.id,
      t.itemName,
      t.type === TransactionType.INBOUND ? '入库' : '出库',
      t.type === TransactionType.INBOUND ? t.quantity : -t.quantity,
      t.user,
      t.notes || '',
      new Date(t.timestamp).toLocaleString('zh-CN')
    ]));

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "出入库记录");
    XLSX.writeFile(wb, `出入库记录_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col h-full animate-fade-in">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">出入库历史记录</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">查看所有库存变动明细，支持撤销最近的操作。</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-center">
          {selectedIds.size > 0 && (
            <button 
              onClick={handleBatchUndoAction}
              className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
            >
              <RotateCcw size={18} />
              批量撤销 ({selectedIds.size})
            </button>
          )}

          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 w-full sm:w-64 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white dark:focus-within:bg-slate-700 transition-all">
            <Search size={18} className="text-slate-400 dark:text-slate-400" />
            <input 
              type="text" 
              placeholder="搜索商品、用户或备注..." 
              className="bg-transparent border-none outline-none text-sm w-full text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button 
            onClick={handleExport}
            className="flex items-center justify-center gap-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
            title="导出为 Excel 表格"
          >
            <Download size={18} />
            导出表格
          </button>
        </div>
      </div>

      {/* List Header with Select All */}
      {filteredTransactions.length > 0 && (
        <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/30 flex items-center">
          <button onClick={toggleSelectAll} className="text-slate-400 hover:text-blue-500 mr-4">
            {selectedIds.size > 0 && selectedIds.size === filteredTransactions.length ? <CheckSquare size={18} className="text-blue-500" /> : <Square size={18} />}
          </button>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">全选 / 反选本页</span>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-auto custom-scrollbar p-4">
        <div className="space-y-3">
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((tx) => {
              const isInbound = tx.type === TransactionType.INBOUND;
              const isSelected = selectedIds.has(tx.id);
              return (
                <div key={tx.id} className={`border border-slate-100 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow flex flex-col md:flex-row gap-4 items-start md:items-center ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-slate-800'}`}>
                  
                  {/* Checkbox */}
                  <button onClick={() => toggleSelectOne(tx.id)} className="text-slate-400 hover:text-blue-500">
                    {isSelected ? <CheckSquare size={18} className="text-blue-500" /> : <Square size={18} />}
                  </button>

                  {/* Icon */}
                  <div className={`p-3 rounded-full flex-shrink-0 ${isInbound ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'}`}>
                    {isInbound ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                  </div>

                  {/* Main Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-slate-800 dark:text-white text-base truncate">{tx.itemName}</h3>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${isInbound ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'}`}>
                        {isInbound ? '入库' : '出库'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(tx.timestamp).toLocaleString('zh-CN')}
                      </span>
                      <span className="flex items-center gap-1">
                        <User size={12} />
                        {tx.user}
                      </span>
                      {tx.notes && (
                        <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 px-1.5 rounded">
                          <FileText size={12} />
                          {tx.notes}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="flex flex-col items-end min-w-[80px]">
                    <span className={`text-lg font-bold ${isInbound ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                      {isInbound ? '+' : '-'}{tx.quantity}
                    </span>
                  </div>

                  {/* Action */}
                  <div className="border-l border-slate-100 dark:border-slate-700 pl-4 ml-2">
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if(window.confirm(`确定要撤销这笔 "${tx.itemName}" 的${isInbound ? '入库' : '出库'}记录吗？\n库存将会回滚。`)) {
                          onUndo(tx);
                        }
                      }}
                      className="flex items-center gap-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded transition-colors text-sm font-medium cursor-pointer"
                      title="撤销此操作并回滚库存"
                    >
                      <RotateCcw size={14} />
                      撤销
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500">
              <History size={48} className="mb-4 opacity-20" />
              <p>暂无交易记录</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionHistory;
