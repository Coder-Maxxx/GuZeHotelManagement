
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { db } from '../services/storage';
import { UserPlus, Shield, Trash2, KeyRound, User as UserIcon, Edit3 } from 'lucide-react';

interface UserManagementProps {
  currentUser: User;
}

const UserManagement: React.FC<UserManagementProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Add User State
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('user');

  // Change Password State
  const [pwdModalUser, setPwdModalUser] = useState<User | null>(null);
  const [newPwdInput, setNewPwdInput] = useState('');

  // Edit Username State
  const [editNameModalUser, setEditNameModalUser] = useState<User | null>(null);
  const [newUsernameInput, setNewUsernameInput] = useState('');

  useEffect(() => {
    if (currentUser.role === 'admin') {
      fetchUsers();
    } else {
      // If not admin, only show self
      setUsers([currentUser]);
    }
  }, [currentUser]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await db.getUsers();
      setUsers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword) return;

    try {
      const newUser = {
        id: `user_${Date.now()}`,
        username: newUsername,
        password: newPassword,
        role: newRole
      };
      await db.addUser(newUser);
      setUsers([...users, newUser]);
      setNewUsername('');
      setNewPassword('');
      alert('用户添加成功');
    } catch (error: any) {
      alert('添加失败: ' + error.message);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm('确定要删除该用户吗？')) {
      try {
        await db.deleteUser(id);
        setUsers(users.filter(u => u.id !== id));
      } catch (error: any) {
        alert('删除失败: ' + error.message);
      }
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwdModalUser || !newPwdInput) return;

    try {
      await db.updateUserPassword(pwdModalUser.id, newPwdInput);
      alert('密码修改成功');
      setPwdModalUser(null);
      setNewPwdInput('');
    } catch (error: any) {
      alert('修改失败: ' + error.message);
    }
  };

  const handleChangeUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNameModalUser || !newUsernameInput.trim()) return;
    
    try {
      await db.updateUsername(editNameModalUser.id, newUsernameInput.trim());
      
      // Update local list
      setUsers(users.map(u => u.id === editNameModalUser.id ? { ...u, username: newUsernameInput.trim() } : u));
      
      alert('用户名修改成功');
      setEditNameModalUser(null);
      setNewUsernameInput('');
    } catch (error: any) {
      alert('修改失败 (用户名可能已存在): ' + error.message);
    }
  };

  const isAdmin = currentUser.role === 'admin';

  // Dark mode specific styles
  const inputClass = "w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 text-slate-900";

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
          <UserIcon size={20} />
        </div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-white">用户与权限管理</h2>
      </div>

      {/* Add User Form (Admin Only) */}
      {isAdmin && (
        <div className="mb-8 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
          <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <UserPlus size={18} /> 添加新用户
          </h3>
          <form onSubmit={handleAddUser} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">用户名</label>
              <input
                type="text"
                required
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex-1 w-full">
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">初始密码</label>
              <input
                type="text"
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="w-full md:w-32">
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">角色</label>
              <select
                value={newRole}
                onChange={e => setNewRole(e.target.value as UserRole)}
                className={inputClass}
              >
                <option value="user">普通用户</option>
                <option value="admin">管理员</option>
              </select>
            </div>
            <button type="submit" className="w-full md:w-auto px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
              添加
            </button>
          </form>
        </div>
      )}

      {/* User List */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="p-3 font-medium">用户名</th>
              <th className="p-3 font-medium">角色</th>
              <th className="p-3 font-medium text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                <td className="p-3 font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  {user.username}
                  {user.id === currentUser.id && <span className="text-xs text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-900/50">(我自己)</span>}
                </td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium border ${user.role === 'admin' ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-100 dark:border-purple-900/50' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600'}`}>
                    {user.role === 'admin' ? '管理员' : '普通用户'}
                  </span>
                </td>
                <td className="p-3 text-right flex justify-end gap-2">
                  {/* Edit Username: Only Admin */}
                  {isAdmin && (
                    <button 
                      onClick={() => {
                        setEditNameModalUser(user);
                        setNewUsernameInput(user.username);
                      }}
                      className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                      title="修改用户名"
                    >
                      <Edit3 size={16} />
                    </button>
                  )}

                  {/* Modify Password: Allow if Admin OR it's own account */}
                  {(isAdmin || user.id === currentUser.id) && (
                    <button 
                      onClick={() => setPwdModalUser(user)}
                      className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                      title="修改密码"
                    >
                      <KeyRound size={16} />
                    </button>
                  )}

                  {/* Delete: Only Admin, and cannot delete self */}
                  {isAdmin && user.id !== currentUser.id && (
                    <button 
                      onClick={() => handleDeleteUser(user.id)}
                      className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="删除用户"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {loading && <tr><td colSpan={3} className="p-4 text-center text-slate-400">加载中...</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Change Password Modal */}
      {pwdModalUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-96 shadow-xl animate-fade-in-up border border-slate-100 dark:border-slate-700">
            <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-white">修改密码: {pwdModalUser.username}</h3>
            <form onSubmit={handleChangePassword}>
              <input 
                type="text" 
                placeholder="输入新密码" 
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg mb-4 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                value={newPwdInput}
                onChange={e => setNewPwdInput(e.target.value)}
                required
              />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setPwdModalUser(null)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">取消</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Username Modal */}
      {editNameModalUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-96 shadow-xl animate-fade-in-up border border-slate-100 dark:border-slate-700">
            <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-white">修改用户名</h3>
            <form onSubmit={handleChangeUsername}>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">原用户名: {editNameModalUser.username}</label>
              <input 
                type="text" 
                placeholder="输入新用户名" 
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg mb-4 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                value={newUsernameInput}
                onChange={e => setNewUsernameInput(e.target.value)}
                required
              />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setEditNameModalUser(null)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">取消</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;