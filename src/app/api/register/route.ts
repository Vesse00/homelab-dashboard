import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: "Brak danych" }, { status: 400 });
    }

    // Sprawdź czy user już istnieje
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ message: "Użytkownik już istnieje" }, { status: 409 });
    }

    // === LOGIKA FIRST USER ADMIN ===
    // Sprawdzamy ilu jest użytkowników w bazie
    const userCount = await prisma.user.count();
    
    // Jeśli 0, to ten user będzie ADMINem, w przeciwnym razie USERem
    const role = userCount === 0 ? "ADMIN" : "USER";

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role, 
      },
    });

    return NextResponse.json({ 
      message: "Konto utworzone", 
      user: { email: user.email, role: user.role } 
    }, { status: 201 });

  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ message: "Błąd serwera" }, { status: 500 });
  }
}