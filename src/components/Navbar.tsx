'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { signOut, useSession } from 'next-auth/react';
import { User, Settings, LogOut, Shield } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [time, setTime] = useState<Date | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Ukrywamy navbar na stronach logowania/rejestracji itp.
  const hiddenPaths = ['/login', '/register', '/forgot-password', '/auth/reset'];
  
  const userRole = (session?.user as any)?.role;
  const userName = session?.user?.name || "Użytkownik";
  const userEmail = session?.user?.email || "user@local";

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (hiddenPaths.some(path => pathname?.startsWith(path))) {
    return null;
  }
  
  const formattedTime = time ? time.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '...';
  const formattedDate = time ? time.toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'short' }) : '...';

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] bg-slate-950/40 backdrop-blur-md border-b border-white/5 shadow-sm">
      <div className="w-full h-16 px-6 flex items-center justify-between">

        {/* --- LOGO --- */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform relative overflow-hidden">
              <div className="absolute inset-0 bg-white/20 skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <Shield className="text-white w-5 h-5 relative z-10" />
            </div>
            <span className="font-bold text-lg tracking-tight hidden md:block text-transparent bg-clip-text bg-gradient-to-r from-blue-100 to-blue-400">
              COMMAND CENTER
            </span>
          </Link>
        </div>

        {/* --- ZEGAR (Środek) --- */}
        <div className="hidden sm:flex flex-col items-center px-4 py-1 rounded-lg pointer-events-none absolute left-1/2 -translate-x-1/2">
          <span className="text-sm font-mono font-bold text-blue-300/90 leading-none drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]">{formattedTime}</span>
          <span className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">{formattedDate}</span>
        </div>

        {/* --- PRAWA STRONA (Profil) --- */}
        <div className="flex items-center gap-2">
          {status === 'authenticated' ? (
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className={`flex items-center gap-2 p-1 pr-3 rounded-full transition-all border ${isProfileOpen ? 'bg-white/10 border-white/10' : 'border-transparent hover:bg-white/5 hover:border-white/5'}`}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center border border-slate-600/50 ring-2 ring-transparent group-hover:ring-blue-500/30 transition-all">
                  <User size={16} className="text-slate-300" />
                </div>
                <span className="text-sm font-bold hidden md:block text-slate-300">{userName}</span>
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <>
                    <div className="fixed inset-0 z-[-1]" onClick={() => setIsProfileOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-3 w-64 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden py-2 origin-top-right"
                    >
                      <div className="px-4 py-3 border-b border-white/5 mb-1 bg-black/20">
                        <p className="text-sm font-bold text-white">{userName}</p>
                        <p className="text-xs text-blue-400 truncate">{userEmail}</p>
                        <p className="text-[9px] text-slate-500 mt-1.5 uppercase tracking-widest font-bold flex items-center gap-1">
                          <Shield size={10} /> {userRole}
                        </p>
                      </div>

                      <div className="p-1">
                        <Link href="/user/settings" onClick={() => setIsProfileOpen(false)}>
                          <DropdownItem icon={<Settings size={16} />} label="Ustawienia konta" />
                        </Link>
                        {userRole === 'ADMIN' && (
                          <Link href="/user/admin" onClick={() => setIsProfileOpen(false)}>
                            <DropdownItem icon={<Shield size={16} />} label="Panel Admina" color="text-blue-400" bgHover="hover:bg-blue-500/10" />
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-white/5 mt-1 pt-1 p-1">
                        <button onClick={() => signOut({ callbackUrl: '/login' })} className="w-full">
                          <DropdownItem icon={<LogOut size={16} />} label="Wyloguj" color="text-red-400" bgHover="hover:bg-red-500/10" />
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link href="/login" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors shadow-lg">
              Zaloguj się
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

function DropdownItem({ icon, label, color = "text-slate-300", bgHover = "hover:bg-white/5" }: any) {
  return (
    <div className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${color} ${bgHover} group`}>
      <span className="opacity-70 group-hover:opacity-100 transition-opacity">{icon}</span>
      <span>{label}</span>
    </div>
  );
}