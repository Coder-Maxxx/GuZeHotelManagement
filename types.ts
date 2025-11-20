
export enum TransactionType {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
  ADJUSTMENT = 'ADJUSTMENT'
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

export interface AppState {
  items: InventoryItem[];
  transactions: Transaction[];
  categories: Category[];
  locations: Location[];
}

export type ViewMode = 'DASHBOARD' | 'INVENTORY' | 'INBOUND' | 'OUTBOUND' | 'REPORTS' | 'SETTINGS' | 'HISTORY';
