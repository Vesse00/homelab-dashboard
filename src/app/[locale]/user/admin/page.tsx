'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Shield, Users, Trash2, ShieldAlert, Loader2, User, UserCheck, UserX, AlertTriangle, Lock, Unlock, Terminal as TerminalIcon, X } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useTranslations } from 'next-intl';

// --- IMPORTY TERMINALA (XTERM + SOCKET.IO) ---
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { io, Socket } from 'socket.io-client';

export default function AdminPage() {
  const t = useTranslations('AdminPanel');
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);

  // --- STANY KONSOLI I AUTORYZACJI (SUDO MODE) ---
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);

  // --- REFERENCJE TERMINALA ---
  const terminalRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const xtermRef = useRef<Terminal | null>(null);

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

  // =========================================================================
  // LOGIKA TERMINALA XTERM.JS
  // =========================================================================
  useEffect(() => {
    // Odpal terminal tylko gdy modal jest otwarty i mamy referencję do diva
    if (!isConsoleOpen || !terminalRef.current || !session?.user?.email) return;

    // 1. Inicjalizacja Xterm.js
    const term = new Terminal({
      // Nasz niestandardowy styl nawiązujący do Dashboardu
      theme: {
        background: '#0f172a',    // slate-900
        foreground: '#e2e8f0',    // slate-200 (jasny tekst)
        cursor: '#3b82f6',        // blue-500
        selectionBackground: 'rgba(59, 130, 246, 0.3)',
        black: '#000000',
        red: '#ef4444',           // red-500
        green: '#10b981',         // emerald-500
        yellow: '#f59e0b',        // amber-500
        blue: '#3b82f6',          // blue-500
        magenta: '#8b5cf6',       // violet-500
        cyan: '#06b6d4',          // cyan-500
        white: '#ffffff',
      },
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      fontSize: 13,
      lineHeight: 1.2,
      cursorBlink: true,
      cursorStyle: 'bar', // Cienka kreska zamiast bloku (bardziej nowoczesne)
      allowTransparency: true,
    });
    
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    
    // Małe opóźnienie dla fit(), żeby modal zdążył się w pełni wyrenderować
    setTimeout(() => fitAddon.fit(), 50);
    xtermRef.current = term;

    term.writeln('\x1b[36mNawiązywanie połączenia z serwerem...\x1b[0m');

    // 2. Nawiązanie połączenia Socket.io (PORT 3004!)
    const host = window.location.hostname; 
    const socket = io(`http://${host}:3004`);
    socketRef.current = socket;

    socket.on('connect', () => {
      // Przy połączeniu od razu wysyłamy email i wpisane hasło do weryfikacji
      socket.emit('authenticate', { 
        email: session.user?.email, 
        password: adminPassword 
      });
    });

    socket.on('auth_success', () => {
      term.clear();
      term.writeln('\x1b[32m✓ Autoryzacja zakończona sukcesem. Uruchamianie powłoki...\x1b[0m\r\n');
      
      // Wysyłanie znaków z klawiatury do Node.js
      term.onData((data) => {
        socket.emit('input', data);
      });

      // Responsywność terminala
      const resizeObserver = new ResizeObserver(() => {
        fitAddon.fit();
        socket.emit('resize', { cols: term.cols, rows: term.rows });
      });
      resizeObserver.observe(terminalRef.current!);
    });

    socket.on('auth_fail', (msg) => {
      term.writeln(`\r\n\x1b[31m✗ BŁĄD: ${msg}\x1b[0m`);
    });

    // Odbiór logów z serwera (np. wynik ls, htop)
    socket.on('output', (data) => {
      term.write(data);
    });

    socket.on('disconnect', () => {
      term.writeln('\r\n\x1b[31m✗ Połączenie z terminalem zostało przerwane.\x1b[0m');
    });

    // Czyszczenie przy zamykaniu okna
    return () => {
      socket.disconnect();
      term.dispose();
    };
  }, [isConsoleOpen]); // <-- Zależność: uruchom tylko gdy isConsoleOpen się zmienia

  // =========================================================================

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPassword.trim()) return;
    
    // Zamykamy modal autoryzacji i otwieramy modal konsoli. 
    // Weryfikację "w locie" przejmuje teraz nasz terminal-server.mjs przez WebSockets!
    setIsVerifying(true);
    setIsAuthModalOpen(false);
    setIsConsoleOpen(true);
    setIsVerifying(false);
  };

  const toggleRegistration = async () => {
    const newState = !registrationEnabled;
    setRegistrationEnabled(newState);
    
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registrationEnabled: newState }),
    });

    if (res.ok) toast.success(newState ? t('registrationOpened') : t('registrationClosed'));
    else { setRegistrationEnabled(!newState); toast.error(t('errorSettings')); }
  };

  const toggleRole = async (id: string, currentRole: string) => {
    if (id === currentUserId) return toast.error(t('errorSelfRole'));
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    const res = await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, role: newRole }) });
    if (res.ok) { toast.success(t('roleChanged', { role: newRole })); fetchUsers(); } 
    else toast.error(t('errorRoleChange'));
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    const res = await fetch('/api/admin/users', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: userToDelete.id }) });
    if (res.ok) { toast.success(t('userDeleted', { name: userToDelete.name })); fetchUsers(); } 
    else toast.error(t('errorDeleteUser'));
    setDeleteModalOpen(false); setUserToDelete(null);
  };

  if (status === 'loading') return <div className="p-10 text-center text-slate-500">{t('loading')}</div>;

  if (userRole !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center max-w-md">
          <ShieldAlert size={48} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">{t('accessDenied')}</h1>
          <p className="text-slate-400 mb-6">{t('accessDeniedDesc')}</p>
          <Link href="/" className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all">{t('backToDashboard')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 relative">
      <div className="absolute top-20 right-10 w-96 h-96 bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* --- MODAL WERYFIKACJI HASŁA (SUDO MODE) --- */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-purple-600" />
             <div className="flex justify-center mb-4">
               <div className="p-3 bg-blue-500/10 rounded-full shadow-inner">
                 <Lock size={32} className="text-blue-400" />
               </div>
             </div>
             <h3 className="text-xl font-bold text-white text-center mb-2">{t('sudoTitle')}</h3>
             <p className="text-slate-400 text-center text-sm mb-6">{t('sudoDesc')}</p>

             <form onSubmit={handleVerifyPassword}>
               <input
                 type="password"
                 value={adminPassword}
                 onChange={e => setAdminPassword(e.target.value)}
                 className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 mb-4 transition-colors"
                 placeholder={t('sudoPlaceholder')}
                 autoFocus
               />
               <div className="flex gap-3">
                 <button type="button" onClick={() => { setIsAuthModalOpen(false); setAdminPassword(''); }} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors">{t('btnCancel')}</button>
                 <button type="submit" disabled={isVerifying || !adminPassword} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
                   {isVerifying ? <Loader2 size={18} className="animate-spin" /> : <Unlock size={18} />} {t('btnUnlock')}
                 </button>
               </div>
             </form>
          </div>
        </div>
      )}

      {/* --- MODAL TERMINALA (XTERM.JS) --- */}
      {isConsoleOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-slate-950 border border-slate-700 rounded-xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col h-[80vh]">
            <div className="p-3 border-b border-slate-800 bg-slate-900 flex justify-between items-center cursor-default">
              <div className="flex items-center gap-2">
                <TerminalIcon size={18} className="text-emerald-500" />
                <h3 className="text-sm font-bold text-white tracking-widest uppercase">{t('consoleTerminalTitle')}</h3>
              </div>
              <button 
                onClick={() => { setIsConsoleOpen(false); setAdminPassword(''); }} 
                className="text-slate-400 hover:text-red-500 transition-colors bg-slate-800 hover:bg-red-500/10 p-1.5 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Magiczny kontener do którego przypina się xterm.js */}
            <div 
              ref={terminalRef} 
              className="flex-1 p-2 bg-[#020617] overflow-hidden " 
            />
          </div>
        </div>
      )}

      {/* --- MODAL USUWANIA --- */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-red-500/30 rounded-3xl p-6 max-w-md w-full shadow-[0_0_50px_rgba(239,68,68,0.15)] relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-red-400" />
             <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
             <h3 className="text-xl font-bold text-white text-center mb-2">{t('modalDeleteTitle')}</h3>
             <p className="text-slate-400 text-center text-sm mb-6">
               {t('modalDeleteDesc1')}<span className="text-white font-bold">{userToDelete?.name}</span>{t('modalDeleteDesc2')}
             </p>
             <div className="flex gap-3">
               <button onClick={() => setDeleteModalOpen(false)} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors">{t('btnCancel')}</button>
               <button onClick={confirmDelete} className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
                 <Trash2 size={18} /> {t('btnDelete')}
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
              {t('title')}
            </h1>
            <p className="text-slate-400 text-sm mt-1">{t('subtitle')}</p>
          </div>
          
          <div className="flex items-center gap-4">
            
            {/* PRZYCISK KONSOLI */}
            <button 
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-700 hover:border-slate-500 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl font-bold transition-all shadow-lg group"
            >
              <TerminalIcon size={18} className="text-blue-400 group-hover:text-blue-300 transition-colors" />
              <span className="hidden sm:inline">{t('consoleBtn')}</span>
            </button>

            {/* Przycisk Rejestracji */}
            <button 
              onClick={toggleRegistration}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all border ${registrationEnabled ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'}`}
            >
              {registrationEnabled ? <Unlock size={18} /> : <Lock size={18} />}
              <span className="hidden sm:inline">{registrationEnabled ? t('registrationOpenBtn') : t('registrationClosedBtn')}</span>
            </button>

            <div className="bg-slate-900/80 border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2 shadow-inner hidden sm:flex">
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
                  <th className="p-4 pl-6">{t('tableUser')}</th>
                  <th className="p-4">{t('tableRole')}</th>
                  <th className="p-4">{t('tableJoined')}</th>
                  <th className="p-4 pr-6 text-right">{t('tableActions')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-10 text-center text-slate-500">
                      <Loader2 size={24} className="animate-spin mx-auto mb-2" /> {t('loadingUsers')}
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
                              {user.id === currentUserId && <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded uppercase tracking-wider">{t('badgeYou')}</span>}
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
                          {user.id !== currentUserId ? (
                            <>
                              <button onClick={() => toggleRole(user.id, user.role)} className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/20 transition-colors" title={user.role === 'ADMIN' ? t('titleRevokeAdmin') : t('titleGrantAdmin')}>
                                {user.role === 'ADMIN' ? <UserX size={16} /> : <UserCheck size={16} />}
                              </button>
                              <button onClick={() => { setUserToDelete(user); setDeleteModalOpen(true); }} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 transition-colors" title={t('titleDeleteUser')}>
                                <Trash2 size={16} />
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-slate-500 font-bold py-2">{t('noActions')}</span>
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