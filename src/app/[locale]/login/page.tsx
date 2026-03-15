'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Mail, KeyRound, Loader2, LogIn, Eye, EyeOff, Github, TabletSmartphone, UserCircle } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('Login'); 

  // --- STANY PWA I KIOSKU ---
  const [viewMode, setViewMode] = useState<'loading' | 'prompt' | 'standard' | 'kiosk'>('loading');
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [kioskId, setKioskId] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  // --- STANY LOGOWANIA ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // --- STANY 2FA ---
  const [totpCode, setTotpCode] = useState('');
  const [is2FAStep, setIs2FAStep] = useState(false);

  // 1. Sprawdzanie czy jesteśmy w PWA (Standalone)
  useEffect(() => {
    // Odpalamy to tylko w przeglądarce
    if (typeof window !== 'undefined') {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
      const token = localStorage.getItem('kiosk_device_token');

      // Jeżeli PWA i nie mamy jeszcze zapisanego tokenu kiosku
      if (isStandalone) {
        if (token) {
          // APLIKACJA MA JUŻ TOKEN! Natychmiastowe przekierowanie do Kiosku
          router.push(`/${locale}/kiosk`);
        } else {
          // Aplikacja czysta, pytamy czy chce być Kioskiem
          setViewMode('prompt'); 
        }
      } else {
        // Zwykła przeglądarka PC
        setViewMode('standard'); 
      }
    }
  }, [locale, router]);

  // 2. Inicjalizacja Kiosku (Gdy użytkownik wybierze "Skonfiguruj jako Kiosk")
  const startKioskPairing = async () => {
    setViewMode('kiosk');
    try {
      const res = await fetch('/api/kiosk/init', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setPairingCode(data.pairingCode);
        setKioskId(data.kioskId);
        setIsPolling(true);
      } else {
        toast.error("Błąd generowania kodu");
        setViewMode('prompt');
      }
    } catch (e) {
      toast.error("Błąd połączenia z serwerem");
      setViewMode('prompt');
    }
  };

  // 3. Polling - Sprawdzanie co 3 sekundy czy ktoś sparował tablet na PC
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isPolling && kioskId) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/kiosk/status?id=${kioskId}&t=${Date.now()}`, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
          const data = await res.json();

          if (data.status === 'paired' && data.deviceToken) {
            setIsPolling(false);
            clearInterval(interval);
            setViewMode('loading');
            
            // ZAPISUJEMY TOKEN I PRZEKIEROWUJEMY NA CZYSTY EKRAN KIOSKU!
            localStorage.setItem('kiosk_device_token', data.deviceToken);
            toast.success("Połączono pomyślnie!");
            window.location.href = `/${locale}/kiosk`;
          }
        } catch (error) {
          console.error("Polling error", error);
        }
      }, 3000);
    }

    return () => clearInterval(interval);
  }, [isPolling, kioskId, locale, router]);


  // --- OBSŁUGA STANDARDOWEGO LOGOWANIA ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
      totpCode: is2FAStep ? totpCode : undefined,
    });

    setLoading(false);

    if (result?.error) {
      if (result.error === '2FA_REQUIRED') {
        setIs2FAStep(true); 
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

  // Jeśli ekran jeszcze myśli (sprawdza standalone), nie pokazuj nic żeby nie mrugało
  if (viewMode === 'loading') return <div className="min-h-screen bg-[#0a0a0a]" />;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] relative overflow-hidden p-4 -mt-16">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-800/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* WIDOK 1: WYBÓR W TRYBIE PWA */}
        {viewMode === 'prompt' && (
          <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-black/50 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10 shadow-2xl">
                <TabletSmartphone className="text-purple-400" size={40} />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Tryb Pełnoekranowy</h2>
            <p className="text-slate-400 text-sm mb-8">Wykryto uruchomienie jako aplikacja. Jak chcesz skonfigurować to urządzenie?</p>

            <div className="space-y-4">
              <button 
                onClick={startKioskPairing}
                className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-3 group"
              >
                <TabletSmartphone size={20} className="group-hover:scale-110 transition-transform" />
                Skonfiguruj jako Ekran Ścienny
              </button>
              
              <button 
                onClick={() => setViewMode('standard')}
                className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl font-bold transition-all border border-slate-700 flex items-center justify-center gap-3 group"
              >
                <UserCircle size={20} className="group-hover:scale-110 transition-transform" />
                Zaloguj jako użytkownik
              </button>
            </div>
          </div>
        )}

        {/* WIDOK 2: OCZEKIWANIE NA PAROWANIE KIOSKU */}
        {viewMode === 'kiosk' && (
          <div className="bg-slate-900/50 backdrop-blur-xl border border-purple-500/30 p-8 rounded-3xl shadow-2xl text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-purple-500/20 rounded-2xl flex items-center justify-center border border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                {pairingCode ? <TabletSmartphone className="text-purple-400 animate-pulse" size={40} /> : <Loader2 className="text-purple-400 animate-spin" size={40} />}
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2">Gotowy do parowania</h2>
            <p className="text-slate-400 text-sm mb-8">Otwórz główny panel na swoim komputerze, wejdź w tworzenie zakładki z opcją <strong>Kiosk Mode</strong> i wpisz poniższy kod:</p>

            {pairingCode ? (
              <div className="bg-slate-950/80 border-2 border-purple-500/50 rounded-2xl py-6 mb-8 shadow-inner">
                <span className="text-4xl font-mono font-extrabold text-white tracking-[0.2em] uppercase">{pairingCode}</span>
              </div>
            ) : (
              <div className="h-24 flex items-center justify-center mb-8">
                <Loader2 size={32} className="animate-spin text-purple-500" />
              </div>
            )}

            <div className="flex items-center justify-center gap-2 text-sm text-purple-400 mb-6">
              <div className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
              Oczekiwanie na połączenie...
            </div>

            <button 
              onClick={() => {
                setIsPolling(false);
                setViewMode('prompt');
              }}
              className="px-6 py-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Anuluj
            </button>
          </div>
        )}

        {/* WIDOK 3: STANDARDOWE LOGOWANIE (Twój obecny kod, lekko owinięty) */}
        {viewMode === 'standard' && (
          <>
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
                    <p className="text-center text-slate-400 text-sm mb-6">Wpisz kod z aplikacji autoryzującej</p>

                    <input
                      type="text"
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
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
                          setTotpCode(''); 
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
          </>
        )}

      </div>
    </div>
  );
}