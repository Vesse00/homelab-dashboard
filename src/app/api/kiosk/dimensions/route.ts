import { NextResponse } from 'next/server';
import {prisma} from '@/app/lib/prisma';

export async function POST(req: Request) {
  try {
    // 1. Weryfikacja tokenu kiosku
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Brak uprawnień' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    // 2. Pobieramy wymiary z body
    const { width, height } = await req.json();

    if (!width || !height) {
      return NextResponse.json({ error: 'Brak wymiarów' }, { status: 400 });
    }

    // 3. Szukamy Kiosku i powiązanego Użytkownika
    const kiosk = await prisma.kiosk.findUnique({
      where: { deviceToken: token },
      include: { user: true }
    });

    if (!kiosk || !kiosk.user || !kiosk.tabId) {
      return NextResponse.json({ error: 'Kiosk nie przypisany' }, { status: 404 });
    }

    // 4. Aktualizujemy konkretną zakładkę (tab) w dashboardLayout użytkownika!
    const layout = JSON.parse(kiosk.user.dashboardLayout || '[]');
    let updated = false;
    
    const newLayout = layout.map((tab: any) => {
      if (tab.id === kiosk.tabId) {
        // Jeśli wymiary faktycznie się zmieniły (żeby nie zapisywać w kółko tego samego)
        if (tab.kioskWidth !== width || tab.kioskHeight !== height) {
          updated = true;
          return { ...tab, kioskWidth: width, kioskHeight: height };
        }
      }
      return tab;
    });

    // 5. Zapisujemy zaktualizowany układ do bazy, jeśli była zmiana
    if (updated) {
      await prisma.user.update({
        where: { id: kiosk.user.id },
        data: { dashboardLayout: JSON.stringify(newLayout) }
      });
    }

    return NextResponse.json({ success: true, updated });
  } catch (error) {
    console.error("Błąd zapisu wymiarów kiosku:", error);
    return NextResponse.json({ error: 'Wewnętrzny błąd serwera' }, { status: 500 });
  }
}