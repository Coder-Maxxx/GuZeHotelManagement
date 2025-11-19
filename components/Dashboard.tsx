
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
}

const Dashboard: React.FC<DashboardProps> = ({ items, transactions, categories, onInitialize }) => {
  
  // If no items, show initialization prompt
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6 p-8 bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-4">
          <Database size={40} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">数据库已连接，但暂无数据</h2>
          <p className="text-slate-500 max-w-md mx-auto">
             您可以手动添加商品，或者一键写入演示数据来快速体验系统功能。
          </p>
        </div>
        {onInitialize && (
          <button 
            onClick={onInitialize}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center gap-2"
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
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium">库存总价值</p>
            <h3 className="text-2xl font-bold text-slate-800">¥{totalValue.toLocaleString()}</h3>
          </div>
          <div className="p-3 bg-blue-50 rounded-full text-blue-600">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium">商品总数</p>
            <h3 className="text-2xl font-bold text-slate-800">{totalItems.toLocaleString()}</h3>
          </div>
          <div className="p-3 bg-emerald-50 rounded-full text-emerald-600">
            <Package size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium">库存预警</p>
            <h3 className={`text-2xl font-bold ${lowStockItems.length > 0 ? 'text-red-600' : 'text-slate-800'}`}>
              {lowStockItems.length}
            </h3>
          </div>
          <div className={`p-3 rounded-full ${lowStockItems.length > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-400'}`}>
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-center space-y-2">
           <div className="flex items-center justify-between">
              <span className="flex items-center text-sm text-slate-600"><ArrowDownLeft className="w-4 h-4 mr-1 text-green-500" /> 入库单</span>
              <span className="font-semibold">{inboundCount}</span>
           </div>
           <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-green-500 h-full" style={{ width: `${(inboundCount / (inboundCount + outboundCount || 1)) * 100}%` }}></div>
           </div>
           <div className="flex items-center justify-between">
              <span className="flex items-center text-sm text-slate-600"><ArrowUpRight className="w-4 h-4 mr-1 text-orange-500" /> 出库单</span>
              <span className="font-semibold">{outboundCount}</span>
           </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">各类库存占比</h3>
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
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                暂无分类数据
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Warning Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">低库存预警</h3>
          {lowStockData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lowStockData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={100} tick={{fontSize: 12}} />
                  <Tooltip cursor={{fill: '#fee2e2'}} />
                  <Legend />
                  <Bar dataKey="stock" name="当前库存" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} />
                  <Bar dataKey="min" name="最低预警" fill="#94a3b8" radius={[0, 4, 4, 0]} barSize={10} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400">
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
