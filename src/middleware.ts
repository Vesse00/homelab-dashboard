import { withAuth } from 'next-auth/middleware';
import createIntlMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';

const locales = ['en', 'pl'];

// 1. TUTAJ przenosimy Twoje publiczne strony, które w starym pliku miałeś w matcherze.
// Dzięki temu dodadzą się do nich języki (np. /pl/login), ale nie będą wołać o hasło.
const publicPages = [
  '/login', 
  '/register', 
  '/forgot-password', 
  '/auth/reset' // Obejmie też /auth/reset/cokolwiek dzięki regexowi niżej
];

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale: 'en',
  localePrefix: 'always'
});

const authMiddleware = withAuth(
  function onSuccess(req) {
    return intlMiddleware(req);
  },
  {
    callbacks: {
      authorized: ({ token }) => token != null
    },
    pages: {
      signIn: '/login'
    }
  }
);

export default function middleware(req: NextRequest) {
  // Regex łapiący Twoje strony publiczne (nawet z dynamicznymi końcówkami)
  const publicPathnameRegex = RegExp(
    `^(/(${locales.join('|')}))?(${publicPages
      .flatMap((p) => (p === '/' ? ['', '/'] : p))
      .join('|')})(/.*)?$`,
    'i'
  );
  
  const isPublicPage = publicPathnameRegex.test(req.nextUrl.pathname);

  if (isPublicPage) {
    // Jeśli to strona publiczna (login, register), zajmij się TYLKO językami
    return intlMiddleware(req);
  } else {
    // Jeśli to prywatna (np. strona główna dashboardu), sprawdzaj NextAuth, a potem dodaj języki
    return (authMiddleware as any)(req);
  }
}

export const config = {
  /*
   * NOWY MATCHER:
   * Wyklucza cały folder /api (więc omija api/cron, api/register, api/auth itd.)
   * Wyklucza folder /_next (pliki statyczne, obrazki js/css)
   * Wyklucza wszystkie pliki z kropką .*\\..* (czyli okładki, .svg, favicon.ico)
   * * Ale ŁAPIE /login i /register po to, by przekazać je do logiki powyżej!
   */
  matcher: ['/((?!api|_next|.*\\..*).*)']
};