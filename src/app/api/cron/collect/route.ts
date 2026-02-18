import { NextResponse } from 'next/server';
import Docker from 'dockerode';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const docker = new Docker({ socketPath: '/var/run/docker.sock' });

  try {
    const containers = await docker.listContainers({ all: true });

    // Równolegle pobieramy szczegółowe statystyki dla każdego kontenera
    const statsPromises = containers.map(async (containerInfo) => {
      const container = docker.getContainer(containerInfo.Id);
      
      // Pobieramy statystyki (stream: false = jednorazowy odczyt)
      let stats: any = {};
      try {
        stats = await container.stats({ stream: false });
      } catch (e) {
        console.log(`Nie można pobrać statystyk dla ${containerInfo.Names[0]}`);
        return null; // Kontener wyłączony
      }

      // --- OBLICZANIE CPU ---
      let cpuPercent = 0.0;
      const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
      const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
      const cpuCount = stats.cpu_stats.online_cpus || 1;

      if (systemDelta > 0 && cpuDelta > 0) {
        cpuPercent = (cpuDelta / systemDelta) * cpuCount * 100.0;
      }

      // --- OBLICZANIE RAM ---
      // Użycie pamięci w MB
      const memoryUsage = stats.memory_stats.usage || 0;
      const memoryMb = memoryUsage / 1024 / 1024;

      return {
        containerId: containerInfo.Id,
        name: containerInfo.Names[0].replace('/', ''),
        state: containerInfo.State,
        status: containerInfo.Status,
        cpu: parseFloat(cpuPercent.toFixed(2)),
        memory: parseFloat(memoryMb.toFixed(2)),
      };
    });

    // Czekamy na wszystkie obliczenia
    const results = await Promise.all(statsPromises);
    const validStats = results.filter((s): s is NonNullable<typeof s> => s !== null);

    // Zapisujemy w transakcji
    await prisma.$transaction(
      validStats.map((stat) => 
        prisma.containerStat.create({ data: stat })
      )
    );

    return NextResponse.json({ 
      success: true, 
      count: validStats.length,
      message: "Zapisano użycie CPU i RAM!" 
    });

  } catch (error: any) {
    console.error("Błąd Crona:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}