'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, Lock, Mail, User, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [data, setData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.message || 'Błąd rejestracji');
        setIsLoading(false);
        return;
      }

      // Sukces - przekieruj do logowania
      router.push('/login?registered=true');
    } catch (err) {
      setError('Wystąpił nieoczekiwany błąd.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          
          <div className="absolute top-[-50%] right-[-50%] w-[200%] h-[200%] bg-gradient-to-bl from-purple-500/10 via-transparent to-transparent pointer-events-none rounded-full blur-3xl" />

          <div className="relative z-10 text-center mb-8">
            <div className="w-16 h-16 bg-purple-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-500/20 shadow-[0_0_20px_rgba(147,51,234,0.2)]">
              <UserPlus className="w-8 h-8 text-purple-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Dołącz do systemu</h1>
            <p className="text-slate-400 text-sm mt-2">Utwórz konto w swoim Homelabie</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400 uppercase ml-1">Nazwa użytkownika</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-slate-500" size={18} />
                <input
                  type="text"
                  required
                  value={data.name}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                  className="w-full bg-slate-950/50 border border-slate-800 text-white pl-10 pr-4 py-2.5 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all placeholder:text-slate-600"
                  placeholder="Admin"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400 uppercase ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-500" size={18} />
                <input
                  type="email"
                  required
                  value={data.email}
                  onChange={(e) => setData({ ...data, email: e.target.value })}
                  className="w-full bg-slate-950/50 border border-slate-800 text-white pl-10 pr-4 py-2.5 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all placeholder:text-slate-600"
                  placeholder="admin@homelab.local"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400 uppercase ml-1">Hasło</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-500" size={18} />
                <input
                  type="password"
                  required
                  value={data.password}
                  onChange={(e) => setData({ ...data, password: e.target.value })}
                  className="w-full bg-slate-950/50 border border-slate-800 text-white pl-10 pr-4 py-2.5 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all placeholder:text-slate-600"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-medium py-2.5 rounded-xl transition-all shadow-lg shadow-purple-600/20 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Utwórz konto"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500 relative z-10">
            Masz już konto?{' '}
            <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
              Zaloguj się
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}