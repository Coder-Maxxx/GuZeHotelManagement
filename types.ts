
export enum TransactionType {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND'
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  location: string;
  quantity: number;
  unit: string;
  minStockLevel: number;
  price: number;
  lastUpdated: string;
  description?: string;
}

export interface Transaction {
  id: string;
  itemId: string;
  itemName: string;
  type: TransactionType;
  quantity: number;
  timestamp: string;
  user: string;
  notes?: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface Location {
  id: string;
  name: string;
}

export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  username: string;
  password?: string; // Optional when fetching list for security display
  role: UserRole;
  createdAt?: string;
}

export type ViewMode = 'DASHBOARD' | 'INVENTORY' | 'INBOUND' | 'OUTBOUND' | 'REPORTS' | 'SETTINGS' | 'HISTORY' | 'LOW_STOCK';
