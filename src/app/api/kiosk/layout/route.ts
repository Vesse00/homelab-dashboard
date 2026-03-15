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
    // Szukamy Kiosku i od razu zaciągamy powiązanego Użytkownika!
    const kiosk = await prisma.kiosk.findUnique({
      where: { deviceToken: token },
      include: { user: true } // Pobieramy dane właściciela (Ciebie)
    });

    if (!kiosk || !kiosk.user || !kiosk.user.dashboardLayout || !kiosk.tabId) {
      return NextResponse.json({ error: 'Nie znaleziono kiosku lub układ jest pusty' }, { status: 404 });
    }

    // Wyciągamy na żywo układ z głównego konta użytkownika!
    const userTabs = JSON.parse(kiosk.user.dashboardLayout);
    const kioskTab = userTabs.find((t: any) => t.id === kiosk.tabId);

    if (!kioskTab) {
      return NextResponse.json({ error: 'Zakładka przypisana do tego Kiosku została usunięta.' }, { status: 404 });
    }

    return NextResponse.json({
      name: kioskTab.name,
      layout: kioskTab.widgets // Zwracamy widgety NA ŻYWO z Twojego konta PC!
    });
  } catch (error) {
    console.error("Błąd API Kiosku:", error);
    return NextResponse.json({ error: 'Wewnętrzny błąd serwera' }, { status: 500 });
  }
}