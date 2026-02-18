import { NextResponse } from 'next/server';
import Docker from 'dockerode';

// Wymuszamy brak cache'owania (zawsze świeże dane)
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const docker = new Docker({ socketPath: '/var/run/docker.sock' });
    const containers = await docker.listContainers({ all: true });

    // DEBUG: Wyświetlamy w konsoli serwera pierwszy kontener, żeby sprawdzić strukturę
    if (containers.length > 0) {
      console.log("🔍 [API DEBUG] Pierwszy kontener z Dockera (surowe dane):", {
        Id: containers[0].Id,
        Names: containers[0].Names,
        Image: containers[0].Image,
        State: containers[0].State
      });
    } else {
      console.log("⚠️ [API DEBUG] Docker zwrócił puszczą listę kontenerów.");
    }

    // Bezpieczne mapowanie danych
    const formattedContainers = containers.map((c) => {
      // 1. Logika wyciągania nazwy
      // Docker zwraca tablicę np. ["/nginx-proxy", "/inny-alias"]
      let name = "Bez nazwy";
      if (Array.isArray(c.Names) && c.Names.length > 0) {
        // Bierzemy pierwszą nazwę i usuwamy początkowy slash "/"
        name = c.Names[0].replace(/^\//, ''); 
      } else if (c.Id) {
        // Jeśli brak nazwy, używamy skróconego ID
        name = c.Id.substring(0, 12);
      }

      // 2. Logika obrazu
      const image = c.Image || "Nieznany obraz";

      // 3. Logika statusu
      const state = c.State || "unknown";
      const status = c.Status || "Brak statusu";

      return {
        id: c.Id,
        shortId: c.Id.substring(0, 12),
        name: name,
        image: image,
        state: state,
        status: status,
        created: c.Created,
      };
    });

    return NextResponse.json(formattedContainers);

  } catch (error: any) {
    console.error("❌ Błąd pobierania listy kontenerów:", error);
    return NextResponse.json(
      { error: 'Nie udało się pobrać listy kontenerów: ' + error.message }, 
      { status: 500 }
    );
  }
}