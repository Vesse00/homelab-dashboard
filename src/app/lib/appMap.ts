export interface AppDefinition {
  name: string;
  icon: string; // Nazwa ikony z Lucide-React
  port: number;
  color: string;
}

// Klucz to fragment nazwy obrazu Dockera (np. "plex" pasuje do "linuxserver/plex")
export const KNOWN_APPS: Record<string, AppDefinition> = {
  'plex': { name: 'Plex', icon: 'Play', port: 32400, color: 'orange' },
  'pihole': { name: 'Pi-hole', icon: 'Shield', port: 80, color: 'red' },
  'adguard': { name: 'AdGuard', icon: 'ShieldCheck', port: 80, color: 'green' },
  'homeassistant': { name: 'Home Assistant', icon: 'Home', port: 8123, color: 'sky' },
  'portainer': { name: 'Portainer', icon: 'Box', port: 9000, color: 'blue' },
  'nginx': { name: 'Web Server', icon: 'Globe', port: 80, color: 'emerald' },
  'mysql': { name: 'MySQL DB', icon: 'Database', port: 3306, color: 'slate' },
  'postgres': { name: 'PostgreSQL', icon: 'Database', port: 5432, color: 'blue' },
  'minecraft': { name: 'Minecraft', icon: 'Gamepad2', port: 25565, color: 'green' },
  'jellyfin': { name: 'Jellyfin', icon: 'Clapperboard', port: 8096, color: 'purple' },
};