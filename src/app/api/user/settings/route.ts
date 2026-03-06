import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';
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
      select: { password: true, twoFactorEnabled: true }
    });

    return NextResponse.json({ 
      providers: accounts.map(acc => acc.provider),
      hasPassword: !!user?.password,
      is2FAEnabled: user?.twoFactorEnabled || false
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

    // --- AKCJE 2FA ---
    
    // 4. Generowanie kodu QR dla 2FA
    if (action === 'generate2fa') {
      const totp = new OTPAuth.TOTP({
        issuer: 'Homelab Dashboard',
        label: currentSessionEmail,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: new OTPAuth.Secret({ size: 20 }) // Generuje losowy klucz
      });

      const secret = totp.secret.base32;
      const otpauthUrl = totp.toString();
      const qrCode = await QRCode.toDataURL(otpauthUrl);
      
      return NextResponse.json({ secret, qrCode });
    }

    // 5. Potwierdzenie i włączenie 2FA
    if (action === 'enable2fa') {
      const { secret, token } = body;
      
      const totp = new OTPAuth.TOTP({
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(secret)
      });

      // Weryfikujemy kod. 'window: 1' pozwala na minimalne opóźnienie czasu między serwerem a telefonem
      const delta = totp.validate({ token, window: 1 });
      
      if (delta === null) {
        return NextResponse.json({ error: 'Nieprawidłowy kod weryfikacyjny TOTP.' }, { status: 400 });
      }

      await prisma.user.update({
        where: { id: userId },
        data: { twoFactorSecret: secret, twoFactorEnabled: true }
      });
      return NextResponse.json({ message: 'Weryfikacja dwuetapowa została pomyślnie włączona!' });
    }

    // 6. Wyłączanie 2FA
    if (action === 'disable2fa') {
      await prisma.user.update({
        where: { id: userId },
        data: { twoFactorSecret: null, twoFactorEnabled: false }
      });
      return NextResponse.json({ message: 'Weryfikacja dwuetapowa została wyłączona.' });
    }

    return NextResponse.json({ error: 'Nieznana akcja' }, { status: 400 });

  } catch (error) {
    return NextResponse.json({ error: 'Wystąpił błąd serwera' }, { status: 500 });
  }
}