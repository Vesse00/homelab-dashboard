import { NextResponse } from 'next/server';
import Docker from 'dockerode';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { KNOWN_APPS } from '@/app/lib/appMap';
import { headers } from 'next/headers'; // <--- DODAJ IMPORT

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