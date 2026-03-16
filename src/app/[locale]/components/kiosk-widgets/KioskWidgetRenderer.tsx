import React from 'react';
import KioskSystemWidget from './KioskSystemWidget';
import KioskClockWidget from './KioskClockWidget';
import WeatherWidget from '../widgets/WeatherWidget';
import KioskPiholeWidget from './KioskPiholeWidget';
import KioskHomeAssistantWidget from './KioskHomeAssistantWidget';

// Funkcja, która przyjmuje dane z grida i zwraca gotowy widget kiosku (lub null)
export function renderKioskWidget(item: any, commonProps: any) {
  // Jeśli typ widgetu nie zaczyna się od 'kiosk-', ignorujemy go (to zwykły widget PC)
  if (!item.type?.startsWith('kiosk-')) {
    return null;
  }

  switch (item.type) {
    case 'kiosk-system':
      return <KioskSystemWidget {...commonProps} />;
    
    case 'kiosk-clock':
      return <KioskClockWidget {...commonProps} />;

    case 'kiosk-weather':
      // Pogoda rozciąga się ładnie, więc na razie możemy użyć klasycznej w Kiosku
      return <WeatherWidget {...commonProps} />;

    case 'kiosk-dns':
      return <KioskPiholeWidget {...commonProps} />;

    case 'kiosk-home-assistant':
      return <KioskHomeAssistantWidget {...commonProps} />;

    // Tutaj w przyszłości dodamy: case 'kiosk-pihole': return <KioskPiholeWidget ... />

    default:
      // Zabezpieczenie na wypadek nieznanego widgetu kioskowego
      return (
        <div className="h-full w-full bg-red-900/20 flex items-center justify-center text-red-400 text-sm border border-red-500/30 rounded-3xl p-4 text-center">
          Brak widoku Kiosku dla:<br/><b>{item.type}</b>
        </div>
      );
  }
}