import { NextResponse } from 'next/server';
import {prisma}  from '@/app/lib/prisma';

// Helper do generowania ładnego kodu 8-cyfrowego (np. 4829-1034)
function generatePairingCode() {
  const chars = '0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${result.slice(0, 4)}-${result.slice(4)}`;
}

export async function POST() {
  try {
    let code = generatePairingCode();
    let isUnique = false;
    
    // Upewniamy się, że nikt na świecie nie ma akurat takiego samego kodu w poczekalni
    while (!isUnique) {
      const existing = await prisma.kiosk.findUnique({ where: { pairingCode: code } });
      if (!existing) isUnique = true;
      else code = generatePairingCode();
    }

    const kiosk = await prisma.kiosk.create({
      data: {
        name: 'Nowy Ekran Ścienny',
        pairingCode: code,
      }
    });

    return NextResponse.json({ success: true, kioskId: kiosk.id, pairingCode: code });
  } catch (error) {
    console.error('Kiosk Init Error:', error);
    return NextResponse.json({ error: 'Failed to init kiosk' }, { status: 500 });
  }
}