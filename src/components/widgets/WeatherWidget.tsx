'use client';

import { useState, useEffect } from 'react';
import { Cloud, Sun, GripHorizontal, X, Settings, MapPin, CloudRain, CloudSnow } from 'lucide-react';

interface WeatherWidgetProps {
  style?: React.CSSProperties;
  className?: string;
  onMouseDown?: React.MouseEventHandler;
  onMouseUp?: React.MouseEventHandler;
  onTouchEnd?: React.TouchEventHandler;
  id: string;
  isEditMode: boolean;
  onRemove: (id: string) => void;
}

export default function WeatherWidget({
  style, className, onMouseDown, onMouseUp, onTouchEnd, id, isEditMode, onRemove
}: WeatherWidgetProps) {
  const [city, setCity] = useState('Warsaw');
  const [temp, setTemp] = useState<number | null>(null);
  const [code, setCode] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // Ładowanie z localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCity = localStorage.getItem(`weather_city_${id}`);
      if (savedCity) setCity(savedCity);
    }
  }, [id]);

  // Pobieranie pogody
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=pl&format=json`);
        const geoData = await geoRes.json();
        
        if (!geoData.results || geoData.results.length === 0) return;
        
        const { latitude, longitude } = geoData.results[0];
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
        const weatherData = await weatherRes.json();
        
        setTemp(weatherData.current_weather.temperature);
        setCode(weatherData.current_weather.weathercode);
      } catch (e) {
        console.error(e);
      }
    };
    fetchWeather();
  }, [city]);

  const saveSettings = () => {
    if (inputValue.trim()) {
      setCity(inputValue);
      localStorage.setItem(`weather_city_${id}`, inputValue);
    }
    setIsFlipped(false);
  };

  const getWeatherIcon = (wmo: number) => {
    if (wmo <= 1) return <Sun size={48} className="text-yellow-400" />;
    if (wmo <= 48) return <Cloud size={48} className="text-slate-400" />;
    return <CloudRain size={48} className="text-blue-400" />;
  };

  return (
    <div 
      style={style} 
      className={`${className} perspective-1000`} 
      onMouseDown={onMouseDown} 
      onMouseUp={onMouseUp} 
      onTouchEnd={onTouchEnd}
    >
      <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
        
        {/* === PRZÓD KARTY (WIDGET) === */}
        <div className="absolute inset-0 backface-hidden flex flex-col bg-slate-900/50 backdrop-blur-md border border-slate-800/50 rounded-xl shadow-xl overflow-hidden">
          
          {/* Nagłówek */}
          <div className={`
            flex items-center justify-between px-3 py-2 h-[40px] border-b border-slate-700/50 z-20
            ${isEditMode ? 'bg-slate-700/50 cursor-move grid-drag-handle' : 'bg-transparent'}
          `}>
            <div className="flex items-center gap-2 w-full">
              {isEditMode && <GripHorizontal size={16} className="text-blue-400" />}
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider truncate">{city}</span>
            </div>
            
            <div className="flex items-center gap-2">
               {!isEditMode && (
                 <button 
                   onMouseDown={(e) => e.stopPropagation()} 
                   onClick={() => { setInputValue(city); setIsFlipped(true); }} 
                   className="text-slate-500 hover:text-white transition-colors"
                 >
                    <Settings size={14} />
                 </button>
               )}
               {isEditMode && (
                 <div className="cursor-pointer text-slate-500 hover:text-red-400" onMouseDown={e => e.stopPropagation()} onClick={() => onRemove(id)}>
                   <X size={16} />
                 </div>
               )}
            </div>
          </div>

          {/* Treść */}
          <div className="flex-1 flex flex-col items-center justify-center p-4 z-10">
             <div className="mb-2 drop-shadow-lg">{getWeatherIcon(code)}</div>
             <div className="text-4xl font-bold text-white drop-shadow-md">{temp !== null ? `${temp}°C` : '--'}</div>
          </div>
        </div>

        {/* === TYŁ KARTY (USTAWIENIA) === */}
        {/* rotate-y-180 tutaj jest KLUCZOWE - odwracamy tył na starcie, żeby po obrocie rodzica był normalny */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col bg-slate-800 border border-slate-600 rounded-xl shadow-xl overflow-hidden">
           
           <div className="h-[40px] bg-slate-900/80 border-b border-slate-700 flex items-center px-3 justify-between">
             <span className="text-xs font-bold text-slate-300 uppercase">Ustawienia</span>
             <button onClick={() => setIsFlipped(false)} className="text-slate-400 hover:text-white"><X size={14}/></button>
           </div>

           <div className="flex-1 p-4 flex flex-col justify-center gap-3">
              <label className="text-xs text-slate-400 flex items-center gap-2">
                <MapPin size={12} /> Lokalizacja
              </label>
              
              {/* input musi mieć e.stopPropagation żeby grid nie myślał że chcemy przesuwać widget */}
              <input 
                type="text" 
                value={inputValue}
                onMouseDown={(e) => e.stopPropagation()}
                onChange={(e) => setInputValue(e.target.value)}
                className="nodrag w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none"
                placeholder="Wpisz miasto..."
              />
              
              <button 
                onMouseDown={(e) => e.stopPropagation()}
                onClick={saveSettings} 
                className="w-full py-2 mt-2 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded font-bold transition-colors shadow-lg"
              >
                Zapisz
              </button>
           </div>
        </div>

      </div>
    </div>
  );
}