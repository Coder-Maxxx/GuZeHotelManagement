
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import InventoryList from './components/InventoryList';
import TransactionForm from './components/TransactionForm';
import TransactionHistory from './components/TransactionHistory';
import Settings from './components/Settings';
import Login from './components/Login';
import { 
  InventoryItem, 
  Transaction, 
  Category, 
  Location, 
  ViewMode, 
  TransactionType,
  User 
} from './types';
import { db } from './services/storage';
import { Loader2, AlertTriangle, Copy, Check, Sun, Moon } from 'lucide-react';

const App: React.FC = () => {
  // --- Global State ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Login后才开始load数据，初始不loading
  const [initError, setInitError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<ViewMode>('DASHBOARD');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [copied, setCopied] = useState(false);

  // --- Theme & Session Check on Mount ---
  useEffect(() => {
    // Theme init
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    }

    // Session init
    const savedUser = db.getSession();
    if (savedUser) {
      setCurrentUser(savedUser);
    }
  }, []);

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
      localStorage.theme = 'dark';
      document.documentElement.classList.add('dark');
    } else {
      setTheme('light');
      localStorage.theme = 'light';
      document.documentElement.classList.remove('dark');
    }
  };

  // --- Initial Data Load (Async) ---
  // 只有在用户登录后才加载数据
  useEffect(() => {
    if (currentUser) {
      initData();
    }
  }, [currentUser]);

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
      setInitError(error.message || "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Handlers (Async Wrappers) ---
  
  const handleLogin = (user: User) => {
    db.saveSession(user); // 保存会话
    setCurrentUser(user);
    setCurrentView('DASHBOARD');
  };

  const handleLogout = () => {
    db.clearSession(); // 清除会话
    setCurrentUser(null);
    setItems([]);
    setTransactions([]);
  };
  
  const handleAddItem = async (newItemData: Omit<InventoryItem, 'id' | 'lastUpdated'>): Promise<InventoryItem | undefined> => {
    const timestamp = new Date().toISOString();
    const newItem: InventoryItem = {
      ...newItemData,
      id: `item_${Date.now()}`,
      lastUpdated: timestamp,
    };
    
    try {
      // 1. Create Item
      await db.addItem(newItem);
      setItems(prev => [...prev, newItem]);

      // 2. If initial quantity > 0, create a corresponding transaction record
      // Note: For "Quick Add" in TransactionForm, quantity is passed as 0, so this won't run (correctly).
      if (newItem.quantity > 0) {
        const newTx: Transaction = {
          id: `tx_init_${newItem.id}`,
          itemId: newItem.id,
          itemName: newItem.name,
          type: TransactionType.INBOUND,
          quantity: newItem.quantity,
          timestamp: timestamp,
          user: currentUser?.username || '系统',
          notes: '初始库存录入'
        };
        await db.addTransaction(newTx);
        setTransactions(prev => [newTx, ...prev]);
      }

      return newItem; // Return the item so TransactionForm can use it
    } catch (e: any) {
      alert(`添加失败: ${e.message}`);
      return undefined;
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
      
      const updatedItems: InventoryItem[] = [];
      const newTransactions: Transaction[] = [];

      for (const entry of entries) {
        const item = items.find(i => i.id === entry.itemId);
        if (!item) continue;

        const newQuantity = isOutbound ? item.quantity - entry.quantity : item.quantity + entry.quantity;
        
        const updatedItem = {
          ...item,
          quantity: newQuantity,
          lastUpdated: timestamp
        };

        const newTx: Transaction = {
          id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          itemId: item.id,
          itemName: item.name,
          type: type,
          quantity: entry.quantity,
          timestamp: timestamp,
          user: currentUser?.username || '未知用户', // 使用当前登录用户名
          notes: entry.notes
        };

        await db.updateItem(updatedItem);
        await db.addTransaction(newTx);

        updatedItems.push(updatedItem);
        newTransactions.push(newTx);
      }

      setItems(prev => prev.map(item => {
        const updated = updatedItems.find(u => u.id === item.id);
        return updated || item;
      }));
      setTransactions(prev => [...newTransactions, ...prev]);

    } catch (e: any) {
      alert(`批量交易记录失败: ${e.message}`);
    }
  };

  // 撤销交易 (Undo)
  const handleUndoTransaction = async (tx: Transaction) => {
    try {
      console.log("Starting undo for tx:", tx.id);
      
      // 1. Find the related item
      const currentItem = items.find(i => i.id === tx.itemId);
      if (!currentItem) {
        // 即使找不到商品（可能被删了），也允许删除这条孤立的记录
        alert("关联商品已不存在，将仅删除交易记录。");
        await db.deleteTransaction(tx.id);
        // 手动更新本地状态
        setTransactions(prev => prev.filter(t => t.id !== tx.id));
        alert("撤销成功（仅记录删除）");
        return;
      }

      // 2. Calculate reversed quantity
      let reversedQuantity = Number(currentItem.quantity); 
      const txQty = Number(tx.quantity);

      if (tx.type === TransactionType.INBOUND) {
        // 如果是撤销入库，则减库存
        reversedQuantity = reversedQuantity - txQty;
      } else {
        // 如果是撤销出库，则加库存
        reversedQuantity = reversedQuantity + txQty;
      }

      if (isNaN(reversedQuantity)) {
        throw new Error("数量计算错误，请联系管理员");
      }

      const updatedItem = {
        ...currentItem,
        quantity: reversedQuantity,
        lastUpdated: new Date().toISOString()
      };

      // 3. Update DB: Item first, then delete Tx
      await db.updateItem(updatedItem);
      await db.deleteTransaction(tx.id);

      // 4. Manual State Update (Critical for UX - prevents flicker)
      // Update Item List
      setItems(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
      // Remove Transaction
      setTransactions(prev => prev.filter(t => t.id !== tx.id));

      alert(`撤销成功！\n商品 "${updatedItem.name}" 的最新库存已更新为: ${updatedItem.quantity}`);

    } catch (e: any) {
      console.error("Undo failed", e);
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
    if (window.confirm('⚠️ 警告：此操作将把所有商品的库存数量归零，并永久清空所有出入库记录。\n\n商品资料（名称、分类等）将保留。\n\n确定要执行“库存归零”操作吗？')) {
      setIsLoading(true);
      try {
        const defaults = await db.resetDatabase();
        setItems(defaults.items);
        setTransactions(defaults.transactions);
        setCategories(defaults.categories);
        setLocations(defaults.locations);
        alert('✅ 操作成功：所有库存已归零，历史记录已清空。');
      } catch (e: any) {
        alert(`操作失败: ${e.message}`);
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

-- 用户表 (新)
CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  role text NOT NULL DEFAULT 'user',
  "createdAt" timestamp with time zone DEFAULT now()
);

-- 2. 默认管理员 (admin / 123456)
INSERT INTO users (id, username, password, role) 
VALUES ('user_admin', 'admin', '123456', 'admin')
ON CONFLICT (username) DO NOTHING;

-- 3. RPC 函数 (用于前端 SQL 执行)
CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE query;
END;
$$;

-- 4. 关键：关闭 RLS 权限检查
ALTER TABLE items DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
`;
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- Render: Login Check ---
  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  // --- Render: Error / Setup Guide ---
  if (initError) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4 font-sans">
        <div className="max-w-2xl w-full bg-white dark:bg-slate-800 rounded-xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
          <div className="p-6 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-900/30 flex items-center gap-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 dark:text-red-400">
              <AlertTriangle size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-red-800 dark:text-red-300">连接数据库出错</h2>
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">{initError}</p>
            </div>
          </div>
          
          <div className="p-8 space-y-6">
            <div className="prose prose-slate dark:prose-invert">
              <p className="text-slate-600 dark:text-slate-300">
                请确保您已在 Supabase 中创建了所有必要的表（包括新增的 <code>users</code> 表和 <code>exec_sql</code> 函数）。
              </p>
            </div>
            
            <div className="bg-slate-900 rounded-lg p-4 relative">
              <button 
                onClick={copySQL}
                className="absolute top-3 right-3 bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded text-xs flex items-center gap-1 transition-colors"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? '已复制' : '复制 SQL'}
              </button>
              <pre className="text-xs text-blue-300 font-mono overflow-x-auto max-h-60 custom-scrollbar">
                {`-- 全量建表语句 (含 RPC)...`}
              </pre>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <button 
                onClick={() => {
                   setInitError(null); 
                   initData();
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-blue-900/30 transition-all flex items-center gap-2"
              >
                <Loader2 size={18} className={isLoading ? "animate-spin" : ""} />
                重试连接
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
          <p className="text-slate-500 dark:text-slate-400 font-medium">正在同步云端数据...</p>
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
            onViewLowStock={() => setCurrentView('LOW_STOCK')}
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
      case 'LOW_STOCK':
        return (
          <InventoryList 
            items={items.filter(i => i.quantity <= i.minStockLevel)} 
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
            categories={categories}
            locations={locations}
            onAddItem={handleAddItem}
            onSubmit={handleBatchTransaction}
            onAddCategory={handleAddCategory}
            onAddLocation={handleAddLocation}
          />
        );
      case 'OUTBOUND':
        return (
          <TransactionForm 
            type={TransactionType.OUTBOUND} 
            items={items} 
            // 出库不需要添加商品的功能
            categories={[]} 
            locations={[]}
            onAddItem={async () => undefined}
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
            currentUser={currentUser}
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
      case 'LOW_STOCK': return '库存预警清单';
      case 'INBOUND': return '入库登记';
      case 'OUTBOUND': return '出库登记';
      case 'HISTORY': return '出入库历史记录';
      case 'SETTINGS': return '系统配置';
      default: return '库存管理系统';
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-200 transition-colors duration-300">
      <Sidebar 
        currentView={currentView} 
        currentUser={currentUser}
        onViewChange={setCurrentView}
        onLogout={handleLogout}
      />
      
      <main className="flex-1 ml-20 lg:ml-64 p-4 lg:p-8 transition-all duration-300">
        {/* Top Bar */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{getHeaderTitle()}</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">欢迎回来，{currentUser.username}。</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
              title={theme === 'light' ? '切换到深色模式' : '切换到浅色模式'}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            <div className="flex items-center gap-3 bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-sm border border-slate-200 dark:border-slate-700">
               {isLoading ? (
                  <div className="w-2 h-2 rounded-full bg-orange-400 animate-ping"></div>
               ) : (
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
               )}
               <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                 {isLoading ? '同步中...' : '云端连接正常'}
               </span>
            </div>
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
