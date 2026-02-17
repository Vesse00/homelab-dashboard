import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login", // Tutaj przekierujemy niezalogowanych
  },
});

export const config = {
  /*
   * MATCHER: Określa, które ścieżki mają być chronione.
   * Używamy wyrażenia regularnego, aby chronić WSZYSTKO, 
   * z wyjątkiem stron publicznych (logowanie, rejestracja, pliki statyczne).
   */
  matcher: [
    /*
     * Dopasuj wszystkie ścieżki requestów z wyjątkiem tych zaczynających się od:
     * - login (strona logowania)
     * - register (strona rejestracji)
     * - api/register (endpoint do tworzenia konta)
     * - api/auth (wewnętrzne mechanizmy logowania)
     * - _next/static (pliki statyczne js/css)
     * - _next/image (optymalizacja obrazów)
     * - favicon.ico (ikona)
     * - public files (pliki z kropką, np. window.svg)
     */
    "/((?!login|register|api/register|api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};