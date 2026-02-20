import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';

// Pomocnicza funkcja do sprawdzania roli
async function checkAdmin() {
  const session = await getServerSession(authOptions);
  return (session?.user as any)?.role === 'ADMIN';
}

// POBIERANIE LISTY UŻYTKOWNIKÓW
export async function GET() {
  if (!(await checkAdmin())) return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 });
  
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });
    
    // Formatowanie daty na przyjazną (np. 2026-02-18)
    const formattedUsers = users.map(u => ({
      ...u,
      createdAt: u.createdAt.toISOString().split('T')[0]
    }));
    
    return NextResponse.json(formattedUsers);
  } catch (e) {
    return NextResponse.json({ error: 'Błąd pobierania' }, { status: 500 });
  }
}

// ZMIANA ROLI UŻYTKOWNIKA
export async function PATCH(req: Request) {
  if (!(await checkAdmin())) return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 });
  
  try {
    const { id, role } = await req.json();
    await prisma.user.update({
      where: { id },
      data: { role }
    });
    return NextResponse.json({ message: 'Uprawnienia zaktualizowane' });
  } catch (e) {
    return NextResponse.json({ error: 'Błąd aktualizacji' }, { status: 500 });
  }
}

// USUWANIE UŻYTKOWNIKA
export async function DELETE(req: Request) {
  if (!(await checkAdmin())) return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 });
  
  try {
    const { id } = await req.json();
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ message: 'Użytkownik usunięty' });
  } catch (e) {
    return NextResponse.json({ error: 'Błąd usuwania' }, { status: 500 });
  }
}