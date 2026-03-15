import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import {prisma}  from '@/app/lib/prisma';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pairingCode, tabId } = await req.json();

    if (!pairingCode || !tabId) {
      return NextResponse.json({ error: 'Missing pairing code or tabId' }, { status: 400 });
    }

    // 1. Znajdź Kiosk czekający na sparowanie
    const kiosk = await prisma.kiosk.findUnique({
      where: { pairingCode }
    });

    if (!kiosk) {
      return NextResponse.json({ error: 'Nieprawidłowy lub przeterminowany kod.' }, { status: 404 });
    }

    // 2. Znajdź użytkownika, aby pobrać jego układ widgetów
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user || !user.dashboardLayout) {
       return NextResponse.json({ error: 'User layout not found' }, { status: 404 });
    }

    // 3. Wyciągnij konkretną zakładkę (layout)
    const tabs = JSON.parse(user.dashboardLayout);
    const selectedTab = tabs.find((t: any) => t.id === tabId);

    if (!selectedTab) {
       return NextResponse.json({ error: 'Tab not found' }, { status: 404 });
    }

    // 4. Wygeneruj potężny, bezpieczny token dostępu (zamiast standardowego hasła)
    const deviceToken = crypto.randomBytes(32).toString('hex');

    // 5. Zaktualizuj i przypisz Kiosk do użytkownika!
    await prisma.kiosk.update({
      where: { id: kiosk.id },
      data: {
        userId: user.id,
        tabId: tabId,
        layout: JSON.stringify(selectedTab.widgets), // Odcinamy pępowinę - Kiosk ma własną kopię widgetów!
        deviceToken: deviceToken,
        pairingCode: null, // Usuwamy kod, żeby nie dało się go użyć ponownie
        name: selectedTab.name // Domyślnie nazywamy tablet tak jak zakładkę
      }
    });

    return NextResponse.json({ success: true, message: 'Urządzenie połączone pomyślnie!' });

  } catch (error) {
    console.error('Pairing Error:', error);
    return NextResponse.json({ error: 'Wewnętrzny błąd serwera' }, { status: 500 });
  }
}