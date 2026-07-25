import { useState } from "react";
import Card from "../../common/Card";
import { useWeather } from "../../../hooks/useWeather";
import {
  CloudRain,
  Wind,
  Thermometer,
  AlertTriangle,
  RefreshCw,
  MapPin,
  Compass,
} from "lucide-react";

const WeatherWidget = () => {
  const { weatherData, summary, alerts, isLoading, isSyncing, syncWeather } = useWeather();
  const [selectedWidgetDist, setSelectedWidgetDist] = useState("Kozhikode");

  const activeDistWeather = weatherData.find(
    (d) => d.district.toLowerCase() === selectedWidgetDist.toLowerCase()
  );

  if (isLoading) {
    return (
      <Card className="p-5 border border-slate-200">
        <div className="flex justify-center items-center py-6">
          <span className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-blue-600"></span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5 border border-slate-200 space-y-4 hover:shadow-md transition duration-300">

      {/* Title Header */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 uppercase tracking-wider">
          <CloudRain className="w-4 h-4 text-blue-600 animate-bounce" /> Weather Intelligence
        </h3>
        <div className="flex items-center gap-1">
          {summary.activeAlertsCount > 0 && (
            <span className="flex items-center gap-0.5 bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold animate-pulse">
              <AlertTriangle className="w-3 h-3" /> {summary.activeAlertsCount} ALERT
            </span>
          )}
        </div>
      </div>

      {/* Core Weather Parameter Summary Stats */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="p-2.5 bg-rose-50/50 rounded-xl border border-rose-100 text-center">
          <span className="text-[9px] uppercase font-bold text-rose-500 block leading-none">Max Temp</span>
          <span className="text-[13px] font-extrabold text-slate-850 mt-1 block">
            {summary.highestTemp?.value ? `${Math.round(summary.highestTemp.value)}°C` : "--"}
          </span>
          <span className="text-[9px] text-slate-400 block truncate">{summary.highestTemp?.district || "--"}</span>
        </div>
        <div className="p-2.5 bg-blue-50/50 rounded-xl border border-blue-100 text-center">
          <span className="text-[9px] uppercase font-bold text-blue-500 block leading-none">Avg Rain</span>
          <span className="text-[13px] font-extrabold text-blue-700 mt-1 block">
            {summary.avgRainfall !== undefined ? `${summary.avgRainfall} mm` : "--"}
          </span>
          <span className="text-[9px] text-slate-400 block">Kerala State</span>
        </div>
        <div className="p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-100 text-center">
          <span className="text-[9px] uppercase font-bold text-emerald-500 block leading-none">Max Wind</span>
          <span className="text-[13px] font-extrabold text-slate-850 mt-1 block">
            {summary.maxWind?.value ? `${Math.round(summary.maxWind.value)} km/h` : "--"}
          </span>
          <span className="text-[9px] text-slate-400 block truncate">{summary.maxWind?.district || "--"}</span>
        </div>
      </div>

      {/* Mini Active Alerts block */}
      {alerts && alerts.length > 0 ? (
        <div className="bg-red-50 border border-red-150 rounded-xl p-3 space-y-1.5 max-h-[140px] overflow-y-auto scrollbar">
          <label className="text-[9px] font-bold text-red-800 uppercase block tracking-wider">Active State Hazards:</label>
          {alerts.slice(0, 3).map((a, i) => (
            <div key={i} className="text-[11px] text-slate-700 leading-tight flex justify-between gap-1">
              <span className="font-extrabold shrink-0 text-red-650">{a.district}:</span>
              <span className="truncate text-slate-800">{a.type} ({a.severity})</span>
            </div>
          ))}
          {alerts.length > 3 && (
            <span className="text-[10px] font-semibold text-red-600 block text-right mt-1">
              +{alerts.length - 3} more alerts...
            </span>
          )}
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 text-center">
          <p className="text-[11px] font-semibold text-slate-550 m-0">
            ☀️ No active weather emergency alerts in Kerala
          </p>
        </div>
      )}

      {/* Selected District Forecast Selector in widget */}
      <div className="border-t border-slate-100 pt-3 space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-[10px] font-bold text-slate-400 uppercase">District Forecast</label>
          <select
            value={selectedWidgetDist}
            onChange={(e) => setSelectedWidgetDist(e.target.value)}
            className="text-[11px] font-extrabold text-slate-700 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1"
          >
            {weatherData.map((d) => (
              <option key={d.district} value={d.district}>{d.district}</option>
            ))}
          </select>
        </div>

        {activeDistWeather ? (
          <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-150">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-404" />
              <div>
                <span className="font-bold text-slate-800 block leading-tight">{activeDistWeather.district}</span>
                <span className="text-[9px] text-slate-400 block">{activeDistWeather.weather?.condition}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <span className="font-extrabold text-slate-850 block leading-tight">{Math.round(activeDistWeather.temperature)}°C</span>
                {activeDistWeather.rainfall > 0 && (
                  <span className="text-[9px] font-extrabold text-blue-600 block">{activeDistWeather.rainfall.toFixed(1)} mm</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-slate-400">Forecast details blank.</p>
        )}
      </div>

    </Card>
  );
};

export default WeatherWidget;