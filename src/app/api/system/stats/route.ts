import { NextResponse } from 'next/server';
import si from 'systeminformation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';

// Blokujemy cache, żeby dane zawsze były na żywo
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
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