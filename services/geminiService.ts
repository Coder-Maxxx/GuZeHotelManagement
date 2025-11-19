import { GoogleGenAI } from "@google/genai";
import { InventoryItem, Transaction } from '../types';

// Initialize the client. The API key is safely accessed from process.env
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeInventory = async (items: InventoryItem[], transactions: Transaction[]): Promise<string> => {
  try {
    const modelId = 'gemini-2.5-flash';

    // Prepare a concise summary of the data
    const inventorySummary = items.map(item => 
      `- ${item.name} (数量: ${item.quantity}, 最低预警: ${item.minStockLevel}, 分类: ${item.category})`
    ).join('\n');

    const recentTransactions = transactions.slice(0, 10).map(t => 
      `- ${t.type === 'INBOUND' ? '入库' : '出库'}: ${t.quantity} x ${t.itemName} 时间: ${t.timestamp.split('T')[0]}`
    ).join('\n');

    const prompt = `
      你是一位专业的酒店库存管理专家。请分析以下的库存数据和最近的交易记录。
      
      当前库存状态:
      ${inventorySummary}

      最近活动 (最后10笔):
      ${recentTransactions}

      请提供一份简明的行政摘要（请使用中文回复），包含以下内容：
      1. **紧急预警 (Critical Alerts):** 哪些商品库存严重不足（低于最低预警值）？
      2. **补货建议 (Restocking Advice):** 应该立即订购什么？
      3. **消耗洞察 (Usage Insights):** 基于活动记录，有什么消耗模式的观察？
      4. **优化建议 (Optimization Tip):** 一个提高库存效率的可行建议。

      请使用清晰的 Markdown 格式。保持专业和乐于助人的语气。
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });

    return response.text || "暂时无法生成分析报告。";

  } catch (error) {
    console.error("Gemini API Error:", error);
    return "分析库存时发生错误。请确保您的 API Key 配置正确。";
  }
};