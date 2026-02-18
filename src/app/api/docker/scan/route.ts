import { NextResponse } from 'next/server';
import Docker from 'dockerode';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { KNOWN_APPS } from '@/app/lib/appMap';

// GET: Pobiera zapisane usługi (do wyświetlenia w menu)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { discoveredServices: true }
  });

  const services = user?.discoveredServices ? JSON.parse(user.discoveredServices) : [];
  return NextResponse.json({ services });
}

// POST: Skanuje Dockera i ZAPISUJE wyniki w bazie
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const docker = new Docker({ socketPath: '/var/run/docker.sock' });
    const containers = await docker.listContainers();
    
    // Lista usług, którą zapiszemy w bazie
    const foundServices: any[] = [];

    containers.forEach((c) => {
      const image = c.Image.toLowerCase();
      // Sprawdzamy czy obraz pasuje do znanych aplikacji
      for (const [key, config] of Object.entries(KNOWN_APPS)) {
        if (image.includes(key)) {
            // URL domyślny
            const url = `http://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:${config.port}`;
            
            foundServices.push({
                name: config.name,
                icon: config.icon,
                url: url,
                color: config.color,
                status: 'running' // Domyślnie running, bo znaleźliśmy kontener
            });
            break; 
        }
      }
    });

    // ZAPIS DO BAZY
    // Możemy nadpisać stare lub dodać nowe (tutaj nadpisujemy listę dostępnych opcji)
    await prisma.user.update({
      where: { email: session.user.email },
      data: { discoveredServices: JSON.stringify(foundServices) }
    });

    return NextResponse.json({ 
      success: true, 
      count: foundServices.length, 
      services: foundServices 
    });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}