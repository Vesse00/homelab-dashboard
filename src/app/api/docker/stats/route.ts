import { NextResponse } from 'next/server';
import Docker from 'dockerode';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {

  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  try {
    const docker = new Docker({ socketPath: '/var/run/docker.sock' });
    const containers = await docker.listContainers({ all: true });
    
    // DEBUG: Zobacz w terminalu, jak wyglądają dane pierwszego kontenera
    if (containers.length > 0) {
      console.log("🔍 Przykładowy kontener (dane z Dockera):", {
        State: containers[0].State,
        Status: containers[0].Status,
        Names: containers[0].Names
      });
    }

    const total = containers.length;

    // POPRAWKA: Sprawdzamy 'State' (duża litera) ORAZ 'Status' (dla pewności)
    const running = containers.filter(c => {
      // 1. Sprawdź pole State (zazwyczaj 'running')
      if (c.State === 'running' || c.State === 'Running') return true;
      
      // 2. Jeśli brak pola State, sprawdź Status (np. "Up 2 hours")
      if (c.Status && c.Status.startsWith('Up')) return true;
      
      return false;
    }).length;

    let uptime = 0;
    if (total > 0) {
        const ratio = (running / total) * 100;
        uptime = parseFloat(ratio.toFixed(2)); 
    }

    return NextResponse.json({ 
      running, 
      total, 
      uptime: uptime.toFixed(2) 
    });

  } catch (error: any) {
    console.error("Docker API Error:", error);
    return NextResponse.json(
      { running: 0, total: 0, uptime: "0.00", error: error.message }, 
      { status: 500 }
    );
  }
}