import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return NextResponse.json({ error: 'Brak tokenu lub hasła.' }, { status: 400 });
    }

    // 1. Szukamy tokenu w bazie
    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetRecord) {
      return NextResponse.json({ error: 'Nieprawidłowy link resetujący.' }, { status: 400 });
    }

    // 2. Sprawdzamy czy nie wygasł
    if (resetRecord.expires < new Date()) {
      await prisma.passwordResetToken.delete({ where: { token } });
      return NextResponse.json({ error: 'Link resetujący wygasł. Poproś o nowy.' }, { status: 400 });
    }

    // 3. Haszujemy nowe hasło
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 4. Aktualizujemy użytkownika i usuwamy użyty token
    await prisma.$transaction([
      prisma.user.update({
        where: { email: resetRecord.email },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.delete({
        where: { token },
      }),
    ]);

    return NextResponse.json({ message: 'Hasło zostało pomyślnie zmienione.' });

  } catch (error) {
    console.error('Błąd zmiany hasła:', error);
    return NextResponse.json({ error: 'Wystąpił błąd serwera.' }, { status: 500 });
  }
}