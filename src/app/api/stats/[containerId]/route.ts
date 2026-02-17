import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { containerId: string } }
) {
  // Await params in Next.js 15+ logic (just in case, though usually simple params work)
  const { containerId } = params;

  try {
    const history = await prisma.containerStat.findMany({
      where: {
        containerId: containerId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20, // Pobieramy ostatnie 20 punktów
    });

    // Odwracamy, żeby na wykresie czas szedł od lewej do prawej
    return NextResponse.json(history.reverse());
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}