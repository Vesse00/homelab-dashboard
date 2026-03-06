import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import bcrypt from 'bcryptjs';

// --- POBIERANIE POWIĄZANYCH KONT ---
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Nieautoryzowany dostęp' }, { status: 401 });
  }

  try {
    const accounts = await prisma.account.findMany({
      where: { userId },
      select: { provider: true }
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true }
    });

    return NextResponse.json({ 
      providers: accounts.map(acc => acc.provider),
      hasPassword: !!user?.password
    });
  } catch (error) {
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}

// --- AKCJE USTAWIEŃ ---
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  const currentSessionEmail = session?.user?.email;

  if (!userId || !currentSessionEmail) {
    return NextResponse.json({ error: 'Nieautoryzowany dostęp' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action } = body;

    // 1. Zmiana profilu
    if (action === 'updateProfile') {
      const { name, email } = body;
      if (email !== currentSessionEmail) {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) return NextResponse.json({ error: 'Ten e-mail jest już zajęty.' }, { status: 400 });
      }

      await prisma.user.update({
        where: { id: userId },
        data: { name, email },
      });
      return NextResponse.json({ message: 'Profil zaktualizowany pomyślnie!' });
    }

    // 2. Zmiana lub Ustawienie Hasła
    if (action === 'changePassword') {
      const { currentPassword, newPassword } = body;
      
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return NextResponse.json({ error: 'Konto nie istnieje.' }, { status: 400 });

      // Jeśli użytkownik MA już hasło, musi podać stare.
      if (user.password) {
        if (!currentPassword) return NextResponse.json({ error: 'Musisz podać obecne hasło.' }, { status: 400 });
        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) return NextResponse.json({ error: 'Obecne hasło jest nieprawidłowe.' }, { status: 400 });
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
      });

      return NextResponse.json({ message: user.password ? 'Hasło zostało zmienione!' : 'Hasło zostało ustawione pomyślnie!' });
    }

    // 3. Odłączanie Dostawcy (GitHub)
    if (action === 'unlinkProvider') {
      const { provider } = body;
      
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const accounts = await prisma.account.findMany({ where: { userId } });
      
      // Zabezpieczenie przed zablokowaniem konta:
      if (!user?.password && accounts.length <= 1) {
         return NextResponse.json({ error: 'Zanim odłączysz GitHuba, musisz ustawić hasło do konta w zakładce Bezpieczeństwo.' }, { status: 400 });
      }

      await prisma.account.deleteMany({
        where: { userId, provider }
      });
      return NextResponse.json({ message: 'Konto zostało pomyślnie odłączone.' });
    }

    return NextResponse.json({ error: 'Nieznana akcja' }, { status: 400 });

  } catch (error) {
    return NextResponse.json({ error: 'Wystąpił błąd serwera' }, { status: 500 });
  }
}