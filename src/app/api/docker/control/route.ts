import { NextResponse } from 'next/server';
import Docker from 'dockerode';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";

export async function POST(req: Request) {
  // 1. Zabezpieczenie: Tylko zalogowani użytkownicy
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { containerId, action } = body;

    if (!containerId || !['start', 'stop', 'restart'].includes(action)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const docker = new Docker({ socketPath: '/var/run/docker.sock' });
    const container = docker.getContainer(containerId);

    // Wykonujemy akcję
    if (action === 'start') {
      await container.start();
    } else if (action === 'stop') {
      await container.stop();
    } else if (action === 'restart') {
      await container.restart();
    }

    return NextResponse.json({ success: true, action });

  } catch (error: any) {
    // Docker rzuca błąd np. gdy próbujesz zatrzymać już zatrzymany kontener (kod 304)
    // Ignorujemy kod 304 (Not Modified) jako sukces
    if (error.statusCode === 304) {
      return NextResponse.json({ success: true, message: "Already in that state" });
    }
    
    console.error("Docker Control Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || error.json?.message }, 
      { status: 500 }
    );
  }
}