'use client';

import { SessionProvider } from "next-auth/react";
import { Toaster } from 'react-hot-toast';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster 
        position="bottom-right" 
        toastOptions={{
          style: {
            background: '#0f172a', // slate-950
            color: '#e2e8f0',      // slate-200
            border: '1px solid #1e293b', // slate-800
          },
          success: {
            iconTheme: {
              primary: '#10b981', // emerald-500
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444', // red-500
              secondary: '#fff',
            },
          },
        }}
      />
    </SessionProvider>
  );
}