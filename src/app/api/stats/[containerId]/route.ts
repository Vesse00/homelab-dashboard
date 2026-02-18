import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import Docker from 'dockerode';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ containerId: string }> }
) {
  const { containerId } = await params;

  try {
    // 1. Pobieramy historię z bazy (do wykresów)
    const history = await prisma.containerStat.findMany({
      where: { containerId: containerId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // 2. Pobieramy AKTUALNY stan z Dockera (do badge'a statusu)
    let currentStatus = { state: 'unknown', status: 'Unknown' };
    
    try {
      const docker = new Docker({ socketPath: '/var/run/docker.sock' });
      const container = docker.getContainer(containerId);
      const data = await container.inspect();
      
      currentStatus = {
        state: data.State.Status, // np. "running", "exited", "restarting"
        status: data.State.Status // lub bardziej opisowy data.State.StartedAt
      };
    } catch (dockerError) {
      console.error("Nie udało się pobrać live statusu z Dockera:", dockerError);
      // Nie przerywamy, zwracamy chociaż historię
    }

    // 3. Zwracamy połączone dane
    return NextResponse.json({
      history: history.reverse(),
      current: currentStatus
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}