import { NextResponse } from 'next/server';
import Docker from 'dockerode';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // 1. ZABEZPIECZENIE: Sprawdzamy klucz API
  // Możesz go podać w URL (?key=sekret) lub w nagłówku (Authorization: Bearer sekret)
  const { searchParams } = new URL(request.url);
  const apiKey = searchParams.get('key');
  
  // Ustaw ten sam klucz w pliku .env (np. CRON_SECRET="moje_super_tajne_haslo")
  const CRON_SECRET = process.env.CRON_SECRET || "zmien_mnie_w_produkcji";

  if (apiKey !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // --- Reszta Twojego kodu bez zmian ---
  const docker = new Docker({ socketPath: '/var/run/docker.sock' });

  try {
    const containers = await docker.listContainers({ all: true });

    const statsToSave = containers.map((container) => ({
      containerId: container.Id,
      name: container.Names[0].replace('/', ''),
      state: container.State,
      status: container.Status,
      // cpu/memory w przyszłości
    }));

    await prisma.$transaction(
      statsToSave.map((stat) => 
        prisma.containerStat.create({
          data: stat
        })
      )
    );

    return NextResponse.json({ 
      success: true, 
      count: statsToSave.length,
      message: "Dane zapisane pomyślnie!" 
    });

  } catch (error: any) {
    console.error("Błąd Crona:", error);
    return NextResponse.json(
      { success: false, error: error.message || error.toString() }, 
      { status: 500 }
    );
  }
}