'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();

  // Wyciągamy obecny język z adresu URL (zakładając strukturę /pl/cos-tam)
  const currentLocale = pathname?.split('/')[1] || 'en';

  const switchLanguage = (newLocale: string) => {
    if (!pathname) return;
    
    // Zastępujemy stary język w URL nowym (np. z /pl/dashboard na /en/dashboard)
    const segments = pathname.split('/');
    segments[1] = newLocale;
    const newPath = segments.join('/');
    
    router.push(newPath);
    router.refresh(); // Wymusza odświeżenie danych na serwerze pod nowy język
  };

  return (
    <div className="flex items-center bg-white/5 border border-white/10 rounded-full p-1 shadow-inner">
      <div className="flex items-center gap-1 text-xs font-bold px-2 text-slate-400">
        <Globe size={14} className={currentLocale === 'en' ? 'text-blue-400' : 'text-slate-500'} />
      </div>
      
      <button
        onClick={() => switchLanguage('pl')}
        className={`px-2 py-1 rounded-full transition-all ${
          currentLocale === 'pl' 
            ? 'bg-blue-600/80 text-white shadow-md' 
            : 'text-slate-400 hover:text-white hover:bg-white/5'
        }`}
      >
        PL
      </button>
      
      <button
        onClick={() => switchLanguage('en')}
        className={`px-2 py-1 rounded-full transition-all ${
          currentLocale === 'en' 
            ? 'bg-blue-600/80 text-white shadow-md' 
            : 'text-slate-400 hover:text-white hover:bg-white/5'
        }`}
      >
        EN
      </button>
    </div>
  );
}