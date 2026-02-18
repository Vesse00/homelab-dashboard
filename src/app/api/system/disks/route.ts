import { NextResponse } from 'next/server';
import nodeDiskInfo from 'node-disk-info';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const disks = await nodeDiskInfo.getDiskInfo();

    // 1. FILTROWANIE "ŚMIECI"
    // Ukrywamy wszystko co wygląda na systemowe, dockerowe, tymczasowe
    const physicalDisks = disks.filter(disk => {
      const fs = disk.filesystem.toLowerCase();
      const mp = disk.mounted.toLowerCase();
      
      return (
        !fs.includes('loop') &&       // Pętle zwrotne (snap)
        !fs.includes('tmpfs') &&      // RAM dyski
        !fs.includes('overlay') &&    // Docker overlay
        !fs.includes('shm') &&        // Shared memory
        !mp.startsWith('/boot') &&    // Partycja rozruchowa
        !mp.startsWith('/snap') &&    // Paczki Snap
        !mp.startsWith('/run') &&     // Systemowe
        !mp.startsWith('/sys') &&     // Systemowe
        !mp.startsWith('/proc') &&    // Systemowe
        !mp.includes('/docker') &&    // Wewnętrzne montaże Dockera
        !mp.includes('/kubelet')      // Jeśli używasz K8s
      );
    });

    // 2. FORMATOWANIE (TB / GB)
    // node-disk-info zwraca 'blocks' w jednostkach 1KB (1024 bajty)
    const formattedDisks = physicalDisks.map(disk => {
      
      // Funkcja pomocnicza do ładnego formatowania
      const formatSize = (blocks: number) => {
        const gb = blocks / 1024 / 1024; // Z kilobajtów na GB
        if (gb >= 1000) {
          return `${(gb / 1024).toFixed(2)} TB`;
        }
        return `${gb.toFixed(1)} GB`;
      };

      // Obliczanie zajętości w GB do paska postępu
      const totalGb = disk.blocks / 1024 / 1024;
      const usedGb = disk.used / 1024 / 1024;

      return {
        filesystem: disk.filesystem,
        mounted: disk.mounted,
        // Wyświetlamy ładny string (np. "1.81 TB")
        totalStr: formatSize(disk.blocks),
        usedStr: formatSize(disk.used),
        // Zachowujemy surowe wartości do logiki paska (opcjonalnie)
        capacity: disk.capacity, // np. "45%"
        usagePercent: (usedGb / totalGb) * 100
      };
    });

    return NextResponse.json(formattedDisks);
  } catch (error: any) {
    console.error("Disk Info Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}