import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  // ZMIANA 1: Typujemy params jako Promise
  { params }: { params: Promise<{ containerId: string }> }
) {
  // ZMIANA 2: Musimy zrobić "await", zanim dobierzemy się do środka
  const { containerId } = await params;

  try {
    const history = await prisma.containerStat.findMany({
      where: {
        containerId: containerId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });

    return NextResponse.json(history.reverse());
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}