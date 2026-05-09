import { useState, useEffect } from 'react';
import { Cloud, TrendingUp, Newspaper } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

const WEATHER_FALLBACK = { temp: '--', condition: 'Loading...', city: '' };

const HEADLINES = [
  'Fresh products now available nationwide',
  'New arrivals: Check out the latest products',
  'Free delivery on orders above Rs 5,000',
  'Earn bonus points on every purchase today',
];

const InfoBar = () => {
  const { rates } = useCurrency();
  const [weather, setWeather] = useState(WEATHER_FALLBACK);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Rotate ticker every 5 seconds — setState inside callback, not effect body
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % HEADLINES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch weather via open-meteo (no key needed) using browser geolocation
  useEffect(() => {
    const fetchWeather = async (lat, lon) => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
        );
        const data = await res.json();
        const code = data.current_weather?.weathercode;
        const conditions = {
          0: 'Clear', 1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
          45: 'Foggy', 51: 'Drizzle', 61: 'Rain', 71: 'Snow', 80: 'Showers',
          95: 'Thunderstorm',
        };
        setWeather({
          temp: Math.round(data.current_weather?.temperature ?? '--'),
          condition: conditions[code] ?? 'Clear',
          city: '',
        });
      } catch {
        setWeather({ temp: '--', condition: 'Weather unavailable', city: '' });
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => setWeather({ temp: '--', condition: 'Location denied', city: '' })
      );
    }
  }, []);

  const rateDisplay = [
    { from: 'USD', to: 'PKR', rate: rates.PKR?.toFixed(0) },
    { from: 'USD', to: 'EUR', rate: rates.EUR?.toFixed(2) },
    { from: 'USD', to: 'GBP', rate: rates.GBP?.toFixed(2) },
  ];

  return (
    <div className="bg-gray-900 text-gray-300 text-[11px] py-2 w-full">
      <div className="w-full px-4 sm:px-6 lg:px-10 flex items-center gap-3 min-w-0">

        {/* News Ticker */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-hidden">
          <Newspaper size={11} className="text-green-400 flex-shrink-0" />
          <span className="text-green-400 font-semibold flex-shrink-0 hidden xs:inline">NEWS</span>
          <span
            key={currentIndex}
            className="truncate flex-1 min-w-0 transition-all duration-500"
          >
            {HEADLINES[currentIndex]}
          </span>
        </div>

        {/* Weather — tablet+ only */}
        <div className="hidden md:flex items-center gap-1 flex-shrink-0 border-l border-gray-700 pl-3">
          <Cloud size={11} className="text-blue-400" />
          <span className="whitespace-nowrap">{weather.temp}°C</span>
          <span className="text-gray-500 hidden lg:inline">· {weather.condition}</span>
        </div>

        {/* Exchange Rates — desktop only */}
        <div className="hidden lg:flex items-center gap-3 border-l border-gray-700 pl-3 flex-shrink-0">
          <TrendingUp size={11} className="text-yellow-400" />
          {rateDisplay.map((r) => (
            <span key={r.to} className="whitespace-nowrap">
              1 {r.from} = <span className="text-white font-medium">{r.rate} {r.to}</span>
            </span>
          ))}
        </div>

      </div>
    </div>
  );
};

export default InfoBar;
