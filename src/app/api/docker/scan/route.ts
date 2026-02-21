import { NextResponse } from 'next/server';
import Docker from 'dockerode';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { KNOWN_APPS } from '@/app/lib/appMap';
import * as os from 'os'; // <--- DODAJEMY MODUŁ SYSTEMOWY

// Kuloodporna funkcja wykrywająca fizyczne IP serwera, ignorująca nagłówki z przeglądarki
function getServerIp(): string {
  // 1. Priorytet: Sztywno wpisane IP w pliku .env (np. HOST_IP=192.168.1.63)
  if (process.env.HOST_IP) {
    return process.env.HOST_IP;
  }

  // 2. Automatyczne skanowanie fizycznych kart sieciowych serwera!
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const ifaceArray = interfaces[name];
    if (!ifaceArray) continue;

    for (const iface of ifaceArray) {
      // Szukamy adresu IPv4, który NIE jest adresem wewnętrznym (czyli ignorujemy 127.0.0.1 / localhost)
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`[Docker Scan] Automatycznie wykryto fizyczne IP serwera: ${iface.address}`);
        return iface.address; // Zwróci np. 192.168.1.63
      }
    }
  }

  return 'localhost';
}

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

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // ZAMIAST CZYTAĆ Z NAGŁÓWKÓW PRZEGLĄDARKI, CZYTAMY Z KARTY SIECIOWEJ
    const serverIp = getServerIp();

    const docker = new Docker({ socketPath: '/var/run/docker.sock' });
    const containers = await docker.listContainers();
    
    const foundServices: any[] = [];

    containers.forEach((c) => {
      const image = c.Image.toLowerCase();
      
      for (const [key, config] of Object.entries(KNOWN_APPS)) {
        if (image.includes(key)) {
            // Używamy naszego sprzętowego IP
            const url = `http://${serverIp}:${config.port}`;
            
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