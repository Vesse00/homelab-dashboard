import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });

  try {
    const { backgroundUrl } = await req.json();
    
    await prisma.user.update({
      where: { email: session.user.email },
      data: { backgroundUrl }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Błąd zapisu tła" }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { backgroundUrl: true }
    });

    return NextResponse.json({ backgroundUrl: user?.backgroundUrl || "" });
  } catch (error) {
    return NextResponse.json({ error: "Błąd pobierania tła" }, { status: 500 });
  }
}