
import { supabase } from './supabaseClient';
import { InventoryItem, Transaction, Category, Location } from '../types';
import { INITIAL_ITEMS, INITIAL_TRANSACTIONS, INITIAL_CATEGORIES, INITIAL_LOCATIONS } from '../constants';

// ============================================================================
// 数据库适配器 (Service Layer) - Supabase 版
// ============================================================================

export const db = {
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
  resetDatabase: async () => {
    try {
      // 1. 清空所有表
      await supabase.from('transactions').delete().neq('id', '0');
      await supabase.from('items').delete().neq('id', '0');
      await supabase.from('categories').delete().neq('id', '0');
      await supabase.from('locations').delete().neq('id', '0');

      // 2. 批量插入初始数据
      const { error: err1 } = await supabase.from('categories').insert(INITIAL_CATEGORIES);
      if(err1) throw err1;

      const { error: err2 } = await supabase.from('locations').insert(INITIAL_LOCATIONS);
      if(err2) throw err2;

      const { error: err3 } = await supabase.from('items').insert(INITIAL_ITEMS);
      if(err3) throw err3;

      const { error: err4 } = await supabase.from('transactions').insert(INITIAL_TRANSACTIONS);
      if(err4) throw err4;

      return {
        items: INITIAL_ITEMS,
        transactions: INITIAL_TRANSACTIONS,
        categories: INITIAL_CATEGORIES,
        locations: INITIAL_LOCATIONS
      };
    } catch (error) {
      console.error("Reset DB error:", error);
      throw error;
    }
  }
};
