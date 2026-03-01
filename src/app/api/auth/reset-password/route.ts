import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import bcrypt from 'bcryptjs';
import { getTranslations } from 'next-intl/server';

export async function POST(req: Request) {
  try {
    const { token, newPassword, locale = 'en' } = await req.json();
    const t = await getTranslations({ locale, namespace: 'ApiErrors' });


    if (!token || !newPassword) {
      return NextResponse.json({ error: t('MISSING_TOKEN') }, { status: 400 });
    }

    // 1. Szukamy tokenu w bazie
    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetRecord) {
      return NextResponse.json({ error: t('BAD_LINK') }, { status: 400 });
    }

    // 2. Sprawdzamy czy nie wygasł
    if (resetRecord.expires < new Date()) {
      await prisma.passwordResetToken.delete({ where: { token } });
      return NextResponse.json({ error: t('OLD_LINK') }, { status: 400 });
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

    return NextResponse.json({ message: t('PASSWORD_RESET_SUCCESS') });

  } catch (error) {
    console.error('Błąd zmiany hasła:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}