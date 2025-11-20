
import { supabase } from './supabaseClient';
import { InventoryItem, Transaction, Category, Location, User } from '../types';
import { INITIAL_ITEMS, INITIAL_TRANSACTIONS, INITIAL_CATEGORIES, INITIAL_LOCATIONS } from '../constants';

// ============================================================================
// 数据库适配器 (Service Layer) - Supabase 版
// ============================================================================

const SESSION_KEY = 'inventory_app_session_v1';
const SESSION_DURATION = 30 * 60 * 1000; // 30 分钟

export const db = {
  // --- 会话管理 (Session Persistence) ---
  saveSession: (user: User) => {
    const sessionData = {
      user: { ...user, password: '' }, // 安全起见，不存储密码
      expiry: Date.now() + SESSION_DURATION
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
  },

  getSession: (): User | null => {
    const json = localStorage.getItem(SESSION_KEY);
    if (!json) return null;

    try {
      const { user, expiry } = JSON.parse(json);
      if (Date.now() > expiry) {
        // 会话过期
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      
      // 会话有效，自动续期 (滚动更新)
      const newSessionData = {
        user,
        expiry: Date.now() + SESSION_DURATION
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(newSessionData));
      
      return user as User;
    } catch (e) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
  },

  clearSession: () => {
    localStorage.removeItem(SESSION_KEY);
  },

  // --- 初始化/获取所有数据 ---
  fetchAllData: async () => {
    try {
      // 并行请求所有表的数据
      const [itemsRes, txRes, catRes, locRes] = await Promise.all([
        supabase.from('items').select('*'),
        supabase.from('transactions').select('*').order('timestamp', { ascending: false }), // 最近交易在前
        supabase.from('categories').select('*'),
        supabase.from('locations').select('*')
      ]);

      if (itemsRes.error) throw itemsRes.error;
      if (txRes.error) throw txRes.error;
      if (catRes.error) throw catRes.error;
      if (locRes.error) throw locRes.error;

      return {
        items: (itemsRes.data as InventoryItem[]) || [],
        transactions: (txRes.data as Transaction[]) || [],
        categories: (catRes.data as Category[]) || [],
        locations: (locRes.data as Location[]) || [],
      };
    } catch (error) {
      console.error("Supabase fetch error:", error);
      throw error;
    }
  },

  // --- 用户系统 (Auth & Users) ---
  login: async (username: string, password: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password) // 注意：演示项目使用明文比对，生产环境请使用 Hash
      .single();
    
    if (error || !data) return null;
    return data as User;
  },

  getUsers: async (): Promise<User[]> => {
    const { data, error } = await supabase.from('users').select('*').order('username');
    if (error) throw error;
    return data as User[];
  },

  addUser: async (user: Omit<User, 'createdAt'>): Promise<User> => {
    const { data, error } = await supabase.from('users').insert(user).select().single();
    if (error) throw error;
    return data as User;
  },

  updateUserPassword: async (id: string, newPassword: string): Promise<void> => {
    const { error } = await supabase.from('users').update({ password: newPassword }).eq('id', id);
    if (error) throw error;
  },

  updateUsername: async (id: string, newUsername: string): Promise<void> => {
    const { error } = await supabase.from('users').update({ username: newUsername }).eq('id', id);
    if (error) throw error;
  },

  deleteUser: async (id: string): Promise<void> => {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;
  },

  // --- 商品操作 (Items) ---
  addItem: async (item: InventoryItem): Promise<InventoryItem> => {
    const { data, error } = await supabase.from('items').insert(item).select().single();
    if (error) throw error;
    return data as InventoryItem;
  },

  updateItem: async (item: InventoryItem): Promise<InventoryItem> => {
    // 忽略 id 字段的更新（它是主键），更新其他字段
    const { data, error } = await supabase
      .from('items')
      .update({
        name: item.name,
        // sku removed
        category: item.category,
        location: item.location,
        quantity: item.quantity,
        unit: item.unit,
        "minStockLevel": item.minStockLevel, // 注意 SQL 列名带引号以匹配驼峰
        price: item.price,
        "lastUpdated": item.lastUpdated,
        description: item.description
      })
      .eq('id', item.id)
      .select()
      .single();
      
    if (error) throw error;
    return data as InventoryItem;
  },

  deleteItem: async (id: string): Promise<void> => {
    const { error } = await supabase.from('items').delete().eq('id', id);
    if (error) throw error;
  },

  // --- 交易记录 (Transactions) ---
  addTransaction: async (tx: Transaction): Promise<Transaction> => {
    const { data, error } = await supabase.from('transactions').insert(tx).select().single();
    if (error) throw error;
    return data as Transaction;
  },

  deleteTransaction: async (id: string): Promise<void> => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw error;
  },

  // --- 分类与位置 (Settings) ---
  addCategory: async (cat: Category): Promise<Category> => {
    const { data, error } = await supabase.from('categories').insert(cat).select().single();
    if (error) throw error;
    return data as Category;
  },

  deleteCategory: async (id: string): Promise<void> => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
  },

  addLocation: async (loc: Location): Promise<Location> => {
    const { data, error } = await supabase.from('locations').insert(loc).select().single();
    if (error) throw error;
    return data as Location;
  },

  deleteLocation: async (id: string): Promise<void> => {
    const { error } = await supabase.from('locations').delete().eq('id', id);
    if (error) throw error;
  },

  // --- 系统重置 / 数据初始化 ---
  // 修改逻辑：保留基础数据，仅清空库存和交易记录
  resetDatabase: async () => {
    try {
      // 1. 清空交易记录表
      // neq('id', '0') 是为了匹配所有行（只要ID不是0，通常都是UUID或字符串）
      const { error: txError } = await supabase
        .from('transactions')
        .delete()
        .neq('id', '0'); 
      
      if (txError) throw txError;

      // 2. 将所有商品的库存归零
      const { error: itemError } = await supabase
        .from('items')
        .update({ 
          quantity: 0, 
          lastUpdated: new Date().toISOString() 
        })
        .neq('id', '0'); // 选中所有行

      if (itemError) throw itemError;

      // 3. 重新拉取最新状态返回给前端
      return await db.fetchAllData();

    } catch (error) {
      console.error("Reset Stock error:", error);
      throw error;
    }
  }
};
