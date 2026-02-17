'use client';

import { Shield, Users, Trash2, Edit2, CheckCircle } from 'lucide-react';

export default function AdminPanel() {
  const mockUsers = [
    { id: 1, name: "Admin", email: "admin@homelab.local", role: "ADMIN", status: "Active" },
    { id: 2, name: "Tomek", email: "tomek@homelab.local", role: "USER", status: "Pending" },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="mb-10 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Shield className="text-blue-500" /> Panel Administratora
          </h1>
          <p className="text-slate-500 mt-1">Zarządzaj użytkownikami i uprawnieniami systemu.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-slate-900/50 px-4 py-2 rounded-2xl border border-slate-800 text-center">
            <p className="text-xs text-slate-500 uppercase">Użytkownicy</p>
            <p className="text-xl font-bold">2</p>
          </div>
        </div>
      </header>

      {/* Tabela Użytkowników */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-md">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              <th className="px-6 py-4 text-xs uppercase text-slate-400 font-semibold tracking-widest">Użytkownik</th>
              <th className="px-6 py-4 text-xs uppercase text-slate-400 font-semibold tracking-widest">Rola</th>
              <th className="px-6 py-4 text-xs uppercase text-slate-400 font-semibold tracking-widest">Status</th>
              <th className="px-6 py-4 text-xs uppercase text-slate-400 font-semibold tracking-widest text-right">Akcje</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {mockUsers.map((user) => (
              <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-200">{user.name}</div>
                  <div className="text-xs text-slate-500">{user.email}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${user.role === 'ADMIN' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-xs">
                    <CheckCircle size={14} className={user.status === 'Active' ? 'text-emerald-500' : 'text-orange-500'} />
                    {user.status}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all">
                      <Edit2 size={16} />
                    </button>
                    <button className="p-2 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-500 transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}