import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";

// 1. GET: Pobiera wszystkie usługi do Galerii
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const services = await prisma.service.findMany({
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(services);
  } catch (error) {
    return NextResponse.json({ error: "Db Error" }, { status: 500 });
  }
}

// 2. POST: Inteligentny Zapis (Upsert)
// To wykonuje się, gdy w Modalu Discovery klikniesz "Zapisz do Bazy"
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    
    // Upewniamy się, że pracujemy na tablicy (nawet jak przyjdzie pojedynczy obiekt)
    const servicesToProcess = Array.isArray(body) ? body : [body];
    let processedCount = 0;

    // Przechodzimy przez każdy wykryty serwis po kolei
    for (const s of servicesToProcess) {
      // Parsowanie portu (zabezpieczenie przed stringiem)
      const portInt = parseInt(s.port);

      // --- LOGIKA DETEKCJI DUPLIKATÓW ---
      
      let existingService = null;

      // KROK A: Szukamy po Container ID (najdokładniejsze)
      if (s.containerId) {
        existingService = await prisma.service.findFirst({
          where: { containerId: s.containerId }
        });
      }

      // KROK B: Jeśli nie znaleziono po ID, szukamy po Nazwie (fallback)
      // To zapobiega dodaniu drugiego "AdGuard Home", jeśli np. Docker ID się zmienił (reinstalacja)
      if (!existingService) {
        existingService = await prisma.service.findFirst({
          where: { name: s.name }
        });
      }

      // --- PRZYGOTOWANIE DANYCH ---
      const serviceData = {
        name: s.name,
        type: s.widgetType || 'generic',
        protocol: s.protocol || 'http',
        ip: s.ip,
        port: portInt,
        containerId: s.containerId || null, // Zapisujemy nowe ID, jeśli jest dostępne
        // Nie nadpisujemy ikony, jeśli użytkownik ją zmienił (chyba że nowa to nie 'Box')
        icon: s.icon || 'Box', 
      };

      if (existingService) {
        // --- SCENARIUSZ 1: AKTUALIZACJA (UPDATE) ---
        // Serwis już istnieje. Aktualizujemy tylko dane techniczne (IP, Port, Protokół).
        // NIE ruszamy 'authType', 'apiKey' ani 'publicUrl', żeby nie skasować konfiguracji użytkownika!
        await prisma.service.update({
          where: { id: existingService.id },
          data: {
            // Aktualizujemy tylko to, co mogło się zmienić w Dockerze
            protocol: serviceData.protocol,
            ip: serviceData.ip,
            port: serviceData.port,
            containerId: serviceData.containerId, // Aktualizujemy ID jeśli się zmieniło
            // Opcjonalnie: zaktualizuj ikonę, jeśli w bazie jest domyślna 'Box', a my mamy lepszą
            ...(existingService.icon === 'Box' && serviceData.icon !== 'Box' ? { icon: serviceData.icon } : {}),
          }
        });
      } else {
        // --- SCENARIUSZ 2: TWORZENIE (CREATE) ---
        // Serwis nie istnieje. Tworzymy go od zera.
        await prisma.service.create({
          data: {
            ...serviceData,
            authType: 'none', // Domyślnie brak autoryzacji
            publicUrl: '',    // Domyślnie brak publicznego URL
          }
        });
      }
      processedCount++;
    }

    return NextResponse.json({ success: true, count: processedCount });

  } catch (error: any) {
    console.error("Błąd zapisu inventory:", error);
    // Zwracamy szczegóły błędu, żebyś widział w konsoli co poszło nie tak
    return NextResponse.json({ error: "Save Error", details: error.message }, { status: 500 });
  }
}

// 3. PUT: Ręczna edycja (z Galerii - Ołówek)
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { id, ...data } = body;

    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    const updated = await prisma.service.update({
      where: { id },
      data: {
        protocol: data.protocol,
        ip: data.ip,
        port: parseInt(data.port),
        publicUrl: data.publicUrl,
        authType: data.authType,
        apiKey: data.apiKey,
        username: data.username,
        password: data.password,
      }
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Błąd edycji:", error);
    return NextResponse.json({ error: "Update Error" }, { status: 500 });
  }
}

// 4. DELETE: Usuwanie usługi z bazy
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    await prisma.service.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Błąd usuwania:", error);
    return NextResponse.json({ error: "Delete Error" }, { status: 500 });
  }
}