import { NextResponse } from 'next/server';
import {prisma}  from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing kiosk id' }, { status: 400 });
  }

  try {
    const kiosk = await prisma.kiosk.findUnique({
      where: { id }
    });

    if (!kiosk) {
       return NextResponse.json({ error: 'Kiosk not found' }, { status: 404 });
    }

    // Jeśli serwer wygenerował deviceToken, to znaczy że parowanie się udało!
    if (kiosk.deviceToken) {
       return NextResponse.json({ status: 'paired', deviceToken: kiosk.deviceToken });
    }

    return NextResponse.json({ status: 'pending' });

  } catch (error) {
     return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}