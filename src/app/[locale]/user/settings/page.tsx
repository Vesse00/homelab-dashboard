'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { User, Mail, Shield, KeyRound, Save, Loader2, Link2, Github, Unlink, Plus, Eye, EyeOff, ShieldAlert, Smartphone, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';

export default function SettingsPage() {
  const t = useTranslations('Settings');
  const { data: session, update } = useSession();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'connections'>('profile');
  const [loading, setLoading] = useState(false);

  // Stany profilu
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  // Stany haseł
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Stany powiązań i 2FA
  const [providers, setProviders] = useState<string[]>([]);
  const [hasPassword, setHasPassword] = useState<boolean>(true);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [setup2FA, setSetup2FA] = useState<{ secret: string; qrCode: string } | null>(null);
  const [totpToken, setTotpToken] = useState('');

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || '');
      setEmail(session.user.email || '');
      fetchConnections();
    }
  }, [session]);

  const fetchConnections = async () => {
    try {
      const res = await fetch('/api/user/settings');
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers || []);
        setHasPassword(data.hasPassword);
        setIs2FAEnabled(data.is2FAEnabled);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateProfile', name, email }),
      });
      const data = await res.json();
      if (res.ok) {
        await update({ ...session, user: { ...session?.user, name, email } });
        toast.success(data.message || t('toastProfileUpdated'));
        window.location.reload(); 
      } else {
        toast.error(data.error || t('toastError'));
      }
    } catch (err) {
      toast.error(t('toastConnectionError'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      return toast.error(t('passwordMismatch'));
    }
    setLoading(true);
    const res = await fetch('/api/user/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'changePassword', currentPassword, newPassword }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      toast.success(data.message || t('toastPassSet'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      fetchConnections(); 
    } else {
      toast.error(data.error);
    }
  };

  const handleLinkProvider = (provider: string) => {
    signIn(provider, { callbackUrl: window.location.href });
  };

  const handleUnlinkProvider = async (provider: string) => {
    setLoading(true);
    const res = await fetch('/api/user/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'unlinkProvider', provider }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      toast.success(data.message);
      fetchConnections();
    } else {
      toast.error(data.error);
    }
  };

  const handleGenerate2FA = async () => {
    setLoading(true);
    const res = await fetch('/api/user/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'generate2fa' }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) setSetup2FA(data);
    else toast.error(data.error);
  };

  const handleConfirm2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/user/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'enable2fa', secret: setup2FA?.secret, token: totpToken }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      toast.success(t('toast2faEnabled'));
      setSetup2FA(null);
      setTotpToken('');
      fetchConnections();
    } else {
      toast.error(t('toast2faInvalidCode'));
    }
  };

// Faktyczna akcja wysyłana do API po potwierdzeniu
  const confirmDisable2FA = async (toastId: string) => {
    toast.dismiss(toastId); // Zamykamy toast z pytaniem
    setLoading(true);
    const res = await fetch('/api/user/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'disable2fa' }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      toast.success(t('toast2faDisabled'));
      fetchConnections();
    } else {
      toast.error(data.error);
    }
  };

  const handleDisable2FA = () => {
    toast((tToast) => (
      <div className="flex flex-col gap-3">
        <p className="font-bold text-slate-900 dark:text-slate-100">
          {t('disable2faTitle')}
        </p>
        <p className="text-sm text-slate-500">
          {t('disable2faDesc')}
        </p>
        <div className="flex justify-end gap-2 mt-2">
          <button 
            onClick={() => toast.dismiss(tToast.id)}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-sm font-bold transition-colors"
          >
            {t('btnCancel')}
          </button>
          <button 
            onClick={() => confirmDisable2FA(tToast.id)}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
          >
            <ShieldAlert size={16} /> {t('btnConfirmDisable')}
          </button>
        </div>
      </div>
    ), { 
      duration: Infinity, 
      position: 'top-center',
      style: {
        background: '#0f172a',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        color: '#fff',
      }
    });
  };

  // Pomocniczy komponent do inputu hasła z ikoną podglądu
  const PasswordInput = ({ label, value, onChange, placeholder }: any) => (
    <div>
      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</label>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <KeyRound size={16} className="text-slate-500 group-focus-within:text-purple-400 transition-colors" />
        </div>
        <input 
          type={showPassword ? "text" : "password"} 
          value={value} 
          onChange={onChange} 
          required 
          minLength={6} 
          className="block w-full pl-10 pr-12 py-2.5 border border-slate-700 rounded-xl bg-black/50 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all" 
          placeholder={placeholder} 
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
  );

  return (
    <div className="min-h-screen p-6 relative">
      <div className="absolute top-20 left-10 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto z-10 relative">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <User className="text-blue-500" size={32} />
            {t('title')}
          </h1>
          <p className="text-slate-400 text-sm mt-1">{t('subtitle')}</p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-64 flex flex-col gap-2">
            <button onClick={() => setActiveTab('profile')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'profile' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'}`}>
              <User size={18} /> {t('tabProfile')}
            </button>
            <button onClick={() => setActiveTab('security')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'security' ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'}`}>
              <Shield size={18} /> {t('tabSecurity')}
            </button>
            <button onClick={() => setActiveTab('connections')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'connections' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'}`}>
              <Link2 size={18} /> {t('tabConnections')}
            </button>
          </div>

          <div className="flex-1 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl animate-in fade-in duration-500">
            
            {activeTab === 'profile' && (
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <h2 className="text-xl font-bold text-white mb-4">{t('profileInfo')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('username')}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User size={16} className="text-slate-500" /></div>
                      <input type="text" value={name} onChange={e => setName(e.target.value)} className="block w-full pl-10 pr-3 py-2.5 border border-slate-700 rounded-xl bg-black/50 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('email')}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail size={16} className="text-slate-500" /></div>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="block w-full pl-10 pr-3 py-2.5 border border-slate-700 rounded-xl bg-black/50 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex justify-end">
                  <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50">
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> {t('btnSaveProfile')}</>}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'security' && (
              <div className="space-y-10">
                <form onSubmit={handleUpdatePassword} className="space-y-6">
                  <h2 className="text-xl font-bold text-white mb-4">{t('changePassword')}</h2>
                  
                  <div className="max-w-md space-y-5">
                    {hasPassword && (
                      <PasswordInput label={t('currentPassword')} value={currentPassword} onChange={(e: any) => setCurrentPassword(e.target.value)} placeholder="••••••••" />
                    )}
                    <PasswordInput label={t('newPassword')} value={newPassword} onChange={(e: any) => setNewPassword(e.target.value)} placeholder="••••••••" />
                    <PasswordInput label={t('confirmPassword')} value={confirmNewPassword} onChange={(e: any) => setConfirmNewPassword(e.target.value)} placeholder="••••••••" />
                  </div>

                  <div className="pt-4 flex justify-start">
                    <button type="submit" disabled={loading || !newPassword || newPassword !== confirmNewPassword} className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                      {loading ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> {t('btnUpdatePassword')}</>}
                    </button>
                  </div>
                </form>

                <hr className="border-white/10" />

                <div>
                  <h2 className="text-xl font-bold text-white mb-2">{t('2faTitle')}</h2>
                  <p className="text-slate-400 text-sm mb-6">{t('2faDesc')}</p>

                  <div className={`p-6 border rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 transition-all ${is2FAEnabled ? 'bg-emerald-950/30 border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.05)]' : 'bg-black/30 border-slate-700/50 hover:bg-black/50'}`}>
                    <div className="flex items-center gap-4">
                       <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${is2FAEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                          {is2FAEnabled ? <CheckCircle2 size={24} /> : <ShieldAlert size={24} />}
                       </div>
                       <div>
                         <p className={`font-bold text-lg ${is2FAEnabled ? 'text-emerald-400' : 'text-slate-300'}`}>
                           {is2FAEnabled ? t('2faEnabled') : t('2faDisabled')}
                         </p>
                         <p className="text-xs text-slate-500">{t('addionalSafe')}</p>
                       </div>
                    </div>
                    <div className="w-full sm:w-auto">
                      {is2FAEnabled ? (
                         <button onClick={handleDisable2FA} disabled={loading} className="w-full sm:w-auto px-6 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 rounded-xl text-sm font-bold transition-all">
                           {t('btnDisable2fa')}
                         </button>
                      ) : (
                         <button onClick={handleGenerate2FA} disabled={loading || setup2FA !== null} className="w-full sm:w-auto px-6 py-2.5 bg-slate-100 hover:bg-white text-slate-900 rounded-xl text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-2">
                           <Smartphone size={16} /> {t('btnEnable2fa')}
                         </button>
                      )}
                    </div>
                  </div>

                  {setup2FA && !is2FAEnabled && (
                    <div className="mt-6 p-8 bg-slate-950/80 border border-emerald-500/30 rounded-2xl animate-in fade-in zoom-in-95 duration-300 shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 to-emerald-400" />
                      
                      <div className="flex flex-col md:flex-row gap-8 items-center">
                        <div className="text-center md:text-left flex-1">
                          <div className="flex items-center gap-3 justify-center md:justify-start mb-4">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">1</div>
                            <h3 className="font-bold text-white text-lg">{t('2faStep1')}</h3>
                          </div>
                          <div className="bg-white p-3 rounded-2xl inline-block shadow-[0_0_50px_rgba(255,255,255,0.1)] mb-4">
                            <img src={setup2FA.qrCode} alt="2FA QR Code" className="w-48 h-48" />
                          </div>
                          <p className="text-slate-400 text-xs font-mono bg-black/50 px-3 py-2 rounded-lg inline-block border border-white/5 break-all max-w-[200px]">
                            {setup2FA.secret}
                          </p>
                        </div>

                        <div className="w-px h-48 bg-white/10 hidden md:block" />

                        <div className="text-center md:text-left flex-1 w-full">
                          <div className="flex items-center gap-3 justify-center md:justify-start mb-6">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">2</div>
                            <h3 className="font-bold text-white text-lg">{t('2faStep2')}</h3>
                          </div>
                          <form onSubmit={handleConfirm2FA} className="flex flex-col gap-4">
                             <input 
                               type="text" 
                               value={totpToken} 
                               onChange={e => setTotpToken(e.target.value.replace(/\D/g, ''))} 
                               placeholder={t('placeholder2fa')}
                               className="w-full bg-black/60 border border-slate-700 rounded-xl px-4 py-4 text-emerald-400 text-center tracking-[0.5em] font-mono text-2xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder-slate-600"
                               maxLength={6}
                               required
                               autoFocus
                             />
                             <button type="submit" disabled={loading || totpToken.length < 6} className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                               {loading ? <Loader2 size={20} className="animate-spin mx-auto" /> : t('btnConfirm2fa')}
                             </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'connections' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white mb-4">{t('tabConnections')}</h2>
                <p className="text-slate-400 text-sm mb-6">{t('connectionsInfo')}</p>
                
                <div className="bg-black/40 border border-slate-700/50 rounded-2xl p-6 hover:bg-black/60 transition-colors">
                   <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                         <div className="w-12 h-12 bg-[#24292e] rounded-xl flex items-center justify-center shadow-lg shrink-0">
                            <Github size={24} className="text-white" />
                         </div>
                         <div>
                            <h3 className="text-white font-bold">{t('providerGithub')}</h3>
                            <p className="text-sm text-slate-400">
                               {providers.includes('github') ? t('connected') : t('notConnected')}
                            </p>
                         </div>
                      </div>
                      <div className="w-full sm:w-auto">
                        {providers.includes('github') ? (
                           <button onClick={() => handleUnlinkProvider('github')} disabled={loading} className="w-full sm:w-auto px-4 py-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2">
                              {loading ? <Loader2 size={16} className="animate-spin" /> : <Unlink size={16} />} {t('btnDisconnect')}
                           </button>
                        ) : (
                           <button onClick={() => handleLinkProvider('github')} disabled={loading} className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-white text-slate-900 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg">
                              {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} {t('btnConnect')}
                           </button>
                        )}
                      </div>
                   </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}