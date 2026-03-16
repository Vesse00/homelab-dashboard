import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/app/lib/prisma';
import { authOptions } from '@/app/lib/auth';

// POBIERA KIOSKI
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const kiosks = await prisma.kiosk.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ kiosks });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch kiosks' }, { status: 500 });
  }
}

// ZMIENIA UKŁAD KIOSKU (Można to robić w dowolnym momencie)
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id, tabId } = await req.json();
    const user = await prisma.user.findUnique({ where: { email: session.user!.email } });
    
    let layoutData = null;
    if (tabId && user?.dashboardLayout) {
      const tabs = JSON.parse(user.dashboardLayout);
      const selectedTab = tabs.find((t: any) => t.id === tabId);
      if (selectedTab) layoutData = JSON.stringify(selectedTab.widgets);
    }

    await prisma.kiosk.update({
      where: { id },
      data: { tabId: tabId || null, layout: layoutData }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update kiosk layout' }, { status: 500 });
  }
}

// USUWA KIOSK
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await req.json();
    await prisma.kiosk.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete kiosk' }, { status: 500 });
  }
}