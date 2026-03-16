'use client';

/**
 * Uniwersalny wrapper na fetch(), który automatycznie dodaje
 * token Kiosku (jeśli istnieje) do nagłówków autoryzacyjnych.
 */
export function useKioskFetch() {
  const kioskFetch = async (url: string, options: RequestInit = {}) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('kiosk_device_token') : null;
    
    // Kopiujemy istniejące nagłówki z opcji (jeśli jakieś są)
    const headers = new Headers(options.headers || {});
    
    // Jeśli mamy token Kiosku, dorzucamy go do nagłówków
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    // Wykonujemy zapytanie z nowymi nagłówkami
    return fetch(url, {
      ...options,
      headers
    });
  };

  return kioskFetch;
}