import { useEffect, useRef } from 'react';

export function useSmartInterval(
  callback: () => void | Promise<void>,
  activeDelay: number,
  inactiveDelay: number = 60000 // Domyślnie 60 sekund, gdy karta jest w tle
) {
  const savedCallback = useRef(callback);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Zapamiętujemy najnowszą wersję callbacku (np. gdy zmienią się propsy widgetu)
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    let isCancelled = false;

    const tick = async () => {
      if (isCancelled) return;
      
      try {
        await savedCallback.current();
      } catch (error) {
        console.error('[SmartInterval] Błąd pobierania:', error);
      }
      
      if (isCancelled) return;
      
      // Sprawdzamy czy karta jest widoczna w przeglądarce
      const isVisible = !document.hidden;
      // Ustawiamy kolejny czas w zależności od widoczności
      const nextDelay = isVisible ? activeDelay : inactiveDelay;
      
      timeoutRef.current = setTimeout(tick, nextDelay);
    };

    // Uruchamiamy pierwszą pętlę
    tick();

    // Nasłuchujemy zmiany zakładki przeglądarki
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Użytkownik wrócił na stronę!
        // Anulujemy powolny timer (np. 60s) i natychmiast pobieramy świeże dane
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        tick();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Czyszczenie przy odmontowaniu widgetu (np. przy usunięciu z pulpitu)
    return () => {
      isCancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeDelay, inactiveDelay]);
}