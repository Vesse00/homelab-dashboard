import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  
  // Zabezpieczenie: Pobieramy niezmienne ID użytkownika z sesji
  const userId = (session?.user as any)?.id;
  const currentSessionEmail = session?.user?.email;

  if (!userId || !currentSessionEmail) {
    return NextResponse.json({ error: 'Nieautoryzowany dostęp' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action } = body;

    // --- AKCJA 1: Zmiana danych profilu (Nazwa, Email) ---
    if (action === 'updateProfile') {
      const { name, email } = body;
      
      // Sprawdzamy, czy ktoś inny nie używa już tego maila
      if (email !== currentSessionEmail) {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
          return NextResponse.json({ error: 'Ten e-mail jest już zajęty.' }, { status: 400 });
        }
      }

      // KULOOODPORNA POPRAWKA: Szukamy i aktualizujemy po ID
      await prisma.user.update({
        where: { id: userId },
        data: { name, email },
      });

      return NextResponse.json({ message: 'Profil zaktualizowany pomyślnie!' });
    }

    // --- AKCJA 2: Zmiana Hasła ---
    if (action === 'changePassword') {
      const { currentPassword, newPassword } = body;
      
      // KULOOODPORNA POPRAWKA: Szukamy po ID
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || !user.password) {
        return NextResponse.json({ error: 'Konto nie istnieje.' }, { status: 400 });
      }

      // Weryfikacja starego hasła
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return NextResponse.json({ error: 'Obecne hasło jest nieprawidłowe.' }, { status: 400 });
      }

      // Szyfrowanie i zapis nowego hasła
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
      });

      return NextResponse.json({ message: 'Hasło zostało zmienione!' });
    }

    return NextResponse.json({ error: 'Nieznana akcja' }, { status: 400 });

  } catch (error) {
    console.error("Błąd ustawień:", error);
    return NextResponse.json({ error: 'Wystąpił błąd serwera' }, { status: 500 });
  }
}