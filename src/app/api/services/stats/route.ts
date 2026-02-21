import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

export async function POST(req: Request) {
  // 1. Zabezpieczenie przed nieautoryzowanym dostępem
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { appName, url, widgetType, settings } = body;

    if (!url) {
      return NextResponse.json({ error: 'Brak adresu URL' }, { status: 400 });
    }

    // 2. Przygotowujemy jednolity format
    // DODANO: [key: string]: any - pozwala na wysyłanie specyficznych pól (up, down, devices) dla naszych nowych szablonów
    interface UnifiedStats {
      status: 'offline' | 'online' | 'error';
      primaryText: string;
      secondaryText: string;
      queries?: number;
      latency?: number;
      chartData?: any[];
      [key: string]: any; 
    };

    let unifiedStats: UnifiedStats = {
      status: 'offline', 
      primaryText: 'Brak danych', 
      secondaryText: 'Sprawdź ustawienia',      
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (settings?.authType === 'basic' && settings?.username && settings?.password) {
      const credentials = `${settings.username}:${settings.password}`;
      headers['Authorization'] = `Basic ${Buffer.from(credentials).toString('base64')}`;
    }

    const startTime = Date.now();
    const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;

    // --------------------------------------------------------
    // TŁUMACZ API W ZALEŻNOŚCI OD TYPU WIDGETU
    // --------------------------------------------------------
    
    // A) PI-HOLE / ADGUARD
    if (widgetType === 'dns' || widgetType === 'pihole') { // Zaktualizowano warunek dla pewności
      if (appName.toLowerCase().includes('adguard')) {
        const res = await fetch(`${cleanUrl}/control/stats`, { headers, signal: AbortSignal.timeout(5000) });
        const latency = Date.now() - startTime;
        if (res.ok) {
          const data = await res.json();
          const totalBlocked = data.blocked_filtering ? data.blocked_filtering.reduce((a: number, b: number) => a + b, 0) : 0;
          const totalQueries = data.dns_queries ? data.dns_queries.reduce((a: number, b: number) => a + b, 0) : 0;
          const percentage = totalQueries > 0 ? ((totalBlocked / totalQueries) * 100).toFixed(1) : '0';
          
          unifiedStats = { status: 'online', primaryText: `Zablokowano: ${totalBlocked}`, secondaryText: `${percentage}% ruchu`, queries: totalQueries, latency, chartData: [] };
        } else {
          unifiedStats = { status: 'error', primaryText: 'Błąd autoryzacji', secondaryText: `Błąd ${res.status}` };
        }
      } else {
        const apiToken = settings?.apiKey ? `&auth=${settings.apiKey}` : '';
        const res = await fetch(`${cleanUrl}/admin/api.php?summaryRaw${apiToken}`, { signal: AbortSignal.timeout(5000) });
        const latency = Date.now() - startTime;
        if (res.ok) {
          const data = await res.json();
          unifiedStats = { status: data.status === 'enabled' ? 'online' : 'offline', primaryText: `Zablokowano: ${data.ads_blocked_today}`, secondaryText: `${data.ads_percentage_today.toFixed(1)}% ruchu`, queries: data.dns_queries_today, latency };
        } else {
          unifiedStats = { status: 'error', primaryText: 'Odmowa dostępu', secondaryText: 'Zły klucz API?' };
        }
      }
    }

    // B) ADMIN (Portainer)
    else if (widgetType === 'admin') {
      if (appName.toLowerCase().includes('portainer')) {
        let apiHeaders: Record<string, string> = {};
        try {
          if (settings?.authType === 'apikey' && settings?.apiKey) {
            apiHeaders['X-API-Key'] = settings.apiKey;
          } else if (settings?.authType === 'basic' && settings?.username && settings?.password) {
            const authRes = await fetch(`${cleanUrl}/api/auth`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ Username: settings.username, Password: settings.password }), signal: AbortSignal.timeout(5000) });
            if (authRes.ok) {
              apiHeaders['Authorization'] = `Bearer ${(await authRes.json()).jwt}`;
            } else {
              return NextResponse.json({ status: 'error', primaryText: 'Błąd logowania', secondaryText: `Błąd ${authRes.status}`, latency: Date.now() - startTime });
            }
          }

          const endpointsRes = await fetch(`${cleanUrl}/api/endpoints`, { headers: apiHeaders, signal: AbortSignal.timeout(5000) });
          if (!endpointsRes.ok) throw new Error("Brak środowisk");
          const endpoints = await endpointsRes.json();
          const endpointId = endpoints[0].Id;

          const res = await fetch(`${cleanUrl}/api/endpoints/${endpointId}/docker/containers/json?all=1`, { headers: apiHeaders, signal: AbortSignal.timeout(5000) });
          const latency = Date.now() - startTime;
          if (res.ok) {
            const containers = await res.json();
            const running = containers.filter((c: any) => c.State === 'running').length;
            const stopped = containers.filter((c: any) => c.State !== 'running').length;
            unifiedStats = { status: 'online', primaryText: `Działa: ${running}`, secondaryText: `Zatrzymane: ${stopped}`, latency, queries: containers.length };
          } else {
            unifiedStats = { status: 'error', primaryText: 'Odmowa dostępu', secondaryText: `Błąd ${res.status}`, latency };
          }
        } catch (e: any) {
          unifiedStats = { status: 'error', primaryText: 'Brak połączenia', secondaryText: e.message || 'Błąd API' };
        }
      }
    }

    // C) MEDIA (Plex / Jellyfin)
    else if (widgetType === 'media') {
      if (appName.toLowerCase().includes('plex')) {
        const apiToken = settings?.apiKey ? `?X-Plex-Token=${settings.apiKey}` : '';
        try {
          const res = await fetch(`${cleanUrl}/status/sessions${apiToken}`, { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(5000) });
          const latency = Date.now() - startTime;
          if (res.ok) {
            const activeStreams = (await res.json()).MediaContainer?.size || 0;
            unifiedStats = { status: 'online', primaryText: activeStreams > 0 ? `Ogląda: ${activeStreams}` : 'Brak streamów', secondaryText: activeStreams > 0 ? 'Serwer obciążony' : 'W spoczynku', latency, queries: activeStreams };
          } else {
            unifiedStats = { status: 'error', primaryText: 'Odmowa dostępu', secondaryText: 'Zły X-Plex-Token' };
          }
        } catch (e) {
          unifiedStats = { status: 'error', primaryText: 'Brak połączenia', secondaryText: 'Błąd usługi' };
        }
      } else if (appName.toLowerCase().includes('jellyfin')) {
        const jHeaders: Record<string, string> = {};
        if (settings?.apiKey) jHeaders['Authorization'] = `MediaBrowser Token="${settings.apiKey}"`;
        try {
          const res = await fetch(`${cleanUrl}/Sessions`, { headers: jHeaders, signal: AbortSignal.timeout(5000) });
          const latency = Date.now() - startTime;
          if (res.ok) {
            const sessions = await res.json();
            const activeStreams = sessions.filter((s: any) => s.NowPlayingItem).length;
            unifiedStats = { status: 'online', primaryText: activeStreams > 0 ? `Ogląda: ${activeStreams}` : 'Brak streamów', secondaryText: 'Jellyfin aktywny', latency, queries: activeStreams };
          } else {
            unifiedStats = { status: 'error', primaryText: 'Odmowa dostępu', secondaryText: 'Zły klucz API' };
          }
        } catch (e) {
          unifiedStats = { status: 'error', primaryText: 'Brak połączenia', secondaryText: 'Błąd usługi' };
        }
      }
    }

    // D) PROXY (Nginx Proxy Manager)
    else if (widgetType === 'proxy') {
      if (appName.toLowerCase().includes('nginx')) {
        let apiHeaders: Record<string, string> = {};
        try {
          if (settings?.authType === 'basic' && settings?.username && settings?.password) {
            const authRes = await fetch(`${cleanUrl}/api/tokens`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identity: settings.username, secret: settings.password }), signal: AbortSignal.timeout(5000) });
            if (authRes.ok) apiHeaders['Authorization'] = `Bearer ${(await authRes.json()).token}`;
            else return NextResponse.json({ status: 'error', primaryText: 'Błąd logowania', secondaryText: `Złe dane`, latency: Date.now() - startTime });
          }
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
            const totalHosts = proxyHosts.length + redirHosts.length + deadHosts.length;
            unifiedStats = { status: 'online', primaryText: `Proxy: ${enabledProxy}`, secondaryText: `Hostów: ${totalHosts}`, latency, queries: totalHosts, chartData: [
                { label: 'Proxy', count: proxyHosts.length, active: enabledProxy, color: 'bg-emerald-500' },
                { label: 'Przekierowania', count: redirHosts.length, active: redirHosts.filter((h: any) => h.enabled).length, color: 'bg-blue-500' },
                { label: 'Strony 404', count: deadHosts.length, active: deadHosts.filter((h: any) => h.enabled).length, color: 'bg-red-500' }
            ]};
          } else {
            unifiedStats = { status: 'error', primaryText: 'Odmowa dostępu', secondaryText: 'Brak uprawnień' };
          }
        } catch (e) {
          unifiedStats = { status: 'error', primaryText: 'Brak połączenia', secondaryText: 'Usługa nie odpowiada' };
        }
      }
    }

    // E) HOME ASSISTANT
    else if (widgetType === 'home-assistant') {
      try {
        if (!settings?.apiKey) {
           unifiedStats = { status: 'error', primaryText: 'Odmowa dostępu', secondaryText: 'Brak tokenu API', latency: 0 };
        } else {
           const apiHeaders: Record<string, string> = { 'Authorization': `Bearer ${settings.apiKey}` };
           const targetUrl = `${cleanUrl}/api/`;
           const res = await fetch(targetUrl, { headers: apiHeaders, signal: AbortSignal.timeout(5000) });
           const latency = Date.now() - startTime;
           
           if (res.ok) {
              unifiedStats = { status: 'online', primaryText: 'Hub Aktywny', secondaryText: 'Zalogowano', latency };
           } else if (res.status === 401) {
              unifiedStats = { status: 'error', primaryText: 'Odmowa dostępu', secondaryText: 'Zły token API', latency };
           } else {
              unifiedStats = { status: 'error', primaryText: 'Błąd Huba', secondaryText: `Kod ${res.status}`, latency };
           }
        }
      } catch (e) {
        unifiedStats = { status: 'error', primaryText: 'Brak połączenia', secondaryText: 'Sprawdź IP serwera', latency: 0 };
      }
    }

    // F) UPTIME KUMA
    else if (widgetType === 'uptime-kuma') {
      try {
        const slug = settings?.statusPage || 'default';
        const pingRes = await fetch(cleanUrl, { signal: AbortSignal.timeout(5000) });
        const latency = Date.now() - startTime;

        if (pingRes.ok) {
          try {
            // UWAGA: Kuma rozdziela listę nazw od list statusów (heartbeats). Pobieramy oba!
            const [statusRes, heartbeatRes] = await Promise.all([
               fetch(`${cleanUrl}/api/status-page/${slug}`, { signal: AbortSignal.timeout(5000) }),
               fetch(`${cleanUrl}/api/status-page/heartbeat/${slug}`, { signal: AbortSignal.timeout(5000) })
            ]);
            
            if (statusRes.ok && heartbeatRes.ok) {
              const data = await statusRes.json();
              const heartbeats = await heartbeatRes.json();
              
              let up = 0;
              let down = 0;
              let monitorList: any[] = [];
              
              // Tworzymy "słownik" najświeższych statusów (ostatni heartbeat dla każdego ID monitora)
              const latestStatuses: Record<string, number> = {};
              
              if (heartbeats.heartbeatList) {
                // heartbeatList to obiekt np. { "1": [{status: 1}, {status: 0}], "2": [...] }
                Object.entries(heartbeats.heartbeatList).forEach(([monitorId, beats]: [string, any]) => {
                   if (Array.isArray(beats) && beats.length > 0) {
                      const lastBeat = beats[beats.length - 1]; // Bierzemy najświeższy (ostatni w tablicy)
                      latestStatuses[monitorId] = lastBeat.status;
                   }
                });
              }

              // Przechodzimy przez grupy i łączymy nazwy z naszym słownikiem statusów
              if (data.publicGroupList) {
                data.publicGroupList.forEach((group: any) => {
                  if (group.monitorList) {
                    group.monitorList.forEach((monitor: any) => {
                      const mId = monitor.id.toString();
                      
                      // Pobieramy status (w Kuma v2 bierzemy z heartbeats)
                      const currentStatus = latestStatuses[mId] !== undefined ? latestStatuses[mId] : monitor.status;
                      
                      // Statusy Uptime Kuma: 1 = UP, 0 = DOWN, 2 = PENDING, 3 = MAINTENANCE
                      if (currentStatus === 1) up++;
                      else if (currentStatus === 0 || currentStatus === 2) down++; // Pending i Down liczymy jako błąd
                      
                      // Zapisujemy na listę dla frontendu (tego rozwijanego widoku 3x3)
                      monitorList.push({
                        name: monitor.name,
                        status: currentStatus
                      });
                    });
                  }
                });
              }

              const total = up + down;

              unifiedStats = { 
                status: 'online', 
                primaryText: total > 0 ? `Monitory: ${total}` : 'Brak monitorów', 
                secondaryText: total === 0 ? 'Pusta strona statusu' : (down === 0 ? 'Wszystko działa' : 'Są awarie!'), 
                up: up,
                down: down,
                monitors: monitorList,
                latency 
              };
            } else {
              unifiedStats = { status: 'error', primaryText: 'Brak Strony Statusu', secondaryText: `Slug: '${slug}' nie istnieje`, latency };
            }
          } catch (e) {
             unifiedStats = { status: 'error', primaryText: 'Błąd Uptime Kuma', secondaryText: 'Nie można przetworzyć JSON', latency };
          }
        } else {
          unifiedStats = { status: 'error', primaryText: 'Błąd Usługi', secondaryText: `Kod ${pingRes.status}`, latency };
        }
      } catch (e) {
        unifiedStats = { status: 'error', primaryText: 'Brak połączenia', secondaryText: 'Sprawdź IP/Port Kumy' };
      }
    }

    // G) TAILSCALE
    else if (widgetType === 'tailscale') {
      try {
        if (!settings?.apiKey) {
           unifiedStats = { status: 'error', primaryText: 'Odmowa dostępu', secondaryText: 'Brak klucza API', latency: 0 };
        } else {
           const pingRes = await fetch(cleanUrl, { signal: AbortSignal.timeout(5000) });
           const latency = Date.now() - startTime;
           
           if (pingRes.ok || pingRes.status === 401) {
              unifiedStats = { status: 'online', primaryText: 'Host widoczny', secondaryText: 'Połączono', devices: 0, latency };
           } else {
              unifiedStats = { status: 'error', primaryText: 'Błąd Tailscale', secondaryText: `Kod ${pingRes.status}`, latency };
           }
        }
      } catch (e) {
        unifiedStats = { status: 'error', primaryText: 'Brak połączenia', secondaryText: 'Host nie odpowiada', latency: 0 };
      }
    }

    // H) VAULTWARDEN / BITWARDEN
    else if (widgetType === 'vaultwarden') {
      try {
        // Vaultwarden posiada endpoint /alive, który zwraca dzisiejszą datę (lub 200 OK), jeśli baza działa
        const pingRes = await fetch(`${cleanUrl}/alive`, { signal: AbortSignal.timeout(5000) });
        const latency = Date.now() - startTime;
        
        if (pingRes.ok) {
           unifiedStats = { status: 'online', primaryText: 'Zabezpieczony', secondaryText: 'Sejf aktywny', latency };
        } else {
           unifiedStats = { status: 'error', primaryText: 'Błąd Sejfu', secondaryText: `Kod ${pingRes.status}`, latency };
        }
      } catch (e) {
        unifiedStats = { status: 'error', primaryText: 'Brak połączenia', secondaryText: 'Sejf offline', latency: 0 };
      }
    }
    // I) GENERIC (Wszystkie inne, np. Vaultwarden, Blogi, Strony WWW)
    else {
      try {
        const pingRes = await fetch(cleanUrl, { signal: AbortSignal.timeout(5000) });
        const latency = Date.now() - startTime;
        
        if (pingRes.ok) {
           unifiedStats = { status: 'online', primaryText: 'Online', secondaryText: 'Usługa działa', latency };
        } else if (pingRes.status === 401 || pingRes.status === 403) {
           unifiedStats = { status: 'online', primaryText: 'Zabezpieczone', secondaryText: 'Wymaga logowania', latency };
        } else {
           unifiedStats = { status: 'error', primaryText: 'Błąd Usługi', secondaryText: `Kod: ${pingRes.status}`, latency };
        }
      } catch (e) {
        unifiedStats = { status: 'error', primaryText: 'Brak połączenia', secondaryText: 'Host offline', latency: 0 };
      }
    }

    // Wyrównawcze opóźnienie, aby frontend pokazał spinner jeśli api odpowiedziało podejrzanie szybko
    const elapsed = Date.now() - startTime;
    if (elapsed < 300) await new Promise(r => setTimeout(r, 300));

    return NextResponse.json(unifiedStats);

  } catch (error: any) {
    console.error("Błąd API Adaptera:", error.message);
    return NextResponse.json({ 
      status: 'error', 
      primaryText: 'Błąd Wewnętrzny',
      secondaryText: 'Spróbuj ponownie później',
      queries: 0,
      latency: 0
     }, { status: 500
    });
  }
}