import { NextResponse } from 'next/server';
import {prisma} from '@/app/lib/prisma';

// Wyłączamy cache dla pewności
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Brak uprawnień' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];

  try {
    const kiosk = await prisma.kiosk.findUnique({
      where: { deviceToken: token },
      include: { user: true }
    });

    // Jeśli Kiosk lub User totalnie nie istnieje - wtedy faktycznie jest błąd
    if (!kiosk || !kiosk.user) {
      return NextResponse.json({ error: 'Nie znaleziono kiosku' }, { status: 404 });
    }

    // JEŚLI KIOSK JEST SPAROWANY, ALE NIE MA PRZYPISANEGO PULPITU
    if (!kiosk.tabId) {
      return NextResponse.json({ 
        isWaiting: true,      // Zgłaszamy, że kiosk jest w trybie "Czekania"
        name: kiosk.name 
      });
    }

    // Wyciągamy układ, jeśli wszystko jest przypisane
    const userTabs = JSON.parse(kiosk.user.dashboardLayout || '[]');
    const kioskTab = userTabs.find((t: any) => t.id === kiosk.tabId);

    if (!kioskTab) {
      return NextResponse.json({ error: 'Zakładka przypisana do tego Kiosku została usunięta.' }, { status: 404 });
    }

    return NextResponse.json({
      isWaiting: false,
      allTabs: userTabs,
      tabId: kiosk.tabId,
      name: kiosk.name
    });
  } catch (error) {
    console.error("Błąd API Kiosku:", error);
    return NextResponse.json({ error: 'Wewnętrzny błąd serwera' }, { status: 500 });
  }
}