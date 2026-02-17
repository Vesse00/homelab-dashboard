'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [data, setData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const res = await signIn('credentials', {
      redirect: false,
      email: data.email,
      password: data.password,
    });

    if (res?.error) {
      setError('Nieprawidłowy email lub hasło.');
      setIsLoading(false);
    } else {
      router.push('/'); // Przekierowanie po sukcesie
      router.refresh(); // Odświeżenie sesji w komponentach serwerowych
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Karta Logowania */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          
          {/* Ozdobny błysk w tle */}
          <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-br from-blue-500/10 via-transparent to-transparent pointer-events-none rounded-full blur-3xl" />

          <div className="relative z-10 text-center mb-8">
            <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20 shadow-[0_0_20px_rgba(37,99,235,0.2)]">
              <Shield className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Witaj ponownie</h1>
            <p className="text-slate-400 text-sm mt-2">Zaloguj się do swojego Command Center</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400 uppercase ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-500" size={18} />
                <input
                  type="email"
                  required
                  value={data.email}
                  onChange={(e) => setData({ ...data, email: e.target.value })}
                  className="w-full bg-slate-950/50 border border-slate-800 text-white pl-10 pr-4 py-2.5 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600"
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
                  className="w-full bg-slate-950/50 border border-slate-800 text-white pl-10 pr-4 py-2.5 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Zaloguj się"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500 relative z-10">
            Nie masz konta?{' '}
            <Link href="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
              Zarejestruj się
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}