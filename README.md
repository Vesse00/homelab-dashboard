# 🚀 HomeLab Dashboard

A modern, responsive, and highly secure dashboard designed for centralized service management in your HomeLab. It automates service discovery through Docker integration, features a robust multi-user role system, and offers dedicated, intelligent widgets for your favorite self-hosted applications.

![HomeLab Dashboard Banner](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-blue?style=for-the-badge&logo=tailwind-css)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)
![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker)

## ✨ What Makes It Special?

* **🔒 Enterprise-Grade Security & Identity:** Log in seamlessly with **GitHub OAuth** or use standard credentials. Secure your Admin account with **Two-Factor Authentication (2FA/TOTP)**.
* **👥 Role-Based Access Control (RBAC):** Built for the whole family. The first user becomes the `ADMIN`, while others get `USER` roles. Guests get a **Read-Only** view, hiding sensitive UI elements, container controls, and the root terminal.
* **🔑 Global Secrets Manager:** Say goodbye to pasting API keys into every single widget. Configure your services (Proxmox, Pi-hole, etc.) once in the Admin Panel. Keys are locked down with **AES-256 encryption** in the database, ensuring regular users can add widgets "out-of-the-box" without ever seeing the raw tokens.
* **🔍 Dynamic Docker Autodiscovery:** The dashboard actively scans your local Docker socket. Using a built-in map, it instantly recognizes running containers, assigning them the correct icons, brand colors, and ports automatically.
* **💻 Built-in Terminal & Docker Control:** Manage your server straight from the browser. Start, stop, and restart containers, view live logs, or open a full-featured WebSocket terminal to execute commands directly on the host.
* **📊 Intelligent, Reactive Widgets:** Custom-built tiles with live data. When a service goes down, the widget turns an "emergency red" to alert you immediately.
* **🧩 Interactive Drag & Drop Grid:** Fully customize your layout. Widgets intelligently adapt their UI based on their size (e.g., expanding a widget to 3x3 reveals deeper statistics). Layouts are saved per-user.

## 🛠️ Tech Stack

* **Frontend:** Next.js 16 (App Router), Tailwind CSS, Framer Motion, next-intl
* **Backend:** Next.js API Routes, Prisma ORM, SQLite
* **Security:** NextAuth.js, bcryptjs, otpauth, AES-256 Encryption
* **Infrastructure:** Docker Engine API (via socket), WebSockets (Xterm.js)

## 🚀 Getting Started

### 1. Prerequisites
* **Node.js** (v18+) and **npm**.
* **Docker** installed and running (The dashboard needs access to the Docker socket for autodiscovery and container management).

### 2. Installation & Setup

```bash
# 1. Clone the repository
git clone https://github.com/Vesse00/homelab-dashboard.git
cd homelab-dashboard

# 2. Install dependencies
npm install

# 3. Apply database migrations
npx prisma migrate dev

# 4. Start the application 
# (The built-in 'concurrently' script starts both Next.js and the WS Terminal server)
npm run dev
```

## ⚙️ Environment Variables (.env)

Create a `.env` file in the root of your project. To use the advanced security features, configure the following variables:

```env
# Database connection (Prisma - SQLite)
DATABASE_URL="file:./dev.db"

# NextAuth secret - generate a strong random string
# (e.g., using: openssl rand -base64 32)
NEXTAUTH_SECRET="your_very_long_and_unique_secret"

# The URL of your dashboard (Required by NextAuth)
NEXTAUTH_URL="http://192.168.x.x:3003"

# AES-256 ENCRYPTION KEY - MUST BE EXACTLY 32 CHARACTERS!
# Used to encrypt and decrypt API keys in the SQLite database.
ENCRYPTION_KEY="your-secret-32-character-key-here"

# GITHUB OAUTH (Optional, for GitHub Login)
GITHUB_ID="your_github_client_id"
GITHUB_SECRET="your_github_client_secret"

# SMTP Configuration (For password resets)
# If using Gmail, you MUST use a generated "App Password"
SMTP_EMAIL="your-email@example.com"
SMTP_PASSWORD="your-app-password"
```

## 📦 Supported Applications

The dashboard uses an intelligent mapping system (`appMap.ts`) that automatically recognizes containers based on image names. Thanks to the **Global Secrets Manager**, Admins configure the service credentials once, and widgets instantly come to life for any user who adds them.

### 🛡️ Network & Security
* **AdGuard Home / Pi-hole** (`widgetType: 'dns'`) – Real-time DNS query stats, blocked ads counter, and block percentage.
* **Nginx Proxy Manager** (`widgetType: 'proxy'`) – Active proxy hosts monitoring, redirects, and detection of dead 404/502 hosts.
* **Tailscale** (`widgetType: 'tailscale'`) – Overview of active nodes in your mesh network.
* **Vaultwarden** (`widgetType: 'vaultwarden'`) – Simple status and uptime check for your password manager.

### 📊 Monitoring & Data
* **Uptime Kuma** (`widgetType: 'uptime'`) – Dynamic monitor lists with an aggregated "system health" progress bar.
* **Grafana** – Direct link to your metric dashboards.
* **Prometheus** – Base metrics collector status.

### 🏠 Smart Home & Media
* **Home Assistant** (`widgetType: 'homeassistant'`) – Connection status for your smart home hub.
* **Jellyfin / Plex / Emby** – Quick access to your media servers.
* **Minecraft Server** (`widgetType: 'minecraft'`) – Server status and active players (if integrated).

*... And a constantly growing list of integrations!*

## 🤝 Contributing
Found a bug or have an idea for a killer new widget? Open an *Issue* using our GitHub templates, or check out `CONTRIBUTING.md` and submit a Pull Request!

## ☕ Support the Project
Developing and maintaining this dashboard takes a lot of time and coffee! If you find it useful for your homelab, please consider:
* ⭐ **Starring this repository** on GitHub (it helps a lot!)
* 🐛 Reporting bugs and suggesting features to make it even better.
* ☕ [Sponsoring the project or buying me a coffee](https://github.com/Vesse00) if you'd like to support future development.

## 📜 License
This project is built with a passion for Homelabbing and Self-Hosted environments. Please refer to the `LICENSE` file for usage and modification rights.
