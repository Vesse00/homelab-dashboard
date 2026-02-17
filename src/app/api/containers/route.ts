import { NextResponse } from 'next/server';
import Docker from 'dockerode';

// Łączymy się z lokalnym socketem Dockera na Debianie
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

export async function GET() {
  try {
    // Pobieramy listę wszystkich kontenerów (także zatrzymanych)
    const containers = await docker.listContainers({ all: true });

    // Zwracamy dane jako JSON
    return NextResponse.json(containers);
  } catch (error: any) {
    console.error("Błąd Dockera:", error);
    return NextResponse.json(
      { error: 'Nie udało się połączyć z Dockerem', details: error.message },
      { status: 500 }
    );
  }
}