import { NextResponse } from 'next/server';
import si from 'systeminformation';

// Blokujemy cache, żeby dane zawsze były na żywo
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [cpu, mem, temp] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.cpuTemperature()
    ]);

    return NextResponse.json({
      cpu: Math.round(cpu.currentLoad),
      ram: Math.round((mem.active / mem.total) * 100),
      ramUsed: (mem.active / 1024 / 1024 / 1024).toFixed(1),
      ramTotal: (mem.total / 1024 / 1024 / 1024).toFixed(1),
      // Niektóre wirtualne maszyny nie podają temperatury, wtedy dajemy null
      temp: temp.main > 0 ? Math.round(temp.main) : null, 
    });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}