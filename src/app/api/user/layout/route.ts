import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Pobierz usera i jego layout
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { dashboardLayout: true }
  });

  // Jeśli user ma zapisany layout, zwróć go. Jeśli nie, zwróć null (frontend użyje domyślnego)
  return NextResponse.json({ 
    layout: user?.dashboardLayout ? JSON.parse(user.dashboardLayout) : null 
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { layout } = body;

    // Zapisz layout jako string JSON w bazie
    await prisma.user.update({
      where: { email: session.user.email },
      data: { dashboardLayout: JSON.stringify(layout) }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save layout" }, { status: 500 });
  }
}