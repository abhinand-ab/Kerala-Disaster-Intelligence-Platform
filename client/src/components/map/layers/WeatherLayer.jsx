import { useEffect, useRef, useMemo, memo, useState } from "react";
import { Marker, Popup, useMap as useLeafletMap } from "react-leaflet";
import L from "leaflet";
import { useWeather } from "../../../hooks/useWeather";
import {
    Thermometer,
    CloudRain,
    Wind,
    Droplet,
    Compass,
    AlertTriangle,
    RefreshCw,
    Sun,
    Cloud,
    CloudDrizzle,
    CloudLightning,
    Eye,
} from "lucide-react";

// Inline helpers for weather-specific icon SVG strings (used in Leaflet map markers)
const getWeatherMarkerHtml = (district, weather, temp, rain, alerts) => {
    const hasAlert = alerts && alerts.length > 0;
    const isHeavyRain = rain > 15 || alerts?.some(a => a.type.includes("Rain"));
    const isThunder = weather?.condition === "Thunderstorm" || alerts?.some(a => a.type.includes("Thunder") || a.type.includes("Lightning"));

    let bgClass = "bg-white border-slate-200 text-slate-800";
    let pulseColor = "bg-slate-350";
    let iconHtml = "";

    if (isThunder) {
        bgClass = "bg-amber-50 border-amber-300 text-amber-900";
        pulseColor = "bg-amber-550";
        iconHtml = `
      <svg class="w-4 h-4 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 8.58"/>
        <path d="m13 11-4 6h6l-4 6"/>
      </svg>
    `;
    } else if (isHeavyRain) {
        bgClass = "bg-blue-50 border-blue-300 text-blue-900";
        pulseColor = "bg-blue-550";
        iconHtml = `
      <svg class="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="16" y1="13" x2="16" y2="21"/>
        <line x1="8" y1="13" x2="8" y2="21"/>
        <line x1="12" y1="15" x2="12" y2="23"/>
        <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/>
      </svg>
    `;
    } else if (weather?.condition === "Rainy" || weather?.condition === "Drizzle") {
        bgClass = "bg-sky-50 border-sky-200 text-sky-900";
        pulseColor = "bg-sky-450";
        iconHtml = `
      <svg class="w-4 h-4 text-sky-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="8" y1="19" x2="8" y2="21"/>
        <line x1="12" y1="19" x2="12" y2="21"/>
        <line x1="16" y1="19" x2="16" y2="21"/>
        <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/>
      </svg>
    `;
    } else if (weather?.condition === "Cloudy") {
        bgClass = "bg-slate-50 border-slate-300 text-slate-700";
        pulseColor = "bg-slate-450";
        iconHtml = `
      <svg class="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-2.54-4.5-5-4.5-.57 0-1.1.13-1.6.37A5.5 5.5 0 1 0 4 15.5c0 1.93 1.57 3.5 3.5 3.5Z"/>
      </svg>
    `;
    } else {
        // Clear / Default
        bgClass = "bg-orange-50 border-orange-200 text-orange-950";
        pulseColor = "bg-orange-450";
        iconHtml = `
      <svg class="w-4 h-4 text-orange-500 animate-spin-slow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <circle cx="12" cy="12" r="4"/>
        <path d="M12 2v2"/>
        <path d="M12 20v2"/>
        <path d="m4.93 4.93 1.41 1.41"/>
        <path d="m17.66 17.66 1.41 1.41"/>
        <path d="M2 12h2"/>
        <path d="M20 12h2"/>
        <path d="m6.34 17.66-1.41 1.41"/>
        <path d="m19.07 4.93-1.41 1.41"/>
      </svg>
    `;
    }

    // Force extreme border if alerts present
    if (hasAlert) {
        const isExtreme = alerts.some(a => a.severity === "Extreme");
        bgClass = `${isExtreme ? 'bg-red-50 border-red-500 text-red-950 shadow-md ring-2 ring-red-500/20' : 'bg-amber-50 border-amber-500 text-amber-950 shadow-md animate-pulse'}`;
        pulseColor = isExtreme ? "bg-red-600" : "bg-amber-550";
    }

    return `
    <div class="relative flex flex-col items-center justify-center w-14 h-14">
      <!-- Outer Pulsing Glow -->
      <div class="absolute w-12 h-12 rounded-full ${pulseColor} opacity-25 animate-ping pointer-events-none"></div>
      
      <!-- Marker Badge -->
      <div class="relative flex flex-col items-center justify-center px-1.5 py-1 rounded-lg border-2 shadow-md bg-white ${bgClass} font-sans">
        <!-- Weather Icon & Temp Row -->
        <div class="flex items-center gap-0.5 justify-center">
          ${iconHtml}
          <span class="text-xs font-bold leading-none">${Math.round(temp)}°</span>
        </div>
        <!-- Rain / Alert Label -->
        ${rain > 0 ? `<span class="text-[9px] font-bold text-blue-600 leading-none mt-0.5">${rain.toFixed(1)}m</span>` : ""}
        ${hasAlert && rain === 0 ? `<span class="text-[9px] font-extrabold text-red-650 leading-none tracking-tighter mt-0.5 animate-pulse">ALERT</span>` : ""}
      </div>
    </div>
  `;
};

const WeatherLayer = () => {
    const { weatherData, alerts, isLoading } = useWeather();
    const map = useLeafletMap();
    const hasMovedManually = useRef(false);

    // Monitor map movements
    useEffect(() => {
        if (!map) return;
        const handleMove = () => {
            hasMovedManually.current = true;
        };
        map.on("dragstart", handleMove);
        map.on("zoomstart", handleMove);

        return () => {
            map.off("dragstart", handleMove);
            map.off("zoomstart", handleMove);
        };
    }, [map]);

    // Coordinates matching
    const mappedDistricts = useMemo(() => {
        if (!weatherData) return [];
        return weatherData;
    }, [weatherData]);

    // Fit bounds dynamically if not moved manually
    useEffect(() => {
        if (!map || hasMovedManually.current || mappedDistricts.length === 0) return;
        try {
            const coords = mappedDistricts.map(d => [Number(d.latitude), Number(d.longitude)]);
            map.fitBounds(coords, { padding: [50, 50], maxZoom: 10 });
        } catch (err) {
            console.warn("Weather bounds fitting failed:", err);
        }
    }, [mappedDistricts, map]);

    const markers = useMemo(() => {
        return mappedDistricts.map((snapshot) => {
            const { district, latitude, longitude, temperature, rainfall, humidity, pressure, wind, weather, alerts: snapAlerts, forecast } = snapshot;

            // Leaflet marker DivIcon setup
            const html = getWeatherMarkerHtml(district, weather, temperature, rainfall, snapAlerts);
            const icon = L.divIcon({
                html,
                className: "custom-weather-marker-container",
                iconSize: [56, 56],
                iconAnchor: [28, 28],
                popupAnchor: [0, -20],
            });

            return (
                <Marker
                    key={district}
                    position={[Number(latitude), Number(longitude)]}
                    icon={icon}
                >
                    <Popup>
                        <div className="w-[320px] max-h-[420px] overflow-y-auto p-3 font-sans text-slate-800 space-y-3">
                            {/* Header */}
                            <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                                <div>
                                    <h3 className="font-bold text-lg leading-tight m-0 text-slate-900">
                                        {district}
                                    </h3>
                                    <span className="text-xs text-slate-400">District Weather Summary</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="p-1.5 bg-slate-100 rounded-lg text-slate-700 font-bold text-xs flex items-center gap-1 shadow-sm">
                                        {weather?.condition === "Clear" && <Sun className="w-3.5 h-3.5 text-orange-500 animate-spin-slow" />}
                                        {weather?.condition === "Cloudy" && <Cloud className="w-3.5 h-3.5 text-slate-500" />}
                                        {weather?.condition === "Drizzle" && <CloudDrizzle className="w-3.5 h-3.5 text-sky-500" />}
                                        {weather?.condition === "Rainy" && <CloudRain className="w-3.5 h-3.5 text-blue-500 animate-bounce" />}
                                        {weather?.condition === "Thunderstorm" && <CloudLightning className="w-3.5 h-3.5 text-amber-500" />}
                                        {weather?.condition}
                                    </div>
                                </div>
                            </div>

                            {/* Alerts Warning Section */}
                            {snapAlerts && snapAlerts.length > 0 && (
                                <div className="space-y-1.5">
                                    {snapAlerts.map((alert, idx) => (
                                        <div
                                            key={idx}
                                            className={`flex items-start gap-2 p-2 rounded-lg border text-xs leading-none shadow-sm ${alert.severity === "Extreme"
                                                    ? "bg-red-50 border-red-200 text-red-900"
                                                    : "bg-amber-50 border-amber-200 text-amber-900"
                                                }`}
                                        >
                                            <AlertTriangle className={`w-4 h-4 shrink-0 ${alert.severity === "Extreme" ? "text-red-650 animate-bounce" : "text-amber-600"}`} />
                                            <div className="space-y-0.5">
                                                <span className="font-bold uppercase text-[9px] bg-white px-1.5 py-0.2 rounded border shadow-sm">
                                                    {alert.type} - {alert.severity}
                                                </span>
                                                <p className="m-0 text-slate-700 leading-tight mt-1 text-[11px]">
                                                    {alert.message}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Core Parameters Grid */}
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 p-2 rounded-xl">
                                    <Thermometer className="w-4 h-4 text-rose-500" />
                                    <div>
                                        <label className="text-[10px] text-slate-400 block leading-none">Temp</label>
                                        <span className="font-bold text-slate-800">{temperature.toFixed(1)}°C</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 p-2 rounded-xl">
                                    <CloudRain className="w-4 h-4 text-blue-550" />
                                    <div>
                                        <label className="text-[10px] text-slate-400 block leading-none">Rainfall</label>
                                        <span className="font-bold text-blue-600">{rainfall.toFixed(1)} mm</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 p-2 rounded-xl">
                                    <Droplet className="w-4 h-4 text-teal-500" />
                                    <div>
                                        <label className="text-[10px] text-slate-400 block leading-none">Humidity</label>
                                        <span className="font-bold text-slate-800">{humidity}%</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 p-2 rounded-xl">
                                    <Wind className="w-4 h-4 text-emerald-500" />
                                    <div>
                                        <label className="text-[10px] text-slate-400 block leading-none">Wind</label>
                                        <span className="font-bold text-slate-800">{wind.speed.toFixed(1)} km/h</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 p-2 rounded-xl">
                                    <Compass className="w-4 h-4 text-indigo-500" />
                                    <div>
                                        <label className="text-[10px] text-slate-400 block leading-none">Direction</label>
                                        <span className="font-bold text-slate-800">{wind.direction}°</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 p-2 rounded-xl">
                                    <Eye className="w-4 h-4 text-sky-500" />
                                    <div>
                                        <label className="text-[10px] text-slate-400 block leading-none">Pressure</label>
                                        <span className="font-bold text-slate-800">{pressure} hPa</span>
                                    </div>
                                </div>
                            </div>

                            {/* 3-day Simple Forecast */}
                            {forecast?.daily && forecast.daily.length > 0 && (
                                <div className="border-t border-slate-100 pt-3">
                                    <h4 className="font-bold text-xs text-slate-600 mb-2">3-Day Forecast</h4>
                                    <div className="space-y-1.5">
                                        {forecast.daily.slice(1, 4).map((day, idx) => {
                                            const dayName = new Date(day.date).toLocaleDateString("en-IN", { weekday: "short" });
                                            return (
                                                <div key={idx} className="flex justify-between items-center text-xs bg-slate-50 opacity-90 p-1.5 px-2.5 rounded-lg">
                                                    <span className="font-bold text-slate-500 w-10 shrink-0">{dayName}</span>
                                                    <span className="flex items-center gap-1.5 font-semibold text-slate-700 min-w-[70px]">
                                                        {day.condition === "Clear" && <Sun className="w-3.5 h-3.5 text-orange-500" />}
                                                        {day.condition === "Cloudy" && <Cloud className="w-3.5 h-3.5 text-slate-500" />}
                                                        {day.condition === "Drizzle" && <CloudDrizzle className="w-3.5 h-3.5 text-sky-500" />}
                                                        {day.condition === "Rainy" && <CloudRain className="w-3.5 h-3.5 text-blue-500" />}
                                                        {day.condition === "Thunderstorm" && <CloudLightning className="w-3.5 h-3.5 text-amber-500" />}
                                                        {day.condition}
                                                    </span>
                                                    <div className="flex gap-2">
                                                        <span className="text-slate-460 font-medium">Min: <strong className="text-slate-800">{Math.round(day.tempMin)}°</strong></span>
                                                        <span className="text-slate-460 font-medium">Max: <strong className="text-slate-800">{Math.round(day.tempMax)}°</strong></span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Popup>
                </Marker>
            );
        });
    }, [mappedDistricts]);

    if (isLoading) return null;

    return <>{markers}</>;
};

export default memo(WeatherLayer);
