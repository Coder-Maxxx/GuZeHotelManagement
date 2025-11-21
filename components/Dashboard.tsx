
import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend 
} from 'recharts';
import { AlertTriangle, Package, ArrowDownLeft, ArrowUpRight, TrendingUp, Database } from 'lucide-react';
import { InventoryItem, Transaction, Category, TransactionType } from '../types';

interface DashboardProps {
  items: InventoryItem[];
  transactions: Transaction[];
  categories: Category[];
  onInitialize?: () => void;
  onViewLowStock?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ items, transactions, categories, onInitialize, onViewLowStock }) => {
  
  // If no items, show initialization prompt
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6 p-8 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
          <Database size={40} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">数据库已连接，但暂无数据</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
             您可以手动添加商品，或者一键写入演示数据来快速体验系统功能。
          </p>
        </div>
        {onInitialize && (
          <button 
            onClick={onInitialize}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-blue-900/30 transition-all flex items-center gap-2"
          >
            <Database size={18} />
            初始化演示数据
          </button>
        )}
      </div>
    );
  }

  // Calculate stats
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalValue = items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
  const lowStockItems = items.filter(item => item.quantity <= item.minStockLevel);
  
  const inboundCount = transactions.filter(t => t.type === TransactionType.INBOUND).length;
  const outboundCount = transactions.filter(t => t.type === TransactionType.OUTBOUND).length;

  // Prepare chart data
  const categoryData = categories.map(cat => ({
    name: cat.name,
    value: items.filter(i => i.category === cat.name).length,
    color: cat.color
  })).filter(d => d.value > 0);

  const lowStockData = lowStockItems.map(item => ({
    name: item.name,
    stock: item.quantity,
    min: item.minStockLevel
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">库存总价值</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">¥{totalValue.toLocaleString()}</h3>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full text-blue-600 dark:text-blue-400">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">商品总数</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{totalItems.toLocaleString()}</h3>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-full text-emerald-600 dark:text-emerald-400">
            <Package size={24} />
          </div>
        </div>

        <div 
          onClick={onViewLowStock}
          className={`bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between cursor-pointer hover:shadow-md transition-all group relative overflow-hidden`}
        >
          <div className="relative z-10">
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">库存预警</p>
            <h3 className={`text-2xl font-bold ${lowStockItems.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-white'}`}>
              {lowStockItems.length}
            </h3>
          </div>
          <div className={`p-3 rounded-full relative z-10 ${lowStockItems.length > 0 ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'bg-slate-50 dark:bg-slate-700 text-slate-400 dark:text-slate-500'}`}>
            <AlertTriangle size={24} />
          </div>
          {/* Hover indicator */}
          <div className="absolute inset-0 bg-slate-50 dark:bg-slate-700/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-center space-y-2">
           <div className="flex items-center justify-between">
              <span className="flex items-center text-sm text-slate-600 dark:text-slate-300"><ArrowDownLeft className="w-4 h-4 mr-1 text-green-500" /> 入库单</span>
              <span className="font-semibold text-slate-800 dark:text-white">{inboundCount}</span>
           </div>
           <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div className="bg-green-500 h-full" style={{ width: `${(inboundCount / (inboundCount + outboundCount || 1)) * 100}%` }}></div>
           </div>
           <div className="flex items-center justify-between">
              <span className="flex items-center text-sm text-slate-600 dark:text-slate-300"><ArrowUpRight className="w-4 h-4 mr-1 text-orange-500" /> 出库单</span>
              <span className="font-semibold text-slate-800 dark:text-white">{outboundCount}</span>
           </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">各类库存占比</h3>
          <div className="h-64 w-full">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
                暂无分类数据
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Warning Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">低库存预警</h3>
            {lowStockItems.length > 0 && (
               <button 
                 onClick={onViewLowStock}
                 className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
               >
                 查看详情
               </button>
            )}
          </div>
          {lowStockData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lowStockData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.2} />
                  <XAxis type="number" tick={{ fill: '#94a3b8' }} />
                  <YAxis type="category" dataKey="name" width={100} tick={{fontSize: 12, fill: '#94a3b8'}} />
                  <Tooltip cursor={{fill: 'rgba(239, 68, 68, 0.1)'}} contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
                  <Legend />
                  <Bar dataKey="stock" name="当前库存" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} />
                  <Bar dataKey="min" name="最低预警" fill="#64748b" radius={[0, 4, 4, 0]} barSize={10} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
              <Package size={48} className="mb-2 opacity-20" />
              <p>所有库存状态良好。</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
