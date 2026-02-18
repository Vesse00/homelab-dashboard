import { NextResponse } from 'next/server';
import nodeDiskInfo from 'node-disk-info';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const disks = await nodeDiskInfo.getDiskInfo();

    // Filtrujemy wirtualne systemy plików, zostawiamy tylko fizyczne dyski (zazwyczaj)
    const physicalDisks = disks.filter(disk => {
      const fs = disk.filesystem.toLowerCase();
      const mp = disk.mounted.toLowerCase();
      
      return !fs.includes('loop') && 
             !fs.includes('tmpfs') && 
             !fs.includes('overlay') &&
             !mp.startsWith('/boot') &&
             !mp.startsWith('/snap');
    });

    const formattedDisks = physicalDisks.map(disk => ({
      filesystem: disk.filesystem,
      mounted: disk.mounted,
      total: (disk.blocks / 1024 / 1024 / 1024).toFixed(2), // GB (zakładając bloki 1k)
      used: (disk.used / 1024 / 1024 / 1024).toFixed(2),
      available: (disk.available / 1024 / 1024 / 1024).toFixed(2),
      capacity: disk.capacity, // np. "45%"
    }));

    return NextResponse.json(formattedDisks);
  } catch (error: any) {
    console.error("Disk Info Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}