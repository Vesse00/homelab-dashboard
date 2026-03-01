import "@/app/globals.css";
import Navbar from "@/app/[locale]/components/Navbar";
import Providers from "@/app/[locale]/components/Providers";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await  params;
  const messages = await getMessages();

  return (
    <html lang={locale} className="h-full">
      <body className="bg-slate-950 text-slate-200 antialiased min-h-screen relative selection:bg-blue-500/30">

        {/* === NOWE TŁO (Cyberpunk/Homelab Vibe) === */}
        {/* Elementy fixed z ujemnym Z-index, żeby były zawsze pod spodem */}
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
          {/* Subtelna siatka na górze */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

          {/* Górna, niebieska poświata (blur) */}
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-700/10 blur-[120px] opacity-40" />

          {/* Dolna, fioletowa poświata (blur) */}
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-700/10 blur-[120px] opacity-30" />

          {/* Ogólny gradient tła */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/80 to-slate-950" />
        </div>

        <NextIntlClientProvider messages={messages}>
          <Providers>
            {/* Navbar jest fixed */}
            <Navbar />

            <main className="pt-16 relative z-10">
              <div className="w-full h-full">
                {children}
              </div>
            </main>
          </Providers>
        </NextIntlClientProvider>
        
      </body>
    </html>
  );
}