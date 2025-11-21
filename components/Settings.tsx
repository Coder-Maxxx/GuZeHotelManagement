
import React, { useState, useRef } from 'react';
import { Plus, X, Settings as SettingsIcon, Database, RotateCcw, FileSpreadsheet, Copy, Check, Download, Upload, Loader2, AlertCircle, Trash2, XCircle } from 'lucide-react';
import { Category, Location, User, InventoryItem, Transaction, TransactionType } from '../types';
import UserManagement from './UserManagement';
import { db } from '../services/storage';
import * as XLSX from 'xlsx';

interface SettingsProps {
  categories: Category[];
  locations: Location[];
  items: InventoryItem[]; // Receive current items for duplicate checking
  currentUser: User;
  onAddCategory: (name: string, color: string) => void;
  onAddLocation: (name: string) => void;
  onDeleteCategory: (id: string) => void;
  onDeleteLocation: (id: string) => void;
  onResetData: () => void;
  onRefresh?: () => void; // Add callback to refresh app data
}

// Define the structure of the row from Excel
interface ExcelImportRow {
  name: string;
  category: string;
  location: string;
  quantity: number;
  unit: string;
  price: number;
  minStockLevel: number;
  description: string;
}

const Settings: React.FC<SettingsProps> = ({ 
  categories, 
  locations, 
  items,
  currentUser,
  onAddCategory, 
  onAddLocation,
  onDeleteCategory,
  onDeleteLocation,
  onResetData,
  onRefresh
}) => {
  const [newCatName, setNewCatName] = useState('');
  const [newLocName, setNewLocName] = useState('');
  
  // Excel Import State
  const [isImporting, setIsImporting] = useState(false);
  const [previewData, setPreviewData] = useState<ExcelImportRow[]>([]);
  const [promptCopied, setPromptCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = currentUser.role === 'admin';

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCatName.trim()) {
      const colors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      onAddCategory(newCatName.trim(), randomColor);
      setNewCatName('');
    }
  };

  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLocName.trim()) {
      onAddLocation(newLocName.trim());
      setNewLocName('');
    }
  };

  // --- Excel Import Logic ---

  const aiPrompt = `请帮我识别这张图片里的商品，并整理成一个表格。
表头（列名）需要是：商品名称、分类、位置、数量、单位、单价、最低预警、备注。
重要规则：
1. 如果图片里没有的信息（比如位置），请默认填'总库房'。
2. 商品名称中如果有括号（如规格、备注），请统一使用英文格式的括号 ()，不要使用中文括号 （）。
请直接给我表格数据，不要代码，方便我复制到 Excel。`;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(aiPrompt);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2000);
  };

  const handleDownloadTemplate = () => {
    const headers = [['商品名称', '分类', '位置', '数量', '单位', '单价', '最低预警', '备注']];
    const example = [['测试商品(防烫)', '清洁用品', '总库房', 100, '个', 5.5, 10, '示例备注']];
    const ws = XLSX.utils.aoa_to_sheet([...headers, ...example]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "导入模板");
    XLSX.writeFile(wb, `库存导入模板.xlsx`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws);

        if (rawData.length === 0) {
          alert("表格为空或格式不正确");
          return;
        }

        // 1. Parse and Consolidate within the file
        const importMap = new Map<string, ExcelImportRow>();

        rawData.forEach((row: any) => {
          let name = row['商品名称'] ? String(row['商品名称']).trim() : '';
          if (!name) return; // Skip empty names

          // --- NORMALIZE NAME ---
          // 1. Replace Chinese brackets with English
          name = name.replace(/（/g, '(').replace(/）/g, ')');
          // 2. Remove whitespace before opening bracket
          name = name.replace(/\s+\(/g, '(');
          // ----------------------

          const qty = Number(row['数量']) || 0;
          const newItem: ExcelImportRow = {
            name: name,
            category: row['分类'] || '默认分类',
            location: row['位置'] || '总库房',
            quantity: qty,
            unit: row['单位'] || '个',
            price: Number(row['单价']) || 0,
            minStockLevel: Number(row['最低预警']) || 10,
            description: row['备注'] || ''
          };

          if (importMap.has(name)) {
            // Consolidate quantity if name exists in file
            const existing = importMap.get(name)!;
            existing.quantity += newItem.quantity;
          } else {
            importMap.set(name, newItem);
          }
        });

        setPreviewData(Array.from(importMap.values()));
      } catch (err) {
        console.error(err);
        alert("文件解析失败，请确保使用正确的模板。");
      }
    };
    reader.readAsBinaryString(file);
  };

  // Update a field in the preview list
  const handleUpdatePreviewItem = (index: number, field: keyof ExcelImportRow, value: any) => {
    const updatedItems = [...previewData];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setPreviewData(updatedItems);
  };

  // Remove a row from preview
  const handleRemovePreviewRow = (index: number) => {
    const updatedItems = previewData.filter((_, i) => i !== index);
    setPreviewData(updatedItems);
  };

  // Cancel Import
  const handleCancelImport = () => {
    // Immediately clear data without confirmation for better UX
    setPreviewData([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmImport = async () => {
    if (previewData.length === 0) return;
    setIsImporting(true);

    try {
      const timestamp = new Date().toISOString();
      
      const itemsToUpsert: InventoryItem[] = [];
      const transactionsToInsert: Transaction[] = [];

      // Create a map of existing items for O(1) lookup
      const existingItemsMap = new Map(items.map(i => [i.name, i]));

      previewData.forEach((row, index) => {
        const existingItem = existingItemsMap.get(row.name);
        const importQty = Number(row.quantity);

        // Base item structure
        let finalItem: InventoryItem;

        if (existingItem) {
          // MERGE LOGIC: Use existing metadata, sum quantity
          finalItem = {
            ...existingItem,
            quantity: existingItem.quantity + importQty, // Add new stock to existing
            lastUpdated: timestamp
          };
        } else {
          // NEW ITEM: Use imported metadata
          finalItem = {
            id: `imp_${Date.now()}_${index}`,
            name: row.name,
            category: row.category,
            location: row.location,
            quantity: importQty,
            unit: row.unit,
            price: row.price,
            minStockLevel: row.minStockLevel,
            description: row.description,
            lastUpdated: timestamp
          };
        }

        itemsToUpsert.push(finalItem);

        // Create Transaction Record only if quantity > 0
        if (importQty > 0) {
          transactionsToInsert.push({
            id: `tx_imp_${Date.now()}_${index}`,
            itemId: finalItem.id,
            itemName: finalItem.name,
            type: TransactionType.INBOUND,
            quantity: importQty,
            timestamp: timestamp,
            user: currentUser.username,
            notes: '批量导入'
          });
        }
      });

      // Batch insert to DB
      await db.addItemsBatch(itemsToUpsert);
      if (transactionsToInsert.length > 0) {
        await db.addTransactionsBatch(transactionsToInsert);
      }
      
      alert(`✅ 成功导入/更新 ${itemsToUpsert.length} 个商品！`);
      
      // Reset state
      setPreviewData([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      // Trigger data refresh in parent
      if (onRefresh) onRefresh();

    } catch (e: any) {
      alert(`❌ 导入失败: ${e.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const inputClass = "flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-600 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500";
  const tableInputClass = "w-full bg-transparent border-b border-transparent focus:border-blue-500 outline-none text-slate-900 dark:text-slate-200 text-xs py-1";

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 用户管理 */}
      <UserManagement currentUser={currentUser} />

      {/* 管理员专区：分类和位置 */}
      {isAdmin ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Categories Settings */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                <SettingsIcon size={20} />
              </div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">分类管理</h2>
            </div>

            <form onSubmit={handleAddCategory} className="flex gap-2 mb-6">
              <input 
                type="text" 
                placeholder="新分类名称..." 
                className={inputClass}
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
              />
              <button type="submit" className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 transition-colors">
                <Plus size={24} />
              </button>
            </form>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg group border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }}></div>
                    <span className="font-medium text-slate-700 dark:text-slate-200">{cat.name}</span>
                  </div>
                  <button 
                    onClick={() => onDeleteCategory(cat.id)}
                    className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Location Settings */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                <SettingsIcon size={20} />
              </div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">仓库位置管理</h2>
            </div>

            <form onSubmit={handleAddLocation} className="flex gap-2 mb-6">
              <input 
                type="text" 
                placeholder="新位置名称..." 
                className={inputClass}
                value={newLocName}
                onChange={(e) => setNewLocName(e.target.value)}
              />
              <button type="submit" className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors">
                <Plus size={24} />
              </button>
            </form>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {locations.map(loc => (
                <div key={loc.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg group border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-300">
                      LOC
                    </span>
                    <span className="font-medium text-slate-700 dark:text-slate-200">{loc.name}</span>
                  </div>
                  <button 
                    onClick={() => onDeleteLocation(loc.id)}
                    className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-center border border-slate-200 dark:border-slate-700">
          仅管理员可配置分类和仓库位置。
        </div>
      )}

      {/* Excel Batch Import */}
      {isAdmin && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                <FileSpreadsheet size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">批量导入 (Excel)</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">支持 AI 辅助转换，安全、直观地批量导入商品数据。</p>
              </div>
            </div>

            {/* AI Prompt Helper */}
            <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg border border-emerald-100 dark:border-emerald-900/30 text-sm">
               <div className="flex items-center justify-between mb-2">
                 <p className="font-bold text-emerald-800 dark:text-emerald-400">💡 AI 提示词模版 (发送给 ChatGPT/文心一言):</p>
                 <button 
                   onClick={handleCopyPrompt}
                   className="text-xs flex items-center gap-1 px-2 py-1 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                 >
                   {promptCopied ? <Check size={12} /> : <Copy size={12} />}
                   {promptCopied ? "已复制" : "一键复制"}
                 </button>
               </div>
               <div className="bg-white dark:bg-slate-900 p-3 rounded border border-emerald-100 dark:border-emerald-900/50 font-mono text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                 {aiPrompt}
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {/* Step 1: Download */}
              <div className="flex flex-col gap-2 p-4 border border-slate-100 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50 h-full">
                <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
                   <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs">1</span>
                   下载模板
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex-1">获取标准的 Excel 导入模板文件。</p>
                <button 
                  onClick={handleDownloadTemplate}
                  className="w-full py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Download size={16} /> 下载 Excel 模板
                </button>
              </div>

              {/* Step 2: Upload */}
              <div className="flex flex-col gap-2 p-4 border border-slate-100 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50 h-full">
                <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
                   <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs">2</span>
                   上传文件
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex-1">选择填好的 Excel 文件。</p>
                <div className="relative">
                   <input 
                    type="file" 
                    accept=".xlsx, .xls" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                   />
                   <button className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                     <Upload size={16} /> 选择文件...
                   </button>
                </div>
              </div>

              {/* Step 3: Confirm */}
              <div className="flex flex-col gap-2 p-4 border border-slate-100 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50 h-full">
                <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
                   <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs">3</span>
                   确认导入
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex-1">检查预览并执行导入。</p>
                <div className="flex gap-2">
                  {previewData.length > 0 && (
                    <button 
                      onClick={handleCancelImport}
                      disabled={isImporting}
                      className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                      title="取消导入"
                    >
                      <XCircle size={16} />
                      取消
                    </button>
                  )}
                  <button 
                    onClick={handleConfirmImport}
                    disabled={previewData.length === 0 || isImporting}
                    className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    {isImporting ? '导入...' : `确认 (${previewData.length})`}
                  </button>
                </div>
              </div>
            </div>

            {/* Editable Preview Table */}
            {previewData.length > 0 && (
              <div className="mt-6 animate-fade-in">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <FileSpreadsheet size={18} className="text-emerald-500" />
                    数据预览 (可编辑)
                  </h3>
                  <span className="text-xs text-slate-500">若商品名称已存在，将自动合并数量；分类/位置以现有数据为准。</span>
                </div>
                <div className="overflow-x-auto max-h-[400px] border border-slate-200 dark:border-slate-700 rounded-lg custom-scrollbar bg-white dark:bg-slate-800">
                  <table className="w-full text-left text-xs min-w-[800px]">
                    <thead className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 sticky top-0 z-10">
                      <tr>
                        <th className="p-2 w-10">#</th>
                        <th className="p-2 w-1/4">商品名称</th>
                        <th className="p-2">分类</th>
                        <th className="p-2">位置</th>
                        <th className="p-2 w-20">数量</th>
                        <th className="p-2 w-20">单位</th>
                        <th className="p-2 w-20">单价</th>
                        <th className="p-2 w-20">预警</th>
                        <th className="p-2 w-10 text-center">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {previewData.map((item, idx) => {
                        // Check if item already exists in system to show visual indicator
                        const exists = items.some(i => i.name === item.name);
                        
                        return (
                          <tr key={idx} className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 ${exists ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}>
                            <td className="p-2 text-slate-400">{idx + 1}</td>
                            <td className="p-2">
                              <input 
                                type="text" 
                                className={tableInputClass} 
                                value={item.name} 
                                onChange={(e) => handleUpdatePreviewItem(idx, 'name', e.target.value)} 
                              />
                              {exists && <span className="text-[10px] text-blue-500 block mt-0.5">已存在(将累加库存)</span>}
                            </td>
                            <td className="p-2">
                              {exists ? (
                                <span className="text-slate-500 dark:text-slate-400 italic" title="使用系统现有分类">
                                  {items.find(i => i.name === item.name)?.category} (锁定)
                                </span>
                              ) : (
                                <input 
                                  type="text" 
                                  className={tableInputClass} 
                                  value={item.category} 
                                  onChange={(e) => handleUpdatePreviewItem(idx, 'category', e.target.value)} 
                                />
                              )}
                            </td>
                            <td className="p-2">
                              {exists ? (
                                <span className="text-slate-500 dark:text-slate-400 italic" title="使用系统现有位置">
                                  {items.find(i => i.name === item.name)?.location} (锁定)
                                </span>
                              ) : (
                                <input 
                                  type="text" 
                                  className={tableInputClass} 
                                  value={item.location} 
                                  onChange={(e) => handleUpdatePreviewItem(idx, 'location', e.target.value)} 
                                />
                              )}
                            </td>
                            <td className="p-2">
                              <input 
                                type="number" 
                                className={tableInputClass} 
                                value={item.quantity} 
                                onChange={(e) => handleUpdatePreviewItem(idx, 'quantity', Number(e.target.value))} 
                              />
                            </td>
                            <td className="p-2">
                              <input 
                                type="text" 
                                className={tableInputClass} 
                                value={item.unit} 
                                onChange={(e) => handleUpdatePreviewItem(idx, 'unit', e.target.value)} 
                              />
                            </td>
                            <td className="p-2">
                              <input 
                                type="number" 
                                className={tableInputClass} 
                                value={item.price} 
                                onChange={(e) => handleUpdatePreviewItem(idx, 'price', Number(e.target.value))} 
                              />
                            </td>
                            <td className="p-2">
                              <input 
                                type="number" 
                                className={tableInputClass} 
                                value={item.minStockLevel} 
                                onChange={(e) => handleUpdatePreviewItem(idx, 'minStockLevel', Number(e.target.value))} 
                              />
                            </td>
                            <td className="p-2 text-center">
                              <button 
                                onClick={() => handleRemovePreviewRow(idx)}
                                className="text-slate-400 hover:text-red-500 transition-colors"
                                title="删除此行"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Reset Data */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300">
                <Database size={20} />
              </div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">危险操作</h2>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30 gap-4">
              <div>
                <h4 className="font-medium text-red-800 dark:text-red-300">清空库存数量 (盘点重置)</h4>
                <p className="text-sm text-red-600 dark:text-red-400/80 mt-1">
                  此操作将保留所有商品资料、分类和位置信息，但会把<b>所有库存数量归零</b>，并<b>清空所有出入库历史记录</b>。<br/>
                  通常用于新一轮盘点开始前。此操作不可撤销。
                </p>
              </div>
              <button 
                onClick={onResetData}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 rounded-lg font-medium transition-all shadow-sm whitespace-nowrap"
              >
                <RotateCcw size={16} />
                库存归零
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
