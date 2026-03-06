'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Mail, KeyRound, Loader2, LogIn, Eye, EyeOff, Github } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('Login'); 

  // --- STANY ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // --- STANY 2FA ---
  const [totpCode, setTotpCode] = useState('');
  const [is2FAStep, setIs2FAStep] = useState(false);

  // --- OBSŁUGA LOGOWANIA ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
      totpCode: is2FAStep ? totpCode : undefined, // Wysyłamy kod tylko gdy jesteśmy w 2. kroku
    });

    setLoading(false);

    if (result?.error) {
      if (result.error === '2FA_REQUIRED') {
        setIs2FAStep(true); // Włącza drugi etap wizualny
        toast.success(t('2faRequired'));
      } else if (result.error === '2FA_INVALID') {
        toast.error(t('2faInvalid'));
      } else {
        setError(t('errorCredentials'));
      }
    } else if (result?.ok) {
      router.push(`/${locale}`);
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] relative overflow-hidden p-4 -mt-16">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-800/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-8 relative">
          <div className="flex justify-center mb-6 relative">
            <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full" />
            <div className="w-20 h-20 bg-black/50 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10 shadow-2xl z-10">
              <Shield className="text-blue-500" size={40} />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">{t('title')}</h1>
          <p className="text-slate-400 mt-2 font-medium">{t('subtitle')}</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative">
          
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* ETAP 1: EMAIL I HASŁO */}
            {!is2FAStep ? (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                {error && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold text-center">
                    {error}
                  </div>
                )}
                
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('emailLabel')}</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail size={16} className="text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-xl bg-black/50 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      placeholder="admin@homelab.local"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                     <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">{t('passwordLabel')}</label>
                     <Link href={`/${locale}/forgot-password`} className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors">
                       {t('forgotPassword')}
                     </Link>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <KeyRound size={16} className="text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-12 py-3 border border-slate-700 rounded-xl bg-black/50 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      placeholder="••••••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email || !password}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <><LogIn size={20} /> Zaloguj się</>}
                </button>

                <div className="mt-8 mb-6 flex items-center gap-4">
                  <div className="flex-1 h-px bg-slate-800"></div>
                  <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">LUB</span>
                  <div className="flex-1 h-px bg-slate-800"></div>
                </div>

                <button
                  type="button"
                  onClick={() => signIn('github', { callbackUrl: `/${locale}` })}
                  className="w-full py-3.5 bg-[#24292e] hover:bg-[#2f363d] text-white rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-3 group border border-white/5"
                >
                  <Github size={20} className="group-hover:scale-110 transition-transform" />
                  Zaloguj przez GitHub
                </button>
              </div>
            ) : (
              
              /* ETAP 2: KOD 2FA */
              <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                     <Shield className="text-emerald-400" size={32} />
                  </div>
                </div>
                
                <h3 className="text-center font-bold text-white mb-2 text-xl">Weryfikacja dwuetapowa</h3>
                <p className="text-center text-slate-400 text-sm mb-6">Wpisz kod z aplikacji autoryzującej (np. Google Authenticator)</p>

                <input
                  type="text"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder={t('placeholder2fa')}
                  className="block w-full px-4 py-4 border border-slate-700 rounded-xl bg-black/60 text-emerald-400 placeholder-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-center tracking-[0.5em] font-mono text-2xl transition-all"
                  maxLength={6}
                  required
                  autoFocus
                />
                
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setIs2FAStep(false);
                      setTotpCode(''); // Czyścimy kod przy cofnięciu
                      setLoading(false);
                    }}
                    className="flex-1 py-3.5 bg-slate-800/80 hover:bg-slate-700 text-white rounded-xl font-bold transition-all border border-slate-700"
                  >
                    {t('btnBack')}
                  </button>
                  <button
                    type="submit"
                    disabled={loading || totpCode.length < 6}
                    className="flex-[2] py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                  >
                    {loading ? <Loader2 size={20} className="animate-spin mx-auto" /> : t('btnVerify')}
                  </button>
                </div>
              </div>
            )}
            
          </form>
        </div>

        <div className="mt-8 text-center text-sm font-bold text-slate-500">
          <Link href={`/${locale}/register`} className="hover:text-blue-400 transition-colors">
            {t('noAccount')}
          </Link>
        </div>
      </div>
    </div>
  );
}