// src/app/lib/appMap.ts

export interface AppDefinition {
  name: string;
  icon: string;
  port: number;
  color: string;
  // Dodajemy nowe typy do definicji
  widgetType: 'generic' | 'minecraft' | 'pihole' | 'media' | 'admin' | 'proxy';
}

export const KNOWN_APPS: Record<string, AppDefinition> = {
  // --- MEDIA ---
  'plex': { name: 'Plex', icon: 'Play', port: 32400, color: 'orange', widgetType: 'media' },
  'jellyfin': { name: 'Jellyfin', icon: 'Clapperboard', port: 8096, color: 'purple', widgetType: 'media' },
  
  // --- ADMIN ---
  'portainer': { name: 'Portainer', icon: 'Box', port: 9000, color: 'blue', widgetType: 'admin' }, // <--- ZMIANA
  'dockge': { name: 'Dockge', icon: 'Box', port: 5001, color: 'emerald', widgetType: 'admin' },

  // --- PROXY / NETWORK ---
  'nginx': { name: 'Nginx Proxy', icon: 'Globe', port: 81, color: 'emerald', widgetType: 'proxy' }, // <--- ZMIANA (port 81 to zazwyczaj admin panel NPM)
  'traefik': { name: 'Traefik', icon: 'Route', port: 8080, color: 'sky', widgetType: 'proxy' },

  // --- BLOCKERS ---
  'pihole': { name: 'Pi-hole', icon: 'Shield', port: 80, color: 'red', widgetType: 'pihole' },
  'adguard': { name: 'AdGuard', icon: 'ShieldCheck', port: 80, color: 'green', widgetType: 'pihole' }, // Używamy szablonu Pihole (tarcza)
  
  // --- GAMES ---
  'minecraft': { name: 'Minecraft Server', icon: 'Gamepad2', port: 25565, color: 'green', widgetType: 'minecraft' },
  
  // --- GENERIC ---
  'mysql': { name: 'MySQL', icon: 'Database', port: 3306, color: 'slate', widgetType: 'generic' },
  'postgres': { name: 'PostgreSQL', icon: 'Database', port: 5432, color: 'blue', widgetType: 'generic' },
};