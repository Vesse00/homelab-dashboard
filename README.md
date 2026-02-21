# 🚀 HomeLab Dashboard

Nowoczesny, responsywny i wysoce konfigurowalny dashboard przeznaczony do centralnego zarządzania usługami w domowym laboratorium (HomeLab). Projekt automatyzuje proces dodawania usług dzięki integracji z Dockerem i oferuje dedykowane, inteligentne widgety dla najpopularniejszych aplikacji.

![HomeLab Dashboard Banner](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0-blue?style=for-the-badge&logo=tailwind-css)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)
![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker)

## ✨ Główne Funkcje

* **🔍 Autodiscovery (Docker Scan):** System automatycznie skanuje lokalny socket Dockera i rozpoznaje kontenery. Dzięki wbudowanej mapie aplikacji (`appMap.ts`), dashboard sam przypisuje ikony, kolory i porty, automatycznie wykrywając adres IP serwera.
* **📊 Inteligentne Widgety:**
    * **Uptime Kuma:** Dynamiczna lista monitorów, wskaźnik "zdrowia" systemu (procentowy pasek), obsługa wielu kolumn przy szerokich kafelkach i automatyczne ukrywanie nadmiaru monitorów.
    * **AdGuard Home / Pi-hole:** Podgląd statystyk blokowania w czasie rzeczywistym.
    * **Nginx Proxy Manager:** Monitoring aktywnych hostów proxy i przekierowań.
    * **Home Assistant:** Status połączenia z Twoim hubem smart home.
    * **Tailscale:** Podgląd aktywnych węzłów w sieci mesh.
* **🧩 Interaktywny Grid:** Zarządzanie układem kafelków za pomocą przeciągania (Drag & Drop) i zmiany rozmiaru. Widgety inteligentnie adaptują swój wygląd (np. tryb rozszerzony 3x3 ujawnia więcej danych).
* **🚨 Zaawansowany UI Statusu:** Kafelki reagują na awarie. W przypadku braku połączenia lub błędu autoryzacji (401/403), widget zmienia kolor na alarmową czerwień z poświatą, informując o problemie.
* **🔐 Bezpieczeństwo:** System logowania oparty na NextAuth.js, wsparcie dla API Key oraz Basic Auth dla zabezpieczonych usług.

## 🛠️ Stack Technologiczny

* **Framework:** Next.js 15 (App Router)
* **Stylizacja:** Tailwind CSS + Framer Motion (animacje)
* **Baza Danych:** SQLite + Prisma ORM
* **Komunikacja:** Docker Engine API (przez `/var/run/docker.sock`)
* **Ikony:** Lucide React

## 🚀 Instalacja i Uruchomienie

### 1. Wymagania
* Zainstalowany Docker oraz Node.js (v18+).
* Dashboard wymaga dostępu do socketu Dockera, aby funkcja skanowania działała poprawnie.

### 2. Klonowanie i konfiguracja
```bash
git clone [https://github.com/twoj-username/homelab-dashboard.git](https://github.com/twoj-username/homelab-dashboard.git)
cd homelab-dashboard
npm install
```
## ⚙️ Zmienne środowiskowe (.env)

Aby projekt działał poprawnie, należy utworzyć plik `.env` w głównym katalogu aplikacji i skonfigurować następujące zmienne:

```env
# Ścieżka do bazy danych SQLite (używana przez Prismę)
DATABASE_URL="file:./prisma/dev.db"

# Sekret dla NextAuth.js (wymagany do szyfrowania sesji)
# Wygeneruj go komendą: openssl rand -base64 32
NEXTAUTH_SECRET="twoj_bardzo_dlugi_i_unikalny_sekret"

# Publiczny adres URL Twojego dashboardu
NEXTAUTH_URL="[http://192.168.1.63:3000](http://192.168.1.63:3000)"

# [WAŻNE] Adres IP Twojego serwera HomeLab
# Służy jako fallback dla skanera Docker, aby kafelki nie otrzymywały adresu 'localhost'
HOST_IP=192.168.1.63
```
## 📦 Wspierane aplikacje

Dashboard wykorzystuje inteligentny system mapowania aplikacji (`appMap.ts`), który automatycznie rozpoznaje kontenery na podstawie nazwy obrazu. Dzięki temu przy skanowaniu Docker'a system sam dobiera odpowiednią ikonę, kolorystykę oraz zaawansowany typ widgetu.

### 🛡️ Sieć i Bezpieczeństwo
* **AdGuard Home / Pi-hole** (`widgetType: 'dns'`) – Statystyki zapytań DNS, liczba zablokowanych reklam i procentowy udział blokowanego ruchu.
* **Nginx Proxy Manager** (`widgetType: 'proxy'`) – Monitoring aktywnych hostów proxy, przekierowań oraz stan hostów typu "dead" (404).
* **Tailscale** (`widgetType: 'tailscale'`) – Status połączenia z siecią mesh oraz liczba aktywnych węzłów (urządzeń).
* **Vaultwarden** (`widgetType: 'generic'`) – Bezpieczny dostęp do menedżera haseł.

### 🏠 Automatyka Domowa
* **Home Assistant** (`widgetType: 'home-assistant'`) – Status aktywności huba oraz integracja z systemem smart home. Wymaga wygenerowania klucza API (Long-lived Access Token).

### 🎬 Media i Rozrywka
* **Jellyfin / Plex** (`widgetType: 'media'`) – Podgląd aktywnych sesji (kto aktualnie ogląda) oraz obciążenia serwera.
* **Sonarr / Radarr / Lidarr / Readarr** (`widgetType: 'generic'`) – Monitoring bibliotek mediów i pobierania.
* **Minecraft Server** (`widgetType: 'minecraft'`) – Status serwera, liczba graczy online oraz wersja gry.

### 📊 Monitoring i Narzędzia
* **Uptime Kuma** (`widgetType: 'uptime-kuma'`) – **Zaawansowany widget:**
    * Lista monitorów pobierana bezpośrednio ze stron statusu.
    * Wskaźnik "zdrowia" usług w formie paska postępu.
    * Dynamiczne skalowanie: widok 3x3 pokazuje listę monitorów w dwóch kolumnach.
* **Portainer** (`widgetType: 'admin'`) – Szybki podgląd liczby uruchomionych i zatrzymanych kontenerów.
* **Grafana / Prometheus** (`widgetType: 'generic'`) – Łatwy dostęp do paneli analitycznych.

---

> **Wskazówka dla Deweloperów:** > Lista wspieranych obrazów jest stale rozszerzana w pliku `src/app/lib/appMap.ts`. Możesz tam łatwo dodać własne obrazy, przypisując im domyślne porty i kolory.

## 🚨 System Statusów i Błędów

Każdy z powyższych widgetów posiada ustandaryzowaną logikę obsługi błędów:
1.  **Tryb Online:** Widget wyświetla naturalny kolor przypisany do aplikacji (np. niebieski dla HA, czerwony dla Pi-hole).
2.  **Błąd Autoryzacji:** Jeśli klucz API jest błędny lub wygasł, kafelek zmienia kolor na **alarmową czerwień** z napisem "Odmowa dostępu".
3.  **Host Offline:** Jeśli kontener został zatrzymany lub adres IP jest nieosiągalny, kafelek zaleje się czerwienią, informując o braku połączenia.

# 🤝 Kontrybucja

Jeśli chcesz dodać nowy szablon widgetu lub poprawić obsługę konkretnej aplikacji:

1. Sklonuj repozytorium.
2. Dodaj definicję w `src/app/lib/appMap.ts`.
3. Stwórz nowy komponent w `src/components/widgets/templates/`.
4. Wyślij Pull Request!
5. Stwórz wątek o dodanie
