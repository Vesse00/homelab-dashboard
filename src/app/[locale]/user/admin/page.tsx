'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Shield, Users, Trash2, ShieldAlert, Loader2, User, UserCheck, UserX, AlertTriangle, Lock, Unlock } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);

  // Stan dla okienka modalu
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);

  const userRole = (session?.user as any)?.role;
  const currentUserId = (session?.user as any)?.id;

  const fetchUsers = async () => {
    const res = await fetch('/api/admin/users');
    if (res.ok) setUsers(await res.json());
  };

  const fetchSettings = async () => {
    const res = await fetch('/api/admin/settings');
    if (res.ok) {
      const data = await res.json();
      setRegistrationEnabled(data.registrationEnabled);
    }
  };

  useEffect(() => {
    if (userRole === 'ADMIN') {
      fetchUsers();
      fetchSettings();
    }
    setLoading(false);
  }, [userRole]);

  // AKCJA: Przełącznik Rejestracji
  const toggleRegistration = async () => {
    const newState = !registrationEnabled;
    setRegistrationEnabled(newState);
    
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registrationEnabled: newState }),
    });

    if (res.ok) {
      toast.success(newState ? 'Rejestracja otwarta!' : 'Rejestracja zamknięta!');
    } else {
      setRegistrationEnabled(!newState); // cofnij w razie błędu
      toast.error('Nie udało się zmienić ustawień');
    }
  };

  // AKCJA: Zmiana Roli (Admin <-> User)
  const toggleRole = async (id: string, currentRole: string) => {
    if (id === currentUserId) {
      toast.error("Nie możesz zmienić uprawnień samemu sobie!");
      return;
    }
    
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, role: newRole }),
    });

    if (res.ok) {
      toast.success(`Zmieniono rolę na ${newRole}`);
      fetchUsers();
    } else {
      toast.error('Błąd zmiany uprawnień');
    }
  };

  // AKCJA: Usuwanie
  const confirmDelete = async () => {
    if (!userToDelete) return;
    
    const res = await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: userToDelete.id }),
    });

    if (res.ok) {
      toast.success(`Usunięto użytkownika ${userToDelete.name}`);
      fetchUsers();
    } else {
      toast.error('Błąd usuwania użytkownika');
    }
    setDeleteModalOpen(false);
    setUserToDelete(null);
  };

  if (status === 'loading') return <div className="p-10 text-center text-slate-500">Ładowanie...</div>;

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

      {/* --- MODAL POTWIERDZENIA USUNIĘCIA --- */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-red-500/30 rounded-3xl p-6 max-w-md w-full shadow-[0_0_50px_rgba(239,68,68,0.15)] relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-red-400" />
             <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
             <h3 className="text-xl font-bold text-white text-center mb-2">Usunąć użytkownika?</h3>
             <p className="text-slate-400 text-center text-sm mb-6">
               Czy na pewno chcesz bezpowrotnie usunąć konto <span className="text-white font-bold">{userToDelete?.name}</span>? Tej operacji nie można cofnąć.
             </p>
             <div className="flex gap-3">
               <button onClick={() => setDeleteModalOpen(false)} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors">Anuluj</button>
               <button onClick={confirmDelete} className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
                 <Trash2 size={18} /> Usuń
               </button>
             </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto z-10 relative">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <Shield className="text-emerald-500" size={32} />
              Panel Administratora
            </h1>
            <p className="text-slate-400 text-sm mt-1">Zarządzaj użytkownikami i uprawnieniami w systemie.</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Przycisk Rejestracji */}
            <button 
              onClick={toggleRegistration}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all border ${registrationEnabled ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'}`}
            >
              {registrationEnabled ? <Unlock size={18} /> : <Lock size={18} />}
              {registrationEnabled ? 'Rejestracja Otwarta' : 'Rejestracja Zamknięta'}
            </button>

            <div className="bg-slate-900/80 border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2 shadow-inner">
              <Users size={16} className="text-slate-400" />
              <span className="text-sm font-bold text-white">{users.length}</span>
            </div>
          </div>
        </div>

        {/* TABELA UŻYTKOWNIKÓW */}
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
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${user.id === currentUserId ? 'bg-blue-500/10 border-blue-500/30' : 'bg-gradient-to-tr from-slate-800 to-slate-700 border-slate-600/50'}`}>
                            <User size={18} className={user.id === currentUserId ? 'text-blue-400' : 'text-slate-400'} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-200 flex items-center gap-2">
                              {user.name} 
                              {user.id === currentUserId && <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded uppercase tracking-wider">Ty</span>}
                            </p>
                            <p className="text-xs text-slate-500 font-mono">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border ${user.role === 'ADMIN' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                          {user.role === 'ADMIN' ? <Shield size={10} /> : <User size={10} />}
                          {user.role}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-400 font-mono">
                        {user.createdAt}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          
                          {/* Akcje zablokowane dla samego siebie */}
                          {user.id !== currentUserId ? (
                            <>
                              <button 
                                onClick={() => toggleRole(user.id, user.role)}
                                className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/20 transition-colors" 
                                title={user.role === 'ADMIN' ? 'Zabierz uprawnienia Admina' : 'Nadaj uprawnienia Admina'}
                              >
                                {user.role === 'ADMIN' ? <UserX size={16} /> : <UserCheck size={16} />}
                              </button>
                              <button 
                                onClick={() => { setUserToDelete(user); setDeleteModalOpen(true); }}
                                className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 transition-colors" 
                                title="Usuń użytkownika"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-slate-500 font-bold py-2">Brak akcji</span>
                          )}

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