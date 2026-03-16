import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Odbieramy kod, opcjonalną nazwę i opcjonalny tabId
    const { pairingCode, name, tabId } = await req.json();

    if (!pairingCode) {
      return NextResponse.json({ error: 'Brak kodu parowania' }, { status: 400 });
    }

    const kiosk = await prisma.kiosk.findUnique({ where: { pairingCode } });
    if (!kiosk) {
      return NextResponse.json({ error: 'Nieprawidłowy lub przeterminowany kod.' }, { status: 404 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Jeśli podano tabId, szukamy układu. Jeśli nie - zostawiamy null
    let layoutData = null;
    if (tabId && user.dashboardLayout) {
      const tabs = JSON.parse(user.dashboardLayout);
      const selectedTab = tabs.find((t: any) => t.id === tabId);
      if (selectedTab) {
        layoutData = JSON.stringify(selectedTab.widgets);
      }
    }

    const deviceToken = crypto.randomBytes(32).toString('hex');

    await prisma.kiosk.update({
      where: { id: kiosk.id },
      data: {
        userId: user.id,
        name: name || 'Nowy Ekran Ścienny', // Nadajemy własną nazwę
        tabId: tabId || null,               // Może być puste!
        layout: layoutData,                 // Może być puste!
        deviceToken: deviceToken,
        pairingCode: null,
      }
    });

    return NextResponse.json({ success: true, message: 'Urządzenie połączone pomyślnie!' });

  } catch (error) {
    console.error('Pairing Error:', error);
    return NextResponse.json({ error: 'Wewnętrzny błąd serwera' }, { status: 500 });
  }
}