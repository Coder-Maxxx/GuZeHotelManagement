
import React, { useState } from 'react';
import { Boxes, LogIn, Loader2 } from 'lucide-react';
import { db } from '../services/storage';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await db.login(username, password);
      if (user) {
        onLogin(user);
      } else {
        setError('用户名或密码错误');
      }
    } catch (err) {
      setError('登录服务连接失败');
    } finally {
      setLoading(false);
    }
  };

  // Input style: bg-white text-slate-900 to avoid dark mode issues
  const inputClass = "w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all";

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-fade-in-up border border-slate-100 dark:border-slate-700">
        <div className="bg-slate-900 p-8 text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 mx-auto mb-4">
            <Boxes className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white">库存库房管理系统</h1>
          <p className="text-slate-400 text-sm mt-2">Hotel Inventory Management</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">用户名</label>
              <input
                type="text"
                required
                className={inputClass}
                placeholder="输入用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">密码</label>
              <input
                type="password"
                required
                className={inputClass}
                placeholder="输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-900/30 text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg shadow-blue-200 dark:shadow-blue-900/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <LogIn size={20} />}
              {loading ? '登录中...' : '立即登录'}
            </button>
          </form>

          <div className="mt-6 text-center">
             <p className="text-xs text-slate-400 dark:text-slate-500">如果是首次使用，请使用管理员账号登录。<br/>默认账号: admin / 密码: 123456</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;