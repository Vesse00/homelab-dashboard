import { NextResponse } from 'next/server';
import Docker from 'dockerode';
import { prisma } from '@/app/lib/prisma'; // Upewnij się, że ten import działa

// Wyłączamy cache Next.js dla crona
export const dynamic = 'force-dynamic';

export async function GET() {
  const docker = new Docker({ socketPath: '/var/run/docker.sock' });

  try {
    // 1. Pobieramy kontenery
    const containers = await docker.listContainers({ all: true });

    // 2. Przygotowujemy dane
    const statsToSave = containers.map((container) => ({
      containerId: container.Id,
      name: container.Names[0].replace('/', ''),
      state: container.State,
      status: container.Status,
      // cpu/memory dodamy w przyszłości
    }));

    // 3. ZAPISUJEMY (Poprawka dla SQLite: używamy $transaction zamiast createMany)
    // To tworzy wiele zapytań "INSERT", ale wykonuje je w jednej bezpiecznej transakcji.
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
    // Zwracamy pełny błąd, żeby wiedzieć co się dzieje
    return NextResponse.json(
      { success: false, error: error.message || error.toString() }, 
      { status: 500 }
    );
  }
}