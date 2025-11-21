
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowDownLeft, ArrowUpRight, CheckCircle, Plus, Trash2, Search, X, ChevronDown, PackagePlus } from 'lucide-react';
import { InventoryItem, TransactionType, Category, Location } from '../types';

interface TransactionFormProps {
  type: TransactionType;
  items: InventoryItem[];
  categories: Category[];
  locations: Location[];
  onAddItem: (item: Omit<InventoryItem, 'id' | 'lastUpdated'>) => Promise<InventoryItem | undefined>;
  onSubmit: (entries: { itemId: string; quantity: number; notes: string }[]) => void;
  onAddCategory?: (name: string, color: string) => Promise<void>;
  onAddLocation?: (name: string) => Promise<void>;
}

interface Entry {
  id: number;
  itemId: string;
  quantity: number | string;
  notes: string;
}

// --- Internal Component: Searchable Select ---
interface SearchableSelectProps {
  items: InventoryItem[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isInbound: boolean;
  onCreateNew: (name: string) => void;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ items, value, onChange, placeholder, isInbound, onCreateNew }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedItem = items.find(i => i.id === value);

  // Sync search term with selected value when it changes externally
  useEffect(() => {
    if (selectedItem) {
      setSearchTerm(selectedItem.name);
    } else if (!value) {
      setSearchTerm('');
    }
  }, [value, selectedItem]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // If closed without selecting and term doesn't match selection, revert to selection or clear
        if (selectedItem && searchTerm !== selectedItem.name) {
          setSearchTerm(selectedItem.name);
        } else if (!selectedItem && searchTerm !== '') {
          setSearchTerm('');
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedItem, searchTerm]);

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelect = (item: InventoryItem) => {
    onChange(item.id);
    setSearchTerm(item.name);
    setIsOpen(false);
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
    setIsOpen(true);
    inputRef.current?.focus();
  };

  // Styles
  const inputBaseClass = "w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500";

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <Search size={14} />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          className={`${inputBaseClass} pl-9 pr-8`}
          placeholder={placeholder || "搜索商品..."}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
            if (value) onChange(''); // Clear selection while typing new search
          }}
          onFocus={() => {
            setIsOpen(true);
            // Optional: select all text on focus for easier replacement
            inputRef.current?.select();
          }}
        />

        {searchTerm && (
          <button 
            type="button"
            onClick={clearSelection}
            className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
          >
            <X size={14} />
          </button>
        )}
        
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <ChevronDown size={14} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
          {filteredItems.length > 0 ? (
            filteredItems.map(item => (
              <div
                key={item.id}
                onClick={() => handleSelect(item)}
                className="px-4 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-50 dark:border-slate-700/50 last:border-0"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">{item.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    !isInbound && item.quantity <= 0 
                      ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                  }`}>
                    {item.quantity} {item.unit}
                  </span>
                </div>
                {item.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5 truncate">{item.description}</p>
                )}
              </div>
            ))
          ) : (
            <div className="p-2 text-center text-sm text-slate-500 dark:text-slate-400">
              <p className="py-2">未找到 "{searchTerm}"</p>
              {isInbound && searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    onCreateNew(searchTerm);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-2 rounded-md transition-colors text-sm font-medium border border-dashed border-blue-300 dark:border-blue-700"
                >
                  <PackagePlus size={16} />
                  添加新商品: "{searchTerm}"
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// --- Internal Component: Quick Add Item Modal ---
interface NewItemFormData {
  name: string;
  category: string;
  location: string;
  quantity: number | string;
  unit: string;
  minStockLevel: number | string;
  price: number | string;
  description: string;
}

// --- Main Component ---

const TransactionForm: React.FC<TransactionFormProps> = ({ type, items, categories, locations, onAddItem, onSubmit, onAddCategory, onAddLocation }) => {
  const [entries, setEntries] = useState<Entry[]>([
    { id: Date.now(), itemId: '', quantity: 1, notes: '' }
  ]);
  const [showSuccess, setShowSuccess] = useState(false);

  // Quick Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [pendingItemName, setPendingItemName] = useState('');
  const [pendingRowId, setPendingRowId] = useState<number | null>(null);
  
  // Temporary cache for newly added items to ensure they appear immediately in SearchableSelect
  // before the parent component (App) has time to re-render with the updated list.
  const [tempItems, setTempItems] = useState<InventoryItem[]>([]);
  
  // Inline adding state for Quick Add Modal
  const [isTypingCategory, setIsTypingCategory] = useState(false);
  const [isTypingLocation, setIsTypingLocation] = useState(false);

  const [newItemForm, setNewItemForm] = useState<NewItemFormData>({
    name: '',
    category: '',
    location: '',
    quantity: 0,
    unit: '个',
    minStockLevel: 10,
    price: 0,
    description: ''
  });

  const isInbound = type === TransactionType.INBOUND;

  // Merge props.items and tempItems to ensure instant feedback
  const allItems = useMemo(() => {
    // Create a map of existing items by ID for fast lookup
    const existingIds = new Set(items.map(i => i.id));
    // Only add temp items that are not yet in the main list
    const uniqueTemp = tempItems.filter(i => !existingIds.has(i.id));
    return [...items, ...uniqueTemp];
  }, [items, tempItems]);

  const handleAddRow = () => {
    setEntries([...entries, { id: Date.now(), itemId: '', quantity: 1, notes: '' }]);
  };

  const handleRemoveRow = (id: number) => {
    if (entries.length > 1) {
      setEntries(entries.filter(e => e.id !== id));
    }
  };

  const handleEntryChange = (id: number, field: keyof Entry, value: any) => {
    setEntries(entries.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
  };

  // --- Quick Add Logic ---
  const handleCreateNew = (name: string, rowId: number) => {
    // Find current quantity in the row to sync with modal
    const currentRow = entries.find(e => e.id === rowId);
    const initialQty = currentRow ? currentRow.quantity : 0;

    setPendingItemName(name);
    setPendingRowId(rowId);
    setNewItemForm({
      name: name,
      category: categories[0]?.name || '',
      location: locations[0]?.name || '',
      quantity: initialQty, // Sync: Use the quantity from the transaction row
      unit: '个',
      minStockLevel: 10,
      price: 0,
      description: ''
    });
    // Reset inline states
    setIsTypingCategory(false);
    setIsTypingLocation(false);
    setShowAddModal(true);
  };

  const handleQuickAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    const qty = Number(newItemForm.quantity);
    const price = Number(newItemForm.price);
    const minStock = Number(newItemForm.minStockLevel);

    if (!newItemForm.name.trim()) { alert('名称不能为空'); return; }
    if (isNaN(qty) || qty < 0) { alert('数量格式错误'); return; }
    if (isNaN(price) || price < 0) { alert('单价格式错误'); return; }

    // 1. Check if new category needs to be created
    let finalCategory = newItemForm.category;
    if (isTypingCategory && onAddCategory) {
      if (!newItemForm.category.trim()) { alert('请输入新分类名称'); return; }
      // Add random color for now or default
      const colors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      await onAddCategory(newItemForm.category, randomColor);
    } else if (!newItemForm.category) {
      finalCategory = '默认';
    }

    // 2. Check if new location needs to be created
    let finalLocation = newItemForm.location;
    if (isTypingLocation && onAddLocation) {
      if (!newItemForm.location.trim()) { alert('请输入新位置名称'); return; }
      await onAddLocation(newItemForm.location);
    } else if (!newItemForm.location) {
      finalLocation = '默认';
    }

    const cleanItem = {
      name: newItemForm.name,
      category: finalCategory,
      location: finalLocation,
      quantity: 0, // FORCE 0: Base stock is 0, transaction adds quantity.
      unit: newItemForm.unit,
      minStockLevel: minStock,
      price: price,
      description: newItemForm.description
    };

    // Save to DB
    const createdItem = await onAddItem(cleanItem);

    if (createdItem && pendingRowId) {
      // Add to local temp cache so UI updates immediately
      setTempItems(prev => [...prev, createdItem]);

      // Update the specific row with the new Item ID (This auto-fills the item select in the form)
      handleEntryChange(pendingRowId, 'itemId', createdItem.id);
      
      // Also update the quantity in the row to match what was just saved (if user changed it in modal)
      handleEntryChange(pendingRowId, 'quantity', qty);

      setShowAddModal(false);
      setPendingItemName('');
      setPendingRowId(null);
      
      // Show mini success with a slight delay to allow UI to render the new item name first
      setTimeout(() => {
        alert(`商品 "${createdItem.name}" 创建成功！\n请检查数量并点击下方的【确认提交】按钮完成入库。`);
      }, 100);
    }
  };

  // --- Main Submit ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      
      if (!entry.itemId) {
        alert(`请在第 ${i + 1} 行选择商品`);
        return;
      }

      // Check for empty or invalid number
      if (entry.quantity === '' || entry.quantity === null || entry.quantity === undefined) {
        alert(`第 ${i + 1} 行的数量不能为空`);
        return;
      }

      const qtyNum = Number(entry.quantity);
      if (isNaN(qtyNum)) {
        alert(`第 ${i + 1} 行的数量格式错误，请输入有效数字`);
        return;
      }

      if (qtyNum <= 0) {
        alert(`第 ${i + 1} 行的数量必须大于 0`);
        return;
      }

      // Check stock for outbound
      if (!isInbound) {
        const selectedItem = allItems.find(it => it.id === entry.itemId);
        if (selectedItem && qtyNum > selectedItem.quantity) {
          alert(`第 ${i + 1} 行的库存不足 (现有: ${selectedItem.quantity} ${selectedItem.unit})`);
          return;
        }
      }
    }

    // Convert to pure numbers for submission
    const validEntries = entries.map(({ itemId, quantity, notes }) => ({
      itemId,
      quantity: Number(quantity),
      notes
    }));

    onSubmit(validEntries);
    
    // Reset form and show success
    setEntries([{ id: Date.now(), itemId: '', quantity: 1, notes: '' }]);
    setTempItems([]); // Clear temp items after successful submission as they should be in main list now
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  // Dark mode supported inputs (for other inputs)
  const inputClass = "w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500";

  return (
    <div className="max-w-4xl mx-auto">
      <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden border-t-4 ${isInbound ? 'border-green-500' : 'border-orange-500'}`}>
        
        {/* Header */}
        <div className={`p-6 ${isInbound ? 'bg-green-50 dark:bg-green-900/20' : 'bg-green-50 dark:bg-orange-900/20'} flex items-center justify-between`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${isInbound ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'}`}>
              {isInbound ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
            </div>
            <div>
              <h2 className={`text-xl font-bold ${isInbound ? 'text-green-800 dark:text-green-300' : 'text-orange-800 dark:text-orange-300'}`}>
                {isInbound ? '批量入库登记' : '批量出库登记'}
              </h2>
              <p className={`text-sm ${isInbound ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                {isInbound ? '登记新到达的库存商品。' : '记录库存消耗或领用。'}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {entries.map((entry, index) => {
              const selectedItem = allItems.find(i => i.id === entry.itemId);
              return (
                <div key={entry.id} className="flex flex-col md:flex-row gap-4 items-start md:items-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-700 relative group">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-200 dark:bg-slate-600 rounded-l-lg group-hover:bg-blue-400 transition-colors"></div>
                  
                  {/* Index */}
                  <span className="text-slate-400 dark:text-slate-500 font-medium text-sm w-6 text-center">{index + 1}</span>

                  {/* Item Select (Searchable) */}
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 md:hidden">商品</label>
                    <SearchableSelect 
                      items={allItems}
                      value={entry.itemId}
                      onChange={(val) => handleEntryChange(entry.id, 'itemId', val)}
                      placeholder={isInbound ? "搜索入库商品..." : "搜索出库商品..."}
                      isInbound={isInbound}
                      onCreateNew={(name) => handleCreateNew(name, entry.id)}
                    />
                  </div>

                  {/* Quantity */}
                  <div className="w-full md:w-32">
                     <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 md:hidden">数量</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        min="0" 
                        step="any"
                        className={inputClass}
                        value={entry.quantity}
                        onChange={(e) => handleEntryChange(entry.id, 'quantity', e.target.value)}
                        onWheel={(e) => (e.target as HTMLElement).blur()} // Prevent scroll changing value
                      />
                      {selectedItem && <span className="absolute right-3 top-2 text-xs text-slate-400 dark:text-slate-500">{selectedItem.unit}</span>}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 md:hidden">备注</label>
                    <input 
                      type="text" 
                      placeholder={isInbound ? "采购单号/来源" : "领用人/用途"}
                      className={inputClass}
                      value={entry.notes}
                      onChange={(e) => handleEntryChange(entry.id, 'notes', e.target.value)}
                    />
                  </div>

                  {/* Remove Button */}
                  <div className="w-full md:w-auto flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(entry.id)}
                      disabled={entries.length === 1}
                      className={`p-2 rounded-lg transition-colors ${entries.length === 1 ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' : 'text-slate-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'}`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
            <button
              type="button"
              onClick={handleAddRow}
              className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300 px-4 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors w-full sm:w-auto justify-center"
            >
              <Plus size={18} />
              添加一行
            </button>

            <button 
              type="submit"
              className={`w-full sm:w-auto px-8 py-3 rounded-lg font-bold text-white shadow-md transform transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 ${
                isInbound 
                  ? 'bg-green-600 hover:bg-green-700 shadow-green-200 dark:shadow-green-900/30' 
                  : 'bg-orange-500 hover:bg-orange-600 shadow-orange-200 dark:shadow-orange-900/30'
              }`}
            >
              {isInbound ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
              确认提交 {entries.length} 项{isInbound ? '入库' : '出库'}
            </button>
          </div>
        </form>

        {/* Success Message */}
        {showSuccess && (
          <div className="absolute top-4 right-4 bg-slate-800 dark:bg-slate-900 text-white px-6 py-3 rounded-lg shadow-lg border border-slate-700 flex items-center gap-3 animate-fade-in-down z-50">
            <CheckCircle className="text-green-400" size={20} />
            <div>
              <p className="font-medium">批量交易已记录</p>
              <p className="text-xs text-slate-400">库存更新成功。</p>
            </div>
          </div>
        )}

        {/* Quick Add Item Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in-up border border-slate-100 dark:border-slate-700">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">快速添加新商品</h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">&times;</button>
              </div>
              <form onSubmit={handleQuickAddSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">商品名称 <span className="text-red-500">*</span></label>
                    <input 
                      required type="text" 
                      className={inputClass}
                      value={newItemForm.name} 
                      onChange={e => setNewItemForm({...newItemForm, name: e.target.value})} 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      分类
                      {isTypingCategory && <span className="ml-2 text-xs text-blue-500 font-normal">(新分类)</span>}
                    </label>
                    <div className="flex gap-2">
                      {isTypingCategory ? (
                        <input 
                          type="text"
                          className={inputClass}
                          placeholder="输入新分类名称"
                          value={newItemForm.category}
                          onChange={e => setNewItemForm({...newItemForm, category: e.target.value})}
                          autoFocus
                        />
                      ) : (
                        <select 
                          className={inputClass}
                          value={newItemForm.category} onChange={e => setNewItemForm({...newItemForm, category: e.target.value})}
                        >
                          {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                      )}
                      
                      <button 
                        type="button"
                        onClick={() => {
                          setIsTypingCategory(!isTypingCategory);
                          setNewItemForm({...newItemForm, category: isTypingCategory ? (categories[0]?.name || '') : ''});
                        }}
                        className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                        title={isTypingCategory ? "选择现有分类" : "创建新分类"}
                      >
                        {isTypingCategory ? <X size={18} /> : <Plus size={18} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      位置
                      {isTypingLocation && <span className="ml-2 text-xs text-blue-500 font-normal">(新位置)</span>}
                    </label>
                    <div className="flex gap-2">
                      {isTypingLocation ? (
                        <input 
                          type="text"
                          className={inputClass}
                          placeholder="输入新位置名称"
                          value={newItemForm.location}
                          onChange={e => setNewItemForm({...newItemForm, location: e.target.value})}
                          autoFocus
                        />
                      ) : (
                        <select 
                          className={inputClass}
                          value={newItemForm.location} onChange={e => setNewItemForm({...newItemForm, location: e.target.value})}
                        >
                          {locations.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                        </select>
                      )}
                      
                      <button 
                        type="button"
                        onClick={() => {
                          setIsTypingLocation(!isTypingLocation);
                          setNewItemForm({...newItemForm, location: isTypingLocation ? (locations[0]?.name || '') : ''});
                        }}
                        className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                        title={isTypingLocation ? "选择现有位置" : "创建新位置"}
                      >
                        {isTypingLocation ? <X size={18} /> : <Plus size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">入库数量</label>
                    <input 
                      type="number" min="0" step="any"
                      className={inputClass}
                      value={newItemForm.quantity} onChange={e => setNewItemForm({...newItemForm, quantity: e.target.value})}
                      onWheel={(e) => (e.target as HTMLElement).blur()}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">单位</label>
                    <input 
                      type="text" placeholder="例如: 个"
                      className={inputClass}
                      value={newItemForm.unit} onChange={e => setNewItemForm({...newItemForm, unit: e.target.value})} 
                    />
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">单价 (¥)</label>
                    <input 
                      type="number" min="0" step="0.01"
                      className={inputClass}
                      value={newItemForm.price} onChange={e => setNewItemForm({...newItemForm, price: e.target.value})} 
                      onWheel={(e) => (e.target as HTMLElement).blur()}
                    />
                  </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">最低库存预警值</label>
                    <input 
                      type="number" min="0"
                      className={inputClass}
                      value={newItemForm.minStockLevel} onChange={e => setNewItemForm({...newItemForm, minStockLevel: e.target.value})} 
                      onWheel={(e) => (e.target as HTMLElement).blur()}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">备注 / 规格说明</label>
                    <input 
                      type="text"
                      placeholder="例如：一箱4桶"
                      className={inputClass}
                      value={newItemForm.description || ''} onChange={e => setNewItemForm({...newItemForm, description: e.target.value})} 
                    />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors"
                  >
                    取消
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 shadow-sm transition-colors flex items-center gap-2"
                  >
                    <CheckCircle size={16} />
                    创建商品
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default TransactionForm;
