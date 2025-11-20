
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import InventoryList from './components/InventoryList';
import TransactionForm from './components/TransactionForm';
import TransactionHistory from './components/TransactionHistory';
import Settings from './components/Settings';
import { 
  InventoryItem, 
  Transaction, 
  Category, 
  Location, 
  ViewMode, 
  TransactionType 
} from './types';
import { db } from './services/storage';
import { Loader2, AlertTriangle, Copy, Check } from 'lucide-react';

const App: React.FC = () => {
  // --- Global State ---
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<ViewMode>('DASHBOARD');
  
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [copied, setCopied] = useState(false);

  // --- Initial Data Load (Async) ---
  useEffect(() => {
    initData();
  }, []);

  const initData = async () => {
    try {
      setIsLoading(true);
      setInitError(null);
      const data = await db.fetchAllData();
      setItems(data.items);
      setTransactions(data.transactions);
      setCategories(data.categories);
      setLocations(data.locations);
    } catch (error: any) {
      console.error("Failed to load data", error);
      // Capture error message to show guide
      setInitError(error.message || "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Handlers (Async Wrappers) ---
  
  const handleAddItem = async (newItemData: Omit<InventoryItem, 'id' | 'lastUpdated'>) => {
    const newItem: InventoryItem = {
      ...newItemData,
      id: `item_${Date.now()}`,
      lastUpdated: new Date().toISOString(),
    };
    
    try {
      await db.addItem(newItem);
      setItems(prev => [...prev, newItem]);
    } catch (e: any) {
      alert(`添加失败: ${e.message}`);
    }
  };

  const handleUpdateItem = async (updatedItem: InventoryItem) => {
    const itemWithTime = { ...updatedItem, lastUpdated: new Date().toISOString() };
    try {
      await db.updateItem(itemWithTime);
      setItems(prev => prev.map(item => item.id === itemWithTime.id ? itemWithTime : item));
    } catch (e: any) {
      alert(`更新失败: ${e.message}`);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (window.confirm('确定要删除此商品吗？')) {
      try {
        await db.deleteItem(id);
        setItems(prev => prev.filter(i => i.id !== id));
      } catch (e: any) {
        alert(`删除失败: ${e.message}`);
      }
    }
  };

  // 批量处理入库/出库
  const handleBatchTransaction = async (entries: { itemId: string; quantity: number; notes: string }[]) => {
    try {
      const isOutbound = currentView === 'OUTBOUND';
      const timestamp = new Date().toISOString();
      const type = isOutbound ? TransactionType.OUTBOUND : TransactionType.INBOUND;

      // 我们需要一个个串行处理，确保数据一致性
      // 在真实后端中这应该是一个 Database Transaction (原子操作)
      // 但在前端 Supabase 调用中，我们尽力模拟
      
      const updatedItems: InventoryItem[] = [];
      const newTransactions: Transaction[] = [];

      for (const entry of entries) {
        const item = items.find(i => i.id === entry.itemId);
        if (!item) continue;

        // Calculate new quantity
        const newQuantity = isOutbound ? item.quantity - entry.quantity : item.quantity + entry.quantity;
        
        const updatedItem = {
          ...item,
          quantity: newQuantity,
          lastUpdated: timestamp
        };

        const newTx: Transaction = {
          id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Unique ID
          itemId: item.id,
          itemName: item.name,
          type: type,
          quantity: entry.quantity,
          timestamp: timestamp,
          user: '管理员', 
          notes: entry.notes
        };

        // Execute DB updates
        await db.updateItem(updatedItem);
        await db.addTransaction(newTx);

        updatedItems.push(updatedItem);
        newTransactions.push(newTx);
      }

      // Batch Update Local State
      setItems(prev => prev.map(item => {
        const updated = updatedItems.find(u => u.id === item.id);
        return updated || item;
      }));
      setTransactions(prev => [...newTransactions, ...prev]); // Add to top

    } catch (e: any) {
      alert(`批量交易记录失败: ${e.message}`);
    }
  };

  // 撤销交易 (Undo)
  const handleUndoTransaction = async (tx: Transaction) => {
    try {
      const item = items.find(i => i.id === tx.itemId);
      if (!item) {
        alert("找不到对应商品，无法回滚库存。但可以删除记录。");
        await db.deleteTransaction(tx.id);
        setTransactions(prev => prev.filter(t => t.id !== tx.id));
        return;
      }

      // 逻辑回滚：如果是入库，撤销就是减库存；如果是出库，撤销就是加库存
      let reversedQuantity = item.quantity;
      if (tx.type === TransactionType.INBOUND) {
        reversedQuantity = item.quantity - tx.quantity;
      } else if (tx.type === TransactionType.OUTBOUND) {
        reversedQuantity = item.quantity + tx.quantity;
      }

      const updatedItem = {
        ...item,
        quantity: reversedQuantity,
        lastUpdated: new Date().toISOString()
      };

      // 1. 更新商品库存
      await db.updateItem(updatedItem);
      // 2. 删除交易记录
      await db.deleteTransaction(tx.id);

      // 更新本地状态
      setItems(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
      setTransactions(prev => prev.filter(t => t.id !== tx.id));

    } catch (e: any) {
      alert(`撤销失败: ${e.message}`);
    }
  };

  const handleAddCategory = async (name: string, color: string) => {
    const newCat = { id: `cat_${Date.now()}`, name, color };
    try {
      await db.addCategory(newCat);
      setCategories(prev => [...prev, newCat]);
    } catch (e: any) { 
      alert(`添加分类失败: ${e.message}`); 
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await db.deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (e: any) { 
      alert(`删除分类失败: ${e.message}`); 
    }
  };

  const handleAddLocation = async (name: string) => {
    const newLoc = { id: `loc_${Date.now()}`, name };
    try {
      await db.addLocation(newLoc);
      setLocations(prev => [...prev, newLoc]);
    } catch (e: any) { 
      alert(`添加位置失败: ${e.message}`); 
    }
  };

  const handleDeleteLocation = async (id: string) => {
    try {
      await db.deleteLocation(id);
      setLocations(prev => prev.filter(l => l.id !== id));
    } catch (e: any) { 
      alert(`删除位置失败: ${e.message}`); 
    }
  };

  const handleResetData = async () => {
    if (window.confirm('警告：这将清除云端数据库的所有数据并重置为演示数据。确定要继续吗？')) {
      setIsLoading(true);
      try {
        const defaults = await db.resetDatabase();
        setItems(defaults.items);
        setTransactions(defaults.transactions);
        setCategories(defaults.categories);
        setLocations(defaults.locations);
        alert('系统已重置并写入演示数据');
      } catch (e: any) {
        alert(`重置失败: ${e.message}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const copySQL = () => {
    const sql = `-- 1. 创建表结构
CREATE TABLE IF NOT EXISTS items (
  id text PRIMARY KEY,
  name text NOT NULL,
  category text,
  location text,
  quantity numeric DEFAULT 0,
  unit text,
  "minStockLevel" numeric DEFAULT 0,
  price numeric DEFAULT 0,
  "lastUpdated" text,
  description text
);

CREATE TABLE IF NOT EXISTS transactions (
  id text PRIMARY KEY,
  "itemId" text,
  "itemName" text,
  type text,
  quantity numeric,
  timestamp text,
  "user" text,
  notes text
);

CREATE TABLE IF NOT EXISTS categories (
  id text PRIMARY KEY,
  name text,
  color text
);

CREATE TABLE IF NOT EXISTS locations (
  id text PRIMARY KEY,
  name text
);

-- 2. 关键：关闭 RLS 权限检查 (允许前端直接读写)
ALTER TABLE items DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE locations DISABLE ROW LEVEL SECURITY;
`;
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- Render: Error / Setup Guide ---
  if (initError) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
        <div className="max-w-2xl w-full bg-white rounded-xl shadow-xl overflow-hidden border border-slate-200">
          <div className="p-6 bg-red-50 border-b border-red-100 flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-full text-red-600">
              <AlertTriangle size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-red-800">连接 Supabase 数据库时出错</h2>
              <p className="text-red-600 text-sm mt-1">{initError}</p>
            </div>
          </div>
          
          <div className="p-8 space-y-6">
            <div className="prose prose-slate">
              <p className="text-slate-600">
                这通常是因为 Supabase 数据库尚未初始化，或者启用了 RLS（行级安全策略）导致权限被拒绝。
                请按照以下步骤修复：
              </p>
              <ol className="list-decimal pl-5 space-y-2 text-slate-700 font-medium">
                <li>登录 <a href="https://supabase.com/dashboard" target="_blank" className="text-blue-600 underline hover:text-blue-800">Supabase Dashboard</a></li>
                <li>进入您的项目，点击左侧菜单的 <strong>SQL Editor</strong></li>
                <li>点击 <strong>New Query</strong></li>
                <li>复制并运行下方的 SQL 代码：</li>
              </ol>
            </div>

            <div className="relative group">
              <div className="absolute right-4 top-4">
                <button 
                  onClick={copySQL}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-md text-sm font-medium transition-colors border border-white/20 backdrop-blur-sm"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? '已复制' : '复制代码'}
                </button>
              </div>
              <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg text-sm overflow-x-auto font-mono leading-relaxed border border-slate-800 shadow-inner">
                <code className="block">
<span className="text-slate-500">-- 1. 创建表结构</span>
<span className="text-purple-400">CREATE TABLE IF NOT EXISTS</span> items (
  id text <span className="text-purple-400">PRIMARY KEY</span>,
  name text,
  ...
);

<span className="text-slate-500">-- (省略中间建表语句，复制完整代码包含所有内容)</span>

<span className="text-slate-500">-- 2. 关键：关闭 RLS 权限检查</span>
<span className="text-purple-400">ALTER TABLE</span> items <span className="text-purple-400">DISABLE ROW LEVEL SECURITY</span>;
<span className="text-purple-400">ALTER TABLE</span> transactions <span className="text-purple-400">DISABLE ROW LEVEL SECURITY</span>;
<span className="text-purple-400">ALTER TABLE</span> categories <span className="text-purple-400">DISABLE ROW LEVEL SECURITY</span>;
<span className="text-purple-400">ALTER TABLE</span> locations <span className="text-purple-400">DISABLE ROW LEVEL SECURITY</span>;
                </code>
              </pre>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <button 
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center gap-2"
              >
                <Loader2 size={18} className={isLoading ? "animate-spin" : ""} />
                已运行 SQL，重试连接
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Render View ---
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] animate-fade-in">
          <Loader2 size={48} className="text-blue-600 animate-spin mb-4" />
          <p className="text-slate-500 font-medium">正在同步云端数据...</p>
        </div>
      );
    }

    switch (currentView) {
      case 'DASHBOARD':
        return (
          <Dashboard 
            items={items} 
            transactions={transactions} 
            categories={categories}
            onInitialize={handleResetData}
          />
        );
      case 'INVENTORY':
        return (
          <InventoryList 
            items={items} 
            categories={categories} 
            locations={locations}
            onAddItem={handleAddItem}
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
          />
        );
      case 'INBOUND':
        return (
          <TransactionForm 
            type={TransactionType.INBOUND} 
            items={items} 
            onSubmit={handleBatchTransaction} 
          />
        );
      case 'OUTBOUND':
        return (
          <TransactionForm 
            type={TransactionType.OUTBOUND} 
            items={items} 
            onSubmit={handleBatchTransaction} 
          />
        );
      case 'HISTORY':
        return (
          <TransactionHistory 
            transactions={transactions}
            onUndo={handleUndoTransaction}
          />
        );
      case 'SETTINGS':
        return (
          <Settings 
            categories={categories} 
            locations={locations}
            onAddCategory={handleAddCategory}
            onAddLocation={handleAddLocation}
            onDeleteCategory={handleDeleteCategory}
            onDeleteLocation={handleDeleteLocation}
            onResetData={handleResetData}
          />
        );
      default:
        return <div>选择一个模块</div>;
    }
  };

  const getHeaderTitle = () => {
    switch(currentView) {
      case 'DASHBOARD': return '仪表盘总览';
      case 'INVENTORY': return '库存状态查询';
      case 'INBOUND': return '入库登记';
      case 'OUTBOUND': return '出库登记';
      case 'HISTORY': return '出入库历史记录';
      case 'SETTINGS': return '系统配置';
      default: return '库存管理系统';
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-800">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      
      <main className="flex-1 ml-20 lg:ml-64 p-4 lg:p-8 transition-all duration-300">
        {/* Top Bar */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">{getHeaderTitle()}</h2>
            <p className="text-slate-500 mt-1">欢迎回来，管理员。</p>
          </div>
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200">
             {isLoading ? (
                <div className="w-2 h-2 rounded-full bg-orange-400 animate-ping"></div>
             ) : (
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
             )}
             <span className="text-sm font-medium text-slate-600">
               {isLoading ? '同步中...' : '云端连接正常'}
             </span>
          </div>
        </header>

        {/* Content Area */}
        <div className="animate-fade-in">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
