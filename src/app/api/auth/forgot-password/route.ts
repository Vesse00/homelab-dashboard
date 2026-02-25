import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { getTranslations } from 'next-intl/server';

export async function POST(req: Request) {
  try {
    const { email, locale = 'en' } = await req.json();

    const t = await getTranslations({ locale, namespace: 'Email.ForgotPassword' });

    // 1. Sprawdzamy, czy użytkownik z takim mailem istnieje
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Ze względów bezpieczeństwa zawsze zwracamy sukces,
      // aby hakerzy nie mogli sprawdzić, jakie maile są w naszej bazie.
      return NextResponse.json({ status: 'SUCCESS' });
    }

    // 2. Generujemy unikalny, bezpieczny token (64 znaki) i datę wygaśnięcia (1 godzina)
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600 * 1000); // 1h w przód

    // 3. Zapisujemy token w bazie (usuwamy najpierw stare tokeny tego usera)
    await prisma.passwordResetToken.deleteMany({ where: { email } });
    await prisma.passwordResetToken.create({
      data: { email, token, expires }
    });

    // 4. Konfiguracja Nodemailera pod Gmaila
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // 5. Budujemy link resetujący i wysyłamy e-mail
    const resetUrl = `${process.env.NEXTAUTH_URL}/${locale}/reset?token=${token}`;
    
    await transporter.sendMail({
      from: `"Command Center" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: t('subject'),

      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f172a; color: #f8fafc; border-radius: 12px; border: 1px solid #1e293b;">
          <h2 style="color: #60a5fa; margin-top: 0;">${t('title')}</h2>
          <p style="color: #cbd5e1; line-height: 1.6;">${t('line1')}</p>
          <p style="color: #cbd5e1; line-height: 1.6;">${t('line2')}</p>
          <div style="text-align: center; margin: 35px 0;">
            <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">${t('button')}</a>
          </div>
          <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">${t('footer')}</p>
        </div>
      `,
    });

    return NextResponse.json({ status: 'SUCCESS' });

  } catch (error) {
    console.error('Błąd resetowania hasła:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}