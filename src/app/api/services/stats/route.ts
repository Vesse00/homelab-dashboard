import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { decrypt } from '@/app/lib/encryption';
import { checkDualAuth } from '@/app/lib/auth';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

export async function POST(req: Request) {
  const isAuthenticated = await checkDualAuth(req);
  if (!isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { appName, url, widgetType, settings } = body;

    if (!url) {
      return NextResponse.json({ error: 'Brak adresu URL' }, { status: 400 });
    }

    if (settings) {
      if (settings.apiKey) settings.apiKey = decrypt(settings.apiKey);
      if (settings.password) settings.password = decrypt(settings.password);
    }

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
      primaryText: 'API_ERROR_NO_DATA', 
      secondaryText: 'API_ERROR_CONFIG',      
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

    // A) PI-HOLE / ADGUARD
    if (widgetType === 'dns' || widgetType === 'pihole') {
      if (appName.toLowerCase().includes('adguard')) {
        const res = await fetch(`${cleanUrl}/control/stats`, { headers, signal: AbortSignal.timeout(5000) });
        const latency = Date.now() - startTime;
        if (res.ok) {
          const data = await res.json();
          const totalBlocked = data.blocked_filtering ? data.blocked_filtering.reduce((a: number, b: number) => a + b, 0) : 0;
          const totalQueries = data.dns_queries ? data.dns_queries.reduce((a: number, b: number) => a + b, 0) : 0;
          const percentage = totalQueries > 0 ? ((totalBlocked / totalQueries) * 100).toFixed(1) : '0';
          const processingMs = data.avg_processing_time ? Math.round(data.avg_processing_time * 1000) : undefined;
          
          unifiedStats = { 
            status: 'online',
            primaryText: `API_STATS_BLOCKED|${totalBlocked}`,
            secondaryText: `API_STATS_TRAFFIC|${percentage}`,
            queries: totalQueries,
            latency, chartData: [],
            processingTime: processingMs
          };
        } else {
          unifiedStats = { status: 'error', primaryText: 'API_ERROR_AUTH', secondaryText: `Błąd ${res.status}` };
        }
      } else {
        const apiToken = settings?.apiKey ? `&auth=${settings.apiKey}` : '';
        const res = await fetch(`${cleanUrl}/admin/api.php?summaryRaw${apiToken}`, { signal: AbortSignal.timeout(5000) });
        const latency = Date.now() - startTime;
        if (res.ok) {
          const data = await res.json();
          unifiedStats = { 
            status: data.status === 'enabled' ? 'online' : 'offline', 
            primaryText: `API_STATS_BLOCKED|${data.ads_blocked_today}`, 
            secondaryText: `API_STATS_TRAFFIC|${data.ads_percentage_today.toFixed(1)}`, 
            queries: data.dns_queries_today, 
            latency 
          };
        } else {
          unifiedStats = { status: 'error', primaryText: 'API_ERROR_UNAUTHORIZED', secondaryText: 'API_ERROR_KEY_URL' };
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
              return NextResponse.json({ status: 'error', primaryText: 'API_ERROR_AUTH', secondaryText: `Błąd ${authRes.status}`, latency: Date.now() - startTime });
            }
          }

          const endpointsRes = await fetch(`${cleanUrl}/api/endpoints`, { headers: apiHeaders, signal: AbortSignal.timeout(5000) });
          if (!endpointsRes.ok) throw new Error("Brak środowisk");
          const endpoints = await endpointsRes.json();
          const endpointId = endpoints[0].Id;

          const res = await fetch(`${cleanUrl}/api/endpoints/${endpointId}/docker/containers/json?all=1`, { headers: apiHeaders, signal: AbortSignal.timeout(5000) });
          if (res.ok) {
            const containers = await res.json();
            const running = containers.filter((c: any) => c.State === 'running').length;
            const stopped = containers.filter((c: any) => c.State !== 'running').length;
            unifiedStats = { 
              status: 'online',
              primaryText: `API_STATS_RUNNING|${running}`,
              secondaryText: `API_STATS_STOPPED|${stopped}`,
              containers: {total: containers.length, running, stopped} };
          } else {
            unifiedStats = { status: 'error', primaryText: 'API_ERROR_UNAUTHORIZED', secondaryText: `Błąd ${res.status}` };
          }
        } catch (e: any) {
          unifiedStats = { status: 'error', primaryText: 'API_ERROR_CONNECTION', secondaryText: 'API_ERROR_GENERIC' };
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
            unifiedStats = { 
              status: 'online', 
              primaryText: activeStreams > 0 ? `API_STATS_STREAMS|${activeStreams}` : 'API_STATS_NO_STREAMS', 
              secondaryText: activeStreams > 0 ? 'API_STATS_SERVER_BUSY' : 'API_STATS_SERVER_IDLE', 
              latency, 
              queries: activeStreams 
            };
          } else {
            unifiedStats = { status: 'error', primaryText: 'API_ERROR_UNAUTHORIZED', secondaryText: 'API_ERROR_KEY_URL' };
          }
        } catch (e) {
          unifiedStats = { status: 'error', primaryText: 'API_ERROR_CONNECTION', secondaryText: 'API_ERROR_SERVICE' };
        }
      } else if (appName.toLowerCase().includes('jellyfin')) {
        const jHeaders: Record<string, string> = {};
        if (settings?.apiKey) jHeaders['Authorization'] = `MediaBrowser Token="${settings.apiKey}"`;
        try {
          const [sessionsRes, countsRes] = await Promise.all([
             fetch(`${cleanUrl}/Sessions`, { headers: jHeaders, signal: AbortSignal.timeout(5000) }),
             fetch(`${cleanUrl}/Items/Counts`, { headers: jHeaders, signal: AbortSignal.timeout(5000) }).catch(() => null)
          ]);
          const latency = Date.now() - startTime;
          
          if (sessionsRes.ok) {
            const sessions = await sessionsRes.json();
            const activeStreams = sessions.filter((s: any) => s.NowPlayingItem).length;
            let counts = { MovieCount: 0, SeriesCount: 0, EpisodeCount: 0 };
            if (countsRes && countsRes.ok) counts = await countsRes.json();

            unifiedStats = { 
               status: 'online', 
               primaryText: activeStreams > 0 ? `API_STATS_WATCHING|${activeStreams}` : 'API_STATS_NO_STREAMS', 
               secondaryText: 'API_STATS_JELLYFIN_ACTIVE', 
               latency, 
               queries: activeStreams,
               mediaCounts: counts 
            };
          } else {
            unifiedStats = { status: 'error', primaryText: 'API_ERROR_UNAUTHORIZED', secondaryText: 'API_ERROR_KEY_URL' };
          }
        } catch (e) {
          unifiedStats = { status: 'error', primaryText: 'API_ERROR_CONNECTION', secondaryText: 'API_ERROR_SERVICE' };
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
            else return NextResponse.json({ status: 'error', primaryText: 'API_ERROR_AUTH', secondaryText: 'API_ERROR_CONFIG', latency: Date.now() - startTime });
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
            unifiedStats = { 
              status: 'online', 
              primaryText: `API_STATS_PROXY_COUNT|${enabledProxy}`, 
              secondaryText: `API_STATS_HOSTS_COUNT|${totalHosts}`, 
              latency, queries: totalHosts, chartData: [
                { label: 'Proxy', count: proxyHosts.length, active: enabledProxy, color: 'bg-emerald-500' },
                { label: 'Przekierowania', count: redirHosts.length, active: redirHosts.filter((h: any) => h.enabled).length, color: 'bg-blue-500' },
                { label: 'Strony 404', count: deadHosts.length, active: deadHosts.filter((h: any) => h.enabled).length, color: 'bg-red-500' }
            ]};
          } else {
            unifiedStats = { status: 'error', primaryText: 'API_ERROR_UNAUTHORIZED', secondaryText: 'API_ERROR_NO_PERMISSIONS' };
          }
        } catch (e) {
          unifiedStats = { status: 'error', primaryText: 'API_ERROR_CONNECTION', secondaryText: 'API_ERROR_NOT_RESPONDING' };
        }
      }
    }

    // E) HOME ASSISTANT
    else if (widgetType === 'home-assistant') {
      try {
        if (!settings?.apiKey) {
           unifiedStats = { status: 'error', primaryText: 'API_ERROR_UNAUTHORIZED', secondaryText: 'API_ERROR_TOKEN', latency: 0 };
        } else {
           const apiHeaders: Record<string, string> = { 'Authorization': `Bearer ${settings.apiKey}` };
           const res = await fetch(`${cleanUrl}/api/`, { headers: apiHeaders, signal: AbortSignal.timeout(5000) });
           const latency = Date.now() - startTime;
           
           if (res.ok) {
              const statesRes = await fetch(`${cleanUrl}/api/states`, { headers: apiHeaders, signal: AbortSignal.timeout(5000) });
              let entities = { total: 0, on: 0, off: 0, unavailable: 0 };
              
              if (statesRes.ok) {
                 const statesData = await statesRes.json();
                 const relevant = statesData.filter((s: any) => 
                    s.entity_id.startsWith('light.') || 
                    s.entity_id.startsWith('switch.') || 
                    s.entity_id.startsWith('binary_sensor.')
                 );
                 
                 entities.total = relevant.length;
                 entities.on = relevant.filter((s: any) => s.state === 'on').length;
                 entities.off = relevant.filter((s: any) => s.state === 'off').length;
                 entities.unavailable = relevant.filter((s: any) => s.state === 'unavailable' || s.state === 'unknown').length;
              }

              unifiedStats = { 
                status: 'online', 
                primaryText: 'API_STATS_HUB_ACTIVE', 
                secondaryText: 'API_STATS_LOGGED_IN', 
                entities: entities,
                latency 
              };
           } else if (res.status === 401) {
              unifiedStats = { status: 'error', primaryText: 'API_ERROR_UNAUTHORIZED', secondaryText: 'API_ERROR_TOKEN', latency };
           } else {
              unifiedStats = { status: 'error', primaryText: 'API_ERROR_HUB', secondaryText: `Błąd ${res.status}`, latency };
           }
        }
      } catch (e) {
        unifiedStats = { status: 'error', primaryText: 'API_ERROR_CONNECTION', secondaryText: 'API_ERROR_CONFIG', latency: 0 };
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
              const latestStatuses: Record<string, number> = {};
              
              if (heartbeats.heartbeatList) {
                Object.entries(heartbeats.heartbeatList).forEach(([monitorId, beats]: [string, any]) => {
                   if (Array.isArray(beats) && beats.length > 0) {
                      const lastBeat = beats[beats.length - 1]; 
                      latestStatuses[monitorId] = lastBeat.status;
                   }
                });
              }

              if (data.publicGroupList) {
                data.publicGroupList.forEach((group: any) => {
                  if (group.monitorList) {
                    group.monitorList.forEach((monitor: any) => {
                      const mId = monitor.id.toString();
                      const currentStatus = latestStatuses[mId] !== undefined ? latestStatuses[mId] : monitor.status;
                      if (currentStatus === 1) up++;
                      else if (currentStatus === 0 || currentStatus === 2) down++;
                      
                      monitorList.push({ name: monitor.name, status: currentStatus });
                    });
                  }
                });
              }

              const total = up + down;
              unifiedStats = { 
                status: 'online', 
                primaryText: total > 0 ? `API_STATS_MONITORS|${total}` : 'API_STATS_NO_MONITORS', 
                secondaryText: total === 0 ? 'API_STATS_EMPTY_PAGE' : (down === 0 ? 'API_STATS_ALL_OK' : 'API_STATS_PARTIAL_OUTAGE'), 
                up, down, monitors: monitorList, latency 
              };
            } else {
              unifiedStats = { status: 'error', primaryText: 'API_ERROR_NO_DATA', secondaryText: 'API_ERROR_SLUG', latency };
            }
          } catch (e) {
             unifiedStats = { status: 'error', primaryText: 'API_ERROR_SERVICE', secondaryText: 'API_ERROR_JSON', latency };
          }
        } else {
          unifiedStats = { status: 'error', primaryText: 'API_ERROR_SERVICE', secondaryText: `Błąd ${pingRes.status}`, latency };
        }
      } catch (e) {
        unifiedStats = { status: 'error', primaryText: 'API_ERROR_CONNECTION', secondaryText: 'API_ERROR_LOGS' };
      }
    }

    // G) TAILSCALE
    else if (widgetType === 'tailscale') {
      try {
        if (!settings?.apiKey || !settings?.tailnet) {
           unifiedStats = { status: 'error', primaryText: 'API_ERROR_UNAUTHORIZED', secondaryText: 'API_ERROR_KEYS', latency: 0 };
        } else {
           const targetUrl = `https://api.tailscale.com/api/v2/tailnet/${settings.tailnet}/devices`;
           const authHeader = `Basic ${Buffer.from(`${settings.apiKey}:`).toString('base64')}`;
           const res = await fetch(targetUrl, { headers: { 'Authorization': authHeader }, signal: AbortSignal.timeout(5000) });
           const latency = Date.now() - startTime;
           
           if (res.ok) {
              const data = await res.json();
              const devicesCount = data.devices ? data.devices.length : 0;
              unifiedStats = { status: 'online', primaryText: 'API_STATS_CONNECTED', secondaryText: 'API_STATS_API_ACTIVE', devices: devicesCount, latency };
           } else if (res.status === 401 || res.status === 403) {
              unifiedStats = { status: 'error', primaryText: 'API_ERROR_AUTH', secondaryText: 'API_ERROR_KEY_URL', latency };
           } else {
              unifiedStats = { status: 'error', primaryText: 'API_ERROR_CLOUD', secondaryText: `Błąd ${res.status}`, latency };
           }
        }
      } catch (e) {
        unifiedStats = { status: 'error', primaryText: 'API_ERROR_CONNECTION', secondaryText: 'API_ERROR_LOGS', latency: 0 };
      }
    }

    // H) VAULTWARDEN
    else if (widgetType === 'vaultwarden') {
      try {
        const pingRes = await fetch(`${cleanUrl}/alive`, { signal: AbortSignal.timeout(5000) });
        const latency = Date.now() - startTime;
        if (pingRes.ok) {
           unifiedStats = { status: 'online', primaryText: 'API_STATS_SECURE', secondaryText: 'API_STATS_VAULT_ACTIVE', latency };
        } else {
           unifiedStats = { status: 'error', primaryText: 'API_ERROR_VAULT', secondaryText: `Błąd ${pingRes.status}`, latency };
        }
      } catch (e) {
        unifiedStats = { status: 'error', primaryText: 'API_ERROR_CONNECTION', secondaryText: 'API_ERROR_OFFLINE', latency: 0 };
      }
    }
    // I) GENERIC
    else {
      try {
        const pingRes = await fetch(cleanUrl, { signal: AbortSignal.timeout(5000) });
        const latency = Date.now() - startTime;
        if (pingRes.ok) {
           unifiedStats = { status: 'online', primaryText: 'API_STATS_ONLINE', secondaryText: 'API_STATS_SERVICE_RUNNING', latency };
        } else if (pingRes.status === 401 || pingRes.status === 403) {
           unifiedStats = { status: 'online', primaryText: 'API_STATS_SECURED_LOGIN', secondaryText: 'API_ERROR_UNAUTHORIZED', latency };
        } else {
           unifiedStats = { status: 'error', primaryText: 'API_ERROR_SERVICE', secondaryText: `Błąd ${pingRes.status}`, latency };
        }
      } catch (e) {
        unifiedStats = { status: 'error', primaryText: 'API_ERROR_CONNECTION', secondaryText: 'API_ERROR_OFFLINE', latency: 0 };
      }
    }

    const elapsed = Date.now() - startTime;
    if (elapsed < 300) await new Promise(r => setTimeout(r, 300));

    return NextResponse.json(unifiedStats);

  } catch (error: any) {
    console.error("Błąd API Adaptera:", error.message);
    return NextResponse.json({ 
      status: 'error', 
      primaryText: 'API_ERROR_GENERIC',
      secondaryText: 'API_ERROR_LOGS',
      queries: 0,
      latency: 0
     }, { status: 500
    });
  }
}