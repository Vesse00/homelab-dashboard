import { NextResponse } from 'next/server';
import Docker from 'dockerode';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  // 1. Sprawdzamy, czy zalogowany
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. NOWOŚĆ: Sprawdzamy, czy jest ADMINEM
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ 
      error: "Forbidden: Only admins can control containers" 
    }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { containerId, action } = body;

    if (!containerId || !['start', 'stop', 'restart'].includes(action)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const docker = new Docker({ socketPath: '/var/run/docker.sock' });
    const container = docker.getContainer(containerId);

    if (action === 'start') await container.start();
    else if (action === 'stop') await container.stop();
    else if (action === 'restart') await container.restart();

    return NextResponse.json({ success: true, action });

  } catch (error: any) {
    if (error.statusCode === 304) {
      return NextResponse.json({ success: true, message: "Already in that state" });
    }
    console.error("Docker Control Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}