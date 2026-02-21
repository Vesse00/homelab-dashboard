import { NextResponse } from 'next/server';
import Docker from 'dockerode';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { KNOWN_APPS } from '@/app/lib/appMap';
import { headers } from 'next/headers'; // <--- DODAJ IMPORT

export async function GET(req: Request) {
  // 1. Sprawdzamy sesję (zabezpieczenie)
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Automatyczne wykrywanie IP serwera z nagłówka przeglądarki
  const hostHeader = req.headers.get('host') || 'localhost';
  const serverIp = hostHeader.split(':')[0];

  try {
    // 3. Połączenie z Dockerem przez Socket
    const response = await fetch('http://localhost/containers/json', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      socketPath: '/var/run/docker.sock'
    } as RequestInit & { socketPath?: string });

    if (!response.ok) {
      throw new Error(`Błąd połączenia z Dockerem: ${response.status}`);
    }

    const containers = await response.json();
    const discoveredApps: any[] = [];

    // 4. Mapowanie kontenerów na nasze widgety
    for (const container of containers) {
      const image = container.Image;
      const name = container.Names[0].replace('/', '');

      const appDefKey = Object.keys(KNOWN_APPS).find(key => image.includes(key));

      if (appDefKey) {
        const appConfig = KNOWN_APPS[appDefKey];
        
        // Wykrywanie portu (jeśli Docker go wystawił, bierzemy publiczny, jeśli nie - domyślny z mapy)
        let publicPort = appConfig.port;
        if (container.Ports && container.Ports.length > 0) {
          const mappedPort = container.Ports.find((p: any) => p.PublicPort);
          if (mappedPort) {
            publicPort = mappedPort.PublicPort;
          }
        }

        discoveredApps.push({
          id: container.Id,
          name: appConfig.name || name,
          icon: appConfig.icon,
          // TUTAJ NAJWAŻNIEJSZA ZMIANA - IP ZAMIAST LOCALHOST
          url: `http://${serverIp}:${publicPort}`,
          color: appConfig.color,
          status: container.State,
          widgetType: appConfig.widgetType,
          template: appConfig.template
        });
      }
    }

    return NextResponse.json(discoveredApps);
  } catch (error: any) {
    console.error("Błąd skanowania dockera:", error.message);
    return NextResponse.json({ error: 'Nie udało się połączyć z usługą Docker' }, { status: 500 });
  }
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // 1. Pobierz adres IP (host), z którego przyszło żądanie
    // Dzięki temu, jeśli wchodzisz przez 192.168.1.63, widgety też dostaną taki adres
    const headersList = await headers();
    const hostHeader = headersList.get('host') || 'localhost';
    const hostname = hostHeader.split(':')[0]; // Usuwamy port dashboardu (np. :3000)

    const docker = new Docker({ socketPath: '/var/run/docker.sock' });
    const containers = await docker.listContainers();
    
    const foundServices: any[] = [];

    containers.forEach((c) => {
      const image = c.Image.toLowerCase();
      
      for (const [key, config] of Object.entries(KNOWN_APPS)) {
        if (image.includes(key)) {
            // 2. Używamy wykrytego hostname zamiast 'localhost'
            const url = `http://${hostname}:${config.port}`;
            
            foundServices.push({
                name: config.name,
                icon: config.icon,
                url: url,
                color: config.color,
                status: 'running',
                widgetType: config.widgetType,
            });
            break; 
        }
      }
    });

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