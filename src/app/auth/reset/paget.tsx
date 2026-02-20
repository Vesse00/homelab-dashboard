'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, KeyRound, Loader2, ArrowLeft } from 'lucide-react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Brak tokenu resetującego w adresie URL.');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Wystąpił błąd podczas zmiany hasła.');
      } else {
        setSuccess(true);
        setTimeout(() => router.push('/login'), 3000); // Automatycznie przenieś do logowania
      }
    } catch (err) {
      setError('Błąd połączenia z serwerem.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center p-6 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl">
        <p className="text-red-400 mb-4">Nieprawidłowy lub brakujący link resetujący.</p>
        <Link href="/login" className="text-blue-400 hover:text-white transition-colors text-sm font-bold flex items-center justify-center gap-2">
          <ArrowLeft size={16}/> Wróć do logowania
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center p-6 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl">
        <div className="text-emerald-400 text-xl font-bold mb-2">Hasło zostało zmienione!</div>
        <p className="text-slate-400 text-sm mb-4">Za chwilę zostaniesz przeniesiony do strony logowania...</p>
        <Loader2 size={24} className="animate-spin text-emerald-500 mx-auto" />
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">{error}</div>}
        
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nowe hasło</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <KeyRound size={16} className="text-slate-500" />
            </div>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-slate-700 rounded-xl bg-black/50 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors sm:text-sm"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 focus:ring-offset-slate-900 transition-all disabled:opacity-50 mt-2"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : 'Zapisz nowe hasło'}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] relative overflow-hidden p-4">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-500/20 mb-6">
            <Shield size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Nowe Hasło</h1>
          <p className="text-slate-400 text-sm">Wprowadź bezpieczne hasło do swojego konta</p>
        </div>

        <Suspense fallback={<div className="text-center text-slate-400">Ładowanie...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}