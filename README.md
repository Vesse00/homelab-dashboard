# 🚀 HomeLab Dashboard

A modern, responsive, and highly customizable dashboard designed for centralized service management in your HomeLab. The project automates the service addition process through Docker integration and offers dedicated, intelligent widgets for the most popular self-hosted applications.

![HomeLab Dashboard Banner](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-blue?style=for-the-badge&logo=tailwind-css)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)
![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker)

## ✨ Key Features

* **🔍 Docker Autodiscovery:** The system automatically scans the local Docker socket and recognizes running containers. Using a built-in application map (`appMap.ts`), the dashboard assigns icons, colors, and ports, automatically detecting the server's IP address.
* **📊 Intelligent Widgets:**
    * **Uptime Kuma:** Dynamic monitor list, "system health" progress bar, multi-column support for wide tiles, and automatic overflow handling.
    * **AdGuard Home / Pi-hole:** Real-time blocking statistics and query overview.
    * **Nginx Proxy Manager:** Monitoring of active proxy hosts, redirections, and "dead" host status.
    * **Home Assistant:** Connection status for your smart home hub.
    * **Tailscale:** Overview of active nodes in your mesh network.
* **🧩 Interactive Grid:** Manage your layout with a drag-and-drop interface and easy resizing. Widgets intelligently adapt their view (e.g., a 3x3 expanded mode reveals more detailed data).
* **🚨 Advanced Status UI:** Tiles react to failures. In case of connection loss or authorization errors (401/403), the widget changes to an "emergency red" with a glow effect, immediately notifying you of the issue.
* **🔐 Security:** Authentication powered by NextAuth.js, with support for API Keys and Basic Auth for protected services.

## 🛠️ Tech Stack

* **Framework:** Next.js 16 (App Router)
* **Styling:** Tailwind CSS + Framer Motion (Animations)
* **Database:** SQLite + Prisma ORM
* **Communication:** Docker Engine API (via `/var/run/docker.sock`)
* **Icons:** Lucide React

## 🚀 Getting Started

### 1. Prerequisites
* Docker and Node.js (v18+) installed.
* The dashboard requires access to the Docker socket for the scanning feature to function correctly.

### 2. Installation & Setup
```bash
git clone https://github.com/Vesse00/homelab-dashboard.git
cd homelab-dashboard
npm install
```
>**Remember**:
Do it as a Root

## ⚙️ Environment Variables (.env)

To run the project correctly, create a `.env` file in the root directory and configure the following variables:

```env
# Path to the SQLite database (used by Prisma)
DATABASE_URL="file:./dev.db"

# Secret for NextAuth.js (required for session encryption)
# Generate one using: openssl rand -base64 32
NEXTAUTH_SECRET="twoj_bardzo_dlugi_i_unikalny_sekret"

# Your dashboard's URL
NEXTAUTH_URL="http://192.168.x.x:3003"

# SMTP Configuration (for password resets and notifications)
# If you use Gmail, use an "App Password", not your regular password.
SMTP_EMAIL="your-email@example.com"
SMTP_PASSWORD="your-smtp-app-password"

```
> Note on SMTP:
If you are using Gmail, you must enable 2-Factor Authentication and generate an App Password to use in the SMTP_PASSWORD field. Regular account passwords will not work.
## 📦 Supported Applications

The dashboard uses an intelligent mapping system (`appMap.ts`) that automatically recognizes containers based on image names. During a Docker scan, the system automatically selects the appropriate icon, color scheme, and advanced widget type.

### 🛡️ Network & Security
* **AdGuard Home / Pi-hole** (`widgetType: 'dns'`) –DNS query stats, blocked ads count, and percentage of blocked traffic.
* **Nginx Proxy Manager** (`widgetType: 'proxy'`) – Monitoring of active proxies, redirections, and dead hosts (404s).
* **Tailscale** (`widgetType: 'tailscale'`) – Mesh network connection status and active node count.
* **Vaultwarden** (`widgetType: 'generic'`) – Secure access to your password manager.

### 🏠 Home Automation
* **Home Assistant** (`widgetType: 'home-assistant'`) – Hub activity status and smart home integration. Requires a Long-lived Access Token.

### 🎬 Media & Entertainment
* **Jellyfin / Plex** (`widgetType: 'media'`) – Active session monitoring (who is watching) and server load.
* **Sonarr / Radarr / Lidarr / Readarr** (`widgetType: 'generic'`) – Media library and download monitoring.
* **Minecraft Server** (`widgetType: 'minecraft'`) – Server status, online player count, and game version.

### 📊 Monitoring & Tools
* **Uptime Kuma** (`widgetType: 'uptime-kuma'`) – **Advanced Widget:**
    * Monitors list fetched directly from status pages.
    * Service health indicated via progress bars.
    * Dynamic scaling: 3x3 view displays monitors in two columns.
* **Portainer** (`widgetType: 'admin'`) – Quick overview of running vs. stopped containers.
* **Grafana / Prometheus** (`widgetType: 'generic'`) – Easy access to analytical panels.

---

> **Developer Tip:** > The list of supported images is constantly being expanded in `src/app/lib/appMap.ts`. You can easily add your own images by assigning them default ports and colors.

## 🚨 Status & Error System

Each widget features standardized error handling logic:
1.  **Online Mode:** The widget displays its assigned application color (e.g., blue for HA, red for Pi-hole).
2.  **Auth Error:** If an API key is incorrect or expired, the tile turns **emergency red** with an "Access Denied" label.
3.  **Host Offline:** If a container is stopped or the IP is unreachable, the tile turns red, indicating a connection failure.

## 🤝 Contributing
Thank you for your interest! Please note:
* **Bug Reports & Feature Requests:** Please use the Issues tab.
* **Code Contributions:** Currently, **I am NOT accepting Pull Requests** to maintain strict quality control and vision for this project.
* **Discussions:** Feel free to join our Discussions to share your setup!

## ☕ Support the Project
If this dashboard made your HomeLab life easier, consider supporting its development. Your support helps cover infrastructure costs and fuels late-night coding sessions!
👉 [Become a GitHub Sponsor](https://github.com/sponsors/Vesse00)

**🏆 Awesome Sponsors**
* (Your name could be here!)
