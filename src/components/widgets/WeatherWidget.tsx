'use client';

import { CloudSun, Droplets, Wind, MapPin, GripHorizontal, X, ArrowDownRight, Sun, CloudRain, Cloud, ThermometerSun, Settings, Save, Lock, Unlock } from 'lucide-react';
import { useState, useEffect } from 'react';

interface WeatherWidgetProps {
  id: string;
  isEditMode: boolean;
  onRemove: (id: string) => void;
  className?: string;
  w?: number;
  h?: number;
  isLocked?: boolean;
  onToggleLock?: (id: string) => void;
}

export default function WeatherWidget({ id, isEditMode, onRemove, className, w = 2, h = 2, isLocked, onToggleLock }: WeatherWidgetProps) {
  const [city, setCity] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Inicjalizacja: Ładowanie miasta z localStorage (lub domyślnie Warszawa)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCity = localStorage.getItem(`weather_city_${id}`);
      if (savedCity) {
        setCity(savedCity);
        setInputValue(savedCity);
      } else {
        setCity('Warszawa');
        setInputValue('Warszawa');
      }
    }
  }, [id]);

  // 2. Pobieranie danych z Open-Meteo, gdy tylko zmieni się stan `city`
  useEffect(() => {
    if (!city) return;

    const fetchWeather = async () => {
      try {
        setIsLoading(true);
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=pl&format=json`);
        const geoData = await geoRes.json();
        
        if (!geoData.results || geoData.results.length === 0) {
           setIsLoading(false);
           return;
        }
        
        const { latitude, longitude, name } = geoData.results[0];
        
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,surface_pressure,weather_code&daily=weather_code,temperature_2m_max&timezone=auto`);
        const data = await weatherRes.json();
        
        const getCondition = (code: number) => {
           if (code <= 1) return { text: 'Słonecznie', icon: Sun };
           if (code <= 3) return { text: 'Zachmurzenie', icon: CloudSun };
           if (code <= 48) return { text: 'Pochmurno', icon: Cloud };
           return { text: 'Opady', icon: CloudRain };
        };

        const currentCond = getCondition(data.current.weather_code);

        setWeatherData({
          temp: Math.round(data.current.temperature_2m),
          condition: currentCond.text,
          location: name,
          humidity: data.current.relative_humidity_2m,
          wind: Math.round(data.current.wind_speed_10m),
          pressure: Math.round(data.current.surface_pressure),
          uv: 5,
          forecast: [
            { day: 'Jutro', temp: Math.round(data.daily.temperature_2m_max[1]), icon: getCondition(data.daily.weather_code[1]).icon },
            { day: 'Pojutrze', temp: Math.round(data.daily.temperature_2m_max[2]), icon: getCondition(data.daily.weather_code[2]).icon },
            { day: 'Za 3 dni', temp: Math.round(data.daily.temperature_2m_max[3]), icon: getCondition(data.daily.weather_code[3]).icon }
          ]
        });
        setIsLoading(false);
      } catch (e) {
        console.error("Błąd API Pogody", e);
        setIsLoading(false);
      }
    };
    fetchWeather();
  }, [city]);

  // 3. Zapisywanie nowego miasta
  const handleSave = () => {
    if (inputValue.trim()) {
      setCity(inputValue.trim());
      localStorage.setItem(`weather_city_${id}`, inputValue.trim());
    }
    setIsConfiguring(false);
  };

  const isExpanded = w >= 3 && h >= 3;
  const CurrentForecastIcon = weatherData?.forecast?.[0]?.icon;

  return (
    <div className={`bg-gradient-to-br from-blue-900/80 to-slate-900/90 backdrop-blur-md rounded-xl p-5 flex flex-col h-full border border-blue-500/30 shadow-2xl relative overflow-hidden transition-all duration-300 ${className}`}>
      
      {/* Ozdoba tła */}
      <CloudSun className="absolute -right-10 -bottom-10 w-56 h-56 text-blue-400 opacity-[0.05] pointer-events-none transform rotate-6 transition-all duration-500" />
      
      {/* --- TRYB KONFIGURACJI (Zębatka) --- */}
      {isConfiguring && !isEditMode && (
        <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-xl z-40 flex flex-col p-5 border border-blue-500/30 rounded-xl transition-all">
           <div className="flex justify-between items-center mb-4">
             <span className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2"><MapPin size={14} className="text-blue-400"/> Lokalizacja</span>
             <button onClick={() => setIsConfiguring(false)} className="text-slate-400 hover:text-white"><X size={16}/></button>
           </div>
           
           <div className="flex-1 flex flex-col justify-center gap-3">
              <div>
                 <label className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 block">Miasto / Miejscowość</label>
                 <input 
                   type="text" 
                   value={inputValue}
                   onChange={(e) => setInputValue(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                   onMouseDown={(e) => e.stopPropagation()}
                   className="w-full bg-black/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none shadow-inner"
                   placeholder="np. Warszawa"
                 />
              </div>
              <button 
                onMouseDown={(e) => e.stopPropagation()}
                onClick={handleSave} 
                className="w-full py-2.5 mt-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-colors shadow-lg flex items-center justify-center gap-2"
              >
                <Save size={16} /> Zapisz
              </button>
           </div>
        </div>
      )}

      {/* --- TRYB EDYCJI (Usuwanie i Przesuwanie) --- */}
      {isEditMode && (
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center border-2 border-blue-500/50 rounded-xl cursor-move grid-drag-handle transition-all">
           <div className="absolute top-2 right-2 cursor-pointer text-slate-400 hover:text-red-500 bg-slate-800/80 p-1.5 rounded-lg z-50" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onRemove(id); }}>
             <X size={18} />
           </div>
           <div 
             className={`absolute top-2 left-2 cursor-pointer p-1.5 rounded-lg z-50 transition-colors ${isLocked ? 'text-amber-400 bg-slate-800/90 shadow-[0_0_10px_rgba(251,191,36,0.2)]' : 'text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800'}`} 
             onMouseDown={(e) => e.stopPropagation()} 
             onClick={(e) => { e.stopPropagation(); onToggleLock?.(id); }}
           >
             {isLocked ? <Lock size={18} /> : <Unlock size={18} />}
           </div>
           <GripHorizontal className="text-blue-400 mb-2 drop-shadow-lg" size={28} />
           <span className="text-white font-bold tracking-wide">Pogoda</span>
           <div className="absolute bottom-2 right-2 text-blue-400/80 pointer-events-none flex items-center justify-center p-1 bg-blue-500/20 rounded-tl-xl rounded-br-lg">
             <ArrowDownRight size={16} />
           </div>
        </div>
      )}

      {/* --- GŁÓWNA ZAWARTOSĆ --- */}
      <div className="flex items-start justify-between z-10">
        <div className="flex items-center gap-1.5 text-blue-300 bg-blue-950/50 px-2.5 py-1 rounded-full border border-blue-500/20 shadow-inner">
          <MapPin size={12} />
          <span className="text-xs font-bold tracking-wide">{weatherData?.location || city || 'Ładowanie...'}</span>
        </div>
        
        <div className="flex items-center gap-3">
           {!isEditMode && !isConfiguring && (
             <button 
               onMouseDown={(e) => e.stopPropagation()} 
               onClick={() => setIsConfiguring(true)} 
               className="text-blue-400/50 hover:text-blue-300 transition-colors bg-black/20 p-1.5 rounded-lg border border-white/5"
             >
                <Settings size={14} />
             </button>
           )}
           {!isLoading && CurrentForecastIcon && (
             <CurrentForecastIcon
               size={24}
               className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)] animate-pulse"
             />
           )}
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center z-10 mt-2">
        {isLoading ? (
          <div className="text-center text-slate-400 text-sm animate-pulse">Pobieranie danych...</div>
        ) : weatherData && (
          <div className="animate-in fade-in duration-500 flex flex-col h-full">
            <div className="flex items-end gap-2">
               <span className="text-5xl font-black text-white tracking-tighter drop-shadow-lg">{weatherData.temp}°</span>
               <span className="text-lg text-blue-200 font-medium mb-1.5">{weatherData.condition}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-auto">
              <div className="flex items-center gap-2 bg-black/20 rounded-lg p-2 border border-white/5 backdrop-blur-sm">
                <Droplets size={14} className="text-blue-400" />
                <span className="text-sm text-white font-bold">{weatherData.humidity}%</span>
              </div>
              <div className="flex items-center gap-2 bg-black/20 rounded-lg p-2 border border-white/5 backdrop-blur-sm">
                <Wind size={14} className="text-blue-400" />
                <span className="text-sm text-white font-bold">{weatherData.wind} <span className="text-[10px] text-slate-400">km/h</span></span>
              </div>
            </div>

            {/* Wersja rozszerzona */}
            {isExpanded && (
              <div className="mt-4 pt-4 border-t border-blue-500/20 flex-1 flex flex-col animate-in fade-in duration-500">
                <div className="flex justify-between text-xs text-slate-300 mb-4 px-1">
                  <div className="flex items-center gap-1.5"><ThermometerSun size={12} className="text-orange-400"/> UV: {weatherData.uv}</div>
                  <div className="flex items-center gap-1.5"><ArrowDownRight size={12} className="text-blue-400"/> {weatherData.pressure} hPa</div>
                </div>
                <h4 className="text-[10px] text-blue-300 uppercase font-bold mb-2 tracking-wider">Prognoza (3 dni)</h4>
                <div className="flex gap-2 flex-1">
                  {weatherData.forecast.map((day: any, idx: number) => {
                    const DayIcon = day.icon;
                    return (
                      <div key={idx} className="flex-1 bg-black/20 border border-white/5 rounded-xl p-2 flex flex-col items-center justify-center gap-1.5 transition-colors hover:bg-black/40 shadow-inner">
                        <span className="text-[9px] text-slate-400 uppercase font-bold">{day.day}</span>
                        <DayIcon size={18} className={day.temp > 20 ? 'text-yellow-400' : 'text-blue-400'} />
                        <span className="text-sm text-white font-bold">{day.temp}°</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}