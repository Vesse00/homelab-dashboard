// Rozszerzony interfejs o nasze nowe typy widgetów
export interface AppDefinition {
  name: string;
  icon: string;
  port: number;
  color: string;
  widgetType: 'generic' | 'minecraft' | 'pihole' | 'dns' | 'media' | 'admin' | 'proxy' | 'home-assistant' | 'uptime-kuma' | 'tailscale' | 'vaultwarden';
  template?: string; // Zostawiamy dla kompatybilności wstecznej
  category?: string;
}

export const KNOWN_APPS: Record<string, AppDefinition> = {
  // --- SMART HOME ---
  'homeassistant/home-assistant': { name: 'Home Assistant', icon: 'Home', port: 8123, color: 'blue', widgetType: 'home-assistant', template: 'home-assistant', category: 'smarthome' },
  'ghcr.io/home-assistant/home-assistant': { name: 'Home Assistant', icon: 'Home', port: 8123, color: 'blue', widgetType: 'home-assistant', template: 'home-assistant', category: 'smarthome' },
  
  // --- MEDIA ---
  'linuxserver/plex': { name: 'Plex', icon: 'PlaySquare', port: 32400, color: 'amber', widgetType: 'media', template: 'media', category: 'media' },
  'plexinc/pms-docker': { name: 'Plex', icon: 'PlaySquare', port: 32400, color: 'amber', widgetType: 'media', template: 'media', category: 'media' },
  'linuxserver/jellyfin': { name: 'Jellyfin', icon: 'PlayCircle', port: 8096, color: 'purple', widgetType: 'media', template: 'media', category: 'media' },
  'jellyfin/jellyfin': { name: 'Jellyfin', icon: 'PlayCircle', port: 8096, color: 'purple', widgetType: 'media', template: 'media', category: 'media' },
  
  // --- *ARR STACK ---
  'linuxserver/sonarr': { name: 'Sonarr', icon: 'Tv', port: 8989, color: 'cyan', widgetType: 'generic', template: 'default', category: 'media' },
  'linuxserver/radarr': { name: 'Radarr', icon: 'Film', port: 7878, color: 'yellow', widgetType: 'generic', template: 'default', category: 'media' },
  'linuxserver/lidarr': { name: 'Lidarr', icon: 'Music', port: 8686, color: 'emerald', widgetType: 'generic', template: 'default', category: 'media' },
  'linuxserver/readarr': { name: 'Readarr', icon: 'Book', port: 8787, color: 'red', widgetType: 'generic', template: 'default', category: 'media' },
  
  // --- SIECI I PROXY ---
  'jc21/nginx-proxy-manager': { name: 'Nginx Proxy Manager', icon: 'Globe', port: 81, color: 'emerald', widgetType: 'proxy', template: 'proxy', category: 'network' },
  'pihole/pihole': { name: 'Pi-hole', icon: 'ShieldCheck', port: 80, color: 'red', widgetType: 'dns', template: 'dns', category: 'network' },
  'adguard/adguardhome': { name: 'AdGuard Home', icon: 'Shield', port: 80, color: 'emerald', widgetType: 'dns', template: 'dns', category: 'network' },
  'tailscale/tailscale': { name: 'Tailscale', icon: 'Network', port: 8080, color: 'slate', widgetType: 'tailscale', template: 'tailscale', category: 'network' },
  
  // --- ZARZĄDZANIE I MONITORING ---
  'portainer/portainer-ce': { name: 'Portainer', icon: 'Box', port: 9000, color: 'blue', widgetType: 'admin', template: 'admin', category: 'admin' },
  'louislam/uptime-kuma': { name: 'Uptime Kuma', icon: 'Activity', port: 3001, color: 'emerald', widgetType: 'uptime-kuma', template: 'uptime-kuma', category: 'monitoring' },
  'grafana/grafana': { name: 'Grafana', icon: 'PieChart', port: 3000, color: 'orange', widgetType: 'generic', template: 'default', category: 'monitoring' },
  'prom/prometheus': { name: 'Prometheus', icon: 'Flame', port: 9090, color: 'red', widgetType: 'generic', template: 'default', category: 'monitoring' },
  
  // --- CHMURA ---
  'linuxserver/nextcloud': { name: 'Nextcloud', icon: 'Cloud', port: 443, color: 'blue', widgetType: 'generic', template: 'default', category: 'cloud' },
  'nextcloud': { name: 'Nextcloud', icon: 'Cloud', port: 80, color: 'blue', widgetType: 'generic', template: 'default', category: 'cloud' },

  // --- BEZPIECZEŃSTWO I ZARZĄDZANIE HASŁAMI ---
  'vaultwarden/server': { name: 'Vaultwarden', icon: 'Key', port: 80, color: 'blue', widgetType: 'vaultwarden', template: 'default', category: 'security' },
  'bitwardenrs/server': { name: 'Vaultwarden', icon: 'Key', port: 80, color: 'blue', widgetType: 'vaultwarden', template: 'default', category: 'security' },
  
  // --- GRY ---
  'itzg/minecraft-server': { name: 'Minecraft', icon: 'Gamepad2', port: 25565, color: 'emerald', widgetType: 'minecraft', template: 'minecraft', category: 'games' },
};