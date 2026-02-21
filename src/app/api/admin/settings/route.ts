import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';

async function checkAdmin() {
  const session = await getServerSession(authOptions);
  return (session?.user as any)?.role === 'ADMIN';
}

// Pobieranie statusu rejestracji
export async function GET() {
  try {
    let settings = await prisma.systemSettings.findUnique({ where: { id: 'global' } });
    if (!settings) {
      settings = await prisma.systemSettings.create({ data: { id: 'global', registrationEnabled: true } });
    }
    return NextResponse.json(settings);
  } catch (e) {
    return NextResponse.json({ error: 'Błąd' }, { status: 500 });
  }
}

// Zmiana statusu rejestracji
export async function POST(req: Request) {
  if (!(await checkAdmin())) return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 });
  
  try {
    const { registrationEnabled } = await req.json();
    const settings = await prisma.systemSettings.upsert({
      where: { id: 'global' },
      update: { registrationEnabled },
      create: { id: 'global', registrationEnabled }
    });
    return NextResponse.json(settings);
  } catch (e) {
    return NextResponse.json({ error: 'Błąd zapisu' }, { status: 500 });
  }
}