
import React, { useState } from 'react';
import { Search, ArrowDownLeft, ArrowUpRight, RotateCcw, Calendar, User, FileText, History } from 'lucide-react';
import { Transaction, TransactionType } from '../types';

interface TransactionHistoryProps {
  transactions: Transaction[];
  onUndo: (transaction: Transaction) => void;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions, onUndo }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTransactions = transactions.filter(t => 
    t.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.notes && t.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col h-full animate-fade-in">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">出入库历史记录</h2>
          <p className="text-sm text-slate-500">查看所有库存变动明细，支持撤销最近的操作。</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 w-full sm:w-72 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all">
          <Search size={18} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="搜索商品、用户或备注..." 
            className="bg-transparent border-none outline-none text-sm w-full text-slate-900 placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto custom-scrollbar p-4">
        <div className="space-y-3">
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((tx) => {
              const isInbound = tx.type === TransactionType.INBOUND;
              return (
                <div key={tx.id} className="bg-white border border-slate-100 rounded-lg p-4 hover:shadow-md transition-shadow flex flex-col md:flex-row gap-4 items-start md:items-center">
                  {/* Icon */}
                  <div className={`p-3 rounded-full flex-shrink-0 ${isInbound ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                    {isInbound ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                  </div>

                  {/* Main Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-slate-800 text-base truncate">{tx.itemName}</h3>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${isInbound ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {isInbound ? '入库' : '出库'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(tx.timestamp).toLocaleString('zh-CN')}
                      </span>
                      <span className="flex items-center gap-1">
                        <User size={12} />
                        {tx.user}
                      </span>
                      {tx.notes && (
                        <span className="flex items-center gap-1 text-slate-600 bg-slate-50 px-1.5 rounded">
                          <FileText size={12} />
                          {tx.notes}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="flex flex-col items-end min-w-[80px]">
                    <span className={`text-lg font-bold ${isInbound ? 'text-green-600' : 'text-orange-600'}`}>
                      {isInbound ? '+' : '-'}{tx.quantity}
                    </span>
                  </div>

                  {/* Action */}
                  <div className="border-l border-slate-100 pl-4 ml-2">
                    <button 
type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if(window.confirm(`确定要撤销这笔 "${tx.itemName}" 的${isInbound ? '入库' : '出库'}记录吗？\n库存将会回滚。`)) {
                          onUndo(tx);
                        }
                      }}
                      className="flex items-center gap-1 text-slate-400 hover:text-red-500 hover:bg-red-50 px-3 py-1.5 rounded transition-colors text-sm font-medium cursor-pointer"
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
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
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
