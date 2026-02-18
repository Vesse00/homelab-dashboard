import { NextResponse } from "next/server";
import bcrypt from "bcryptjs"; // <--- Import całego bcryptjs
import { prisma } from "@/app/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: "Brak danych" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ message: "Użytkownik istnieje" }, { status: 409 });
    }

    const userCount = await prisma.user.count();
    const role = userCount === 0 ? "ADMIN" : "USER";

    // --- POPRAWKA: Używamy bcrypt.hash jawnie ---
    const hashedPassword = await bcrypt.hash(password, 10);
    // --------------------------------------------

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role,
        dashboardLayout: "[]"
      },
    });

    return NextResponse.json({ message: "Konto utworzone" }, { status: 201 });

  } catch (error) {
    console.error("Register Error:", error);
    return NextResponse.json({ message: "Błąd serwera" }, { status: 500 });
  }
}