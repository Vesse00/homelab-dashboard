import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import bcrypt from "bcryptjs";

// AKTUALIZACJA DANYCH (Nazwa / Hasło)
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Nieautoryzowany" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, currentPassword, newPassword } = body;
    const email = session.user.email;

    // 1. Zmiana samej nazwy
    if (name && !newPassword) {
      await prisma.user.update({
        where: { email },
        data: { name },
      });
      return NextResponse.json({ success: true, message: "Nazwa została zmieniona" });
    }

    // 2. Zmiana hasła (Wymaga podania starego hasła!)
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Podaj aktualne hasło, aby ustawić nowe" }, { status: 400 });
      }

      // Pobierz użytkownika z bazy, aby sprawdzić hasło
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !user.password) {
        return NextResponse.json({ error: "Błąd użytkownika" }, { status: 404 });
      }

      // Sprawdź stare hasło
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return NextResponse.json({ error: "Obecne hasło jest nieprawidłowe" }, { status: 400 });
      }

      // Hashuj nowe hasło
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await prisma.user.update({
        where: { email },
        data: { 
          password: hashedPassword,
          name: name || user.name // Przy okazji aktualizuj nazwę jeśli podana
        },
      });

      return NextResponse.json({ success: true, message: "Hasło zostało zmienione" });
    }

    return NextResponse.json({ error: "Brak danych do zmiany" }, { status: 400 });

  } catch (error) {
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

// USUWANIE KONTA
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Nieautoryzowany" }, { status: 401 });
  }

  try {
    // Nie pozwól usunąć ostatniego admina (opcjonalne zabezpieczenie)
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (user?.role === 'ADMIN') {
        const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
        if (adminCount <= 1) {
            return NextResponse.json({ error: "Nie można usunąć jedynego administratora" }, { status: 400 });
        }
    }

    await prisma.user.delete({
      where: { email: session.user.email },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Błąd podczas usuwania konta" }, { status: 500 });
  }
}