'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Shield, Users, Trash2, ShieldAlert, Edit, Loader2, User } from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const userRole = (session?.user as any)?.role;

useEffect(() => {
    const fetchUsers = async () => {
      if (userRole === 'ADMIN') {
        const res = await fetch('/api/admin/users');
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        }
      }
      setLoading(false);
    };
    fetchUsers();
  }, [userRole]);

  if (status === 'loading') return <div className="p-10 text-center text-slate-500">Ładowanie...</div>;

  // Zabezpieczenie frontendu przed niepowołanym dostępem
  if (userRole !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center max-w-md">
          <ShieldAlert size={48} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Brak Dostępu</h1>
          <p className="text-slate-400 mb-6">Ta sekcja jest zarezerwowana wyłącznie dla administratorów systemu.</p>
          <Link href="/" className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all">Powrót do Dashboardu</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 relative">
      <div className="absolute top-20 right-10 w-96 h-96 bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto z-10 relative">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <Shield className="text-emerald-500" size={32} />
              Panel Administratora
            </h1>
            <p className="text-slate-400 text-sm mt-1">Zarządzaj użytkownikami i uprawnieniami w systemie.</p>
          </div>
          <div className="bg-slate-900/80 border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2 shadow-inner">
            <Users size={16} className="text-emerald-500" />
            <span className="text-sm font-bold text-white">{users.length} Użytkowników</span>
          </div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in duration-500">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/40 border-b border-white/5 text-xs uppercase tracking-wider text-slate-400 font-bold">
                  <th className="p-4 pl-6">Użytkownik</th>
                  <th className="p-4">Rola</th>
                  <th className="p-4">Dołączył</th>
                  <th className="p-4 pr-6 text-right">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-10 text-center text-slate-500">
                      <Loader2 size={24} className="animate-spin mx-auto mb-2" /> Wczytywanie użytkowników...
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center border border-slate-600/50">
                            <User size={18} className="text-slate-400" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-200">{user.name}</p>
                            <p className="text-xs text-slate-500 font-mono">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border ${user.role === 'ADMIN' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                          {user.role === 'ADMIN' && <Shield size={10} />}
                          {user.role}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-400 font-mono">
                        {user.createdAt}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/20 transition-colors" title="Zmień rolę">
                            <Edit size={16} />
                          </button>
                          <button className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 transition-colors" title="Usuń użytkownika">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}