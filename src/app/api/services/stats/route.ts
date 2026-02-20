import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

export async function POST(req: Request) {
  // 1. Zabezpieczenie przed nieautoryzowanym dostępem (opcjonalne, ale zalecane)
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { appName, url, widgetType, settings } = body;

    if (!url) {
      return NextResponse.json({ error: 'Brak adresu URL' }, { status: 400 });
    }

    // 2. Przygotowujemy jednolity format, który zawsze otrzyma frontend
    interface UnifiedStats {
      status: 'offline' | 'online' | 'error';
      primaryText: string;
      secondaryText: string;
      queries?: number;
      latency?: number;
      chartData?: any[] // Dodatkowe dane do wykresów (jeśli potrzebne)
    };

    // 2. TWORZYMY OBIEKT BAZOWY (Zgodnie z naszym interfejsem)
    let unifiedStats: UnifiedStats = {
      status: 'offline', 
      primaryText: 'Brak danych', 
      secondaryText: 'Sprawdź ustawienia',      
    };

    // 3. Budujemy nagłówki (Rozwiązanie dla loginu i hasła - Basic Auth)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (settings?.authType === 'basic' && settings?.username && settings?.password) {
      const credentials = `${settings.username}:${settings.password}`;
      // Kodujemy "login:hasło" do standardu Base64
      headers['Authorization'] = `Basic ${Buffer.from(credentials).toString('base64')}`;
    }

    // --------------------------------------------------------
    // TŁUMACZ API W ZALEŻNOŚCI OD TYPU WIDGETU
    // --------------------------------------------------------
    const startTime = Date.now();
    if (widgetType === 'pihole') {
      
      // A) Logika dla ADGUARD HOME
      if (appName.toLowerCase().includes('adguard')) {
        const res = await fetch(`${url}/control/stats`, { 
          headers,
          signal: AbortSignal.timeout(5000) 
        });

        const latency = Date.now() - startTime; // KUNIEC POMIARU

        if (res.ok) {
          const data = await res.json();
          // AdGuard zwraca tablice, musimy zsumować
          const totalBlocked = data.blocked_filtering ? data.blocked_filtering.reduce((a: number, b: number) => a + b, 0) : 0;
          const totalQueries = data.dns_queries ? data.dns_queries.reduce((a: number, b: number) => a + b, 0) : 0;
          const percentage = totalQueries > 0 ? ((totalBlocked / totalQueries) * 100).toFixed(1) : '0';
          
          unifiedStats = {
            status: 'online',
            primaryText: `Zablokowano: ${totalBlocked}`,
            secondaryText: `${percentage}% ruchu`,
            queries: totalQueries,
            latency: latency,
            chartData: []
          };
        } else {
          unifiedStats.status = 'error';
          unifiedStats.primaryText = 'Błąd autoryzacji';
        }
      } 
      
      // B) Logika dla PI-HOLE
      else {
        const apiToken = settings?.apiKey ? `&auth=${settings.apiKey}` : '';
        const res = await fetch(`${url}/admin/api.php?summaryRaw${apiToken}`, {
          signal: AbortSignal.timeout(5000)
        });

        const latency = Date.now() - startTime; // KONIEC POMIARU

        if (res.ok) {
          const data = await res.json();
          unifiedStats = {
            status: data.status === 'enabled' ? 'online' : 'offline',
            primaryText: `Zablokowano: ${data.ads_blocked_today}`,
            secondaryText: `${data.ads_percentage_today.toFixed(1)}% ruchu`,
            queries: data.dns_queries_today,
            latency: latency
          };
        } else {
          unifiedStats.status = 'error';
          unifiedStats.primaryText = 'Odmowa dostępu (Zły klucz?)';
        }
      }
    }

    // --------------------------------------------------------
    // C) Logika dla ADMIN (np. Portainer)
    // --------------------------------------------------------
    if (widgetType === 'admin') {
      
      if (appName.toLowerCase().includes('portainer')) {
        let apiHeaders: Record<string, string> = {};
        
        // USUWANIE UKOŚNIKA Z KOŃCA ADRESU URL
        const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;

        try {
          if (settings?.authType === 'apikey' && settings?.apiKey) {
            apiHeaders['X-API-Key'] = settings.apiKey;
          } 
          else if (settings?.authType === 'basic' && settings?.username && settings?.password) {
            console.log(`[Portainer Auth] Próba logowania...`);

            const authRes = await fetch(`${cleanUrl}/api/auth`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                Username: settings.username,
                Password: settings.password
              }),
              signal: AbortSignal.timeout(5000)
            });

            if (authRes.ok) {
              const authData = await authRes.json();
              apiHeaders['Authorization'] = `Bearer ${authData.jwt}`;
              console.log("[Portainer Auth] Sukces! Mamy token.");
            } else {
              return NextResponse.json({
                status: 'error', primaryText: 'Błąd logowania', secondaryText: `Błąd ${authRes.status}`, latency: Date.now() - startTime
              });
            }
          }

          // KROK 1: Pobieramy listę środowisk (Endpoints), żeby znaleźć poprawne ID
          const endpointsRes = await fetch(`${cleanUrl}/api/endpoints`, {
            headers: apiHeaders,
            signal: AbortSignal.timeout(5000)
          });

          if (!endpointsRes.ok) {
             console.error(`[Portainer Endpoints Error] Status: ${endpointsRes.status}`);
             throw new Error("Nie udało się pobrać środowisk");
          }

          const endpoints = await endpointsRes.json();
          if (!endpoints || endpoints.length === 0) {
             throw new Error("Brak podpiętych środowisk w Portainerze");
          }

          // Wybieramy ID pierwszego dostępnego środowiska (najczęściej lokalny Docker)
          const endpointId = endpoints[0].Id;
          console.log(`[Portainer] Wykryto środowisko o ID: ${endpointId}`);

          // KROK 2: Uderzamy o kontenery używając poprawnego ID
          const res = await fetch(`${cleanUrl}/api/endpoints/${endpointId}/docker/containers/json?all=1`, {
            headers: apiHeaders,
            signal: AbortSignal.timeout(5000)
          });

          const latency = Date.now() - startTime;

          if (res.ok) {
            const containers = await res.json();
            
            const running = containers.filter((c: any) => c.State === 'running').length;
            const stopped = containers.filter((c: any) => c.State !== 'running').length;
            
            unifiedStats = {
              status: 'online',
              primaryText: `Działa: ${running}`,
              secondaryText: `Zatrzymane: ${stopped}`,
              latency: latency,
              queries: containers.length 
            };
          } else {
            console.error(`[Portainer Data Error] Status: ${res.status}`);
            unifiedStats.status = 'error';
            unifiedStats.primaryText = 'Odmowa dostępu';
            unifiedStats.secondaryText = `Błąd ${res.status}`;
            unifiedStats.latency = latency;
          }

        } catch (e: any) {
          console.error(`[Portainer Catch]`, e.message);
          unifiedStats.status = 'error';
          unifiedStats.primaryText = 'Brak połączenia';
          unifiedStats.secondaryText = e.message || 'Błąd API';
        }
      }
    }

    // --------------------------------------------------------
    // D) Logika dla MEDIA (Plex / Jellyfin)
    // --------------------------------------------------------
    if (widgetType === 'media') {

      const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
      
      // --- PLEX ---
      if (appName.toLowerCase().includes('plex')) {
        // Plex zazwyczaj używa tokenu przekazywanego w URL lub w nagłówku
        const apiToken = settings?.apiKey ? `?X-Plex-Token=${settings.apiKey}` : '';
        
        try {
          // Pobieramy aktywne sesje (kto aktualnie ogląda)
          const res = await fetch(`${cleanUrl}/status/sessions${apiToken}`, {
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(5000)
          });

          const latency = Date.now() - startTime;

          if (res.ok) {
            const data = await res.json();
            const activeStreams = data.MediaContainer?.size || 0;
            
            unifiedStats = {
              status: 'online',
              primaryText: activeStreams > 0 ? `Ogląda: ${activeStreams}` : 'Brak streamów',
              secondaryText: activeStreams > 0 ? 'Serwer obciążony' : 'Serwer w spoczynku',
              latency: latency,
              queries: activeStreams // w małym kafelku możemy pokazać liczbę streamów
            };
          } else {
            unifiedStats.status = 'error';
            unifiedStats.primaryText = 'Odmowa dostępu';
            unifiedStats.secondaryText = 'Sprawdź X-Plex-Token';
          }
        } catch (e) {
          unifiedStats.status = 'error';
          unifiedStats.primaryText = 'Brak połączenia';
        }
      }
      
      // --- JELLYFIN ---
      else if (appName.toLowerCase().includes('jellyfin')) {
        // Jellyfin wymaga specjalnego nagłówka z kluczem
        const headers: Record<string, string> = {};
        if (settings?.apiKey) {
          headers['Authorization'] = `MediaBrowser Token="${settings.apiKey}"`;
        }

        try {
          const res = await fetch(`${cleanUrl}/Sessions`, {
            headers,
            signal: AbortSignal.timeout(5000)
          });

          const latency = Date.now() - startTime;

          if (res.ok) {
            const sessions = await res.json();
            // Filtrujemy tylko aktywne sesje, które faktycznie coś odtwarzają
            const activeStreams = sessions.filter((s: any) => s.NowPlayingItem).length;
            
            unifiedStats = {
              status: 'online',
              primaryText: activeStreams > 0 ? `Ogląda: ${activeStreams}` : 'Brak streamów',
              secondaryText: 'Jellyfin aktywny',
              latency: latency,
              queries: activeStreams
            };
          } else {
            unifiedStats.status = 'error';
            unifiedStats.primaryText = 'Odmowa dostępu';
          }
        } catch (e) {
          unifiedStats.status = 'error';
          unifiedStats.primaryText = 'Brak połączenia';
        }
      }
    }

    // --------------------------------------------------------
    // E) Logika dla PROXY (Nginx Proxy Manager)
    // --------------------------------------------------------
    if (widgetType === 'proxy') {

      const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
      
      if (appName.toLowerCase().includes('nginx')) {
        let apiHeaders: Record<string, string> = {};
        
        try {
          if (settings?.authType === 'basic' && settings?.username && settings?.password) {
            const authRes = await fetch(`${cleanUrl}/api/tokens`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                identity: settings.username,
                secret: settings.password
              }),
              signal: AbortSignal.timeout(5000)
            });

            if (authRes.ok) {
              const authData = await authRes.json();
              apiHeaders['Authorization'] = `Bearer ${authData.token}`;
            } else {
              return NextResponse.json({
                status: 'error', primaryText: 'Błąd logowania', secondaryText: `Sprawdź dane`, latency: Date.now() - startTime
              });
            }
          }

          // POBIERAMY 3 ENDPOINTY JEDNOCZEŚNIE (Super szybkie!)
          const [proxyRes, redirRes, deadRes] = await Promise.all([
            fetch(`${cleanUrl}/api/nginx/proxy-hosts`, { headers: apiHeaders, signal: AbortSignal.timeout(5000) }),
            fetch(`${cleanUrl}/api/nginx/redirection-hosts`, { headers: apiHeaders, signal: AbortSignal.timeout(5000) }),
            fetch(`${cleanUrl}/api/nginx/dead-hosts`, { headers: apiHeaders, signal: AbortSignal.timeout(5000) })
          ]);

          const latency = Date.now() - startTime;

          if (proxyRes.ok && redirRes.ok && deadRes.ok) {
            const proxyHosts = await proxyRes.json();
            const redirHosts = await redirRes.json();
            const deadHosts = await deadRes.json();

            const enabledProxy = proxyHosts.filter((h: any) => h.enabled === 1 || h.enabled === true).length;
            const enabledRedir = redirHosts.filter((h: any) => h.enabled === 1 || h.enabled === true).length;
            const enabledDead = deadHosts.filter((h: any) => h.enabled === 1 || h.enabled === true).length;

            const totalHosts = proxyHosts.length + redirHosts.length + deadHosts.length;

            unifiedStats = {
              status: 'online',
              primaryText: `Proxy: ${enabledProxy}`,
              secondaryText: `Wszystkich hostów: ${totalHosts}`,
              latency: latency,
              queries: totalHosts,
              // DODAJEMY DANE DO WYKRESU DLA FRONTENDU
              chartData: [
                { label: 'Proxy', count: proxyHosts.length, active: enabledProxy, color: 'bg-emerald-500' },
                { label: 'Przekierowania', count: redirHosts.length, active: enabledRedir, color: 'bg-blue-500' },
                { label: 'Strony 404', count: deadHosts.length, active: enabledDead, color: 'bg-red-500' }
              ]
            };
          } else {
            unifiedStats.status = 'error';
            unifiedStats.primaryText = 'Odmowa dostępu';
          }
        } catch (e) {
          unifiedStats.status = 'error';
          unifiedStats.primaryText = 'Brak połączenia';
        }
      }
    }


    // Zwracamy piękny, ujednolicony wynik do naszego widgetu
    return NextResponse.json(unifiedStats);

  } catch (error: any) {
    console.error("Błąd API Adaptera:", error.message);
    return NextResponse.json({ 
      status: 'error', 
      primaryText: 'Serwer nie odpowiada',
      secondaryText: 'Sprawdź URL lub stan kontenera',
      queries: 0,
      latency: 0
     }, { status: 500
    });
  }
}
