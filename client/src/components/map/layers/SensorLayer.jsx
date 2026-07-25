import { useMemo, useState } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { useSensorsList, useSensorHistory } from "../../../hooks/useSensors";
import {
    Thermometer,
    CloudRain,
    Droplet,
    Battery,
    Wifi,
    Waves,
    Calendar,
    AlertTriangle,
    Heart,
    TrendingUp,
    Settings,
    XCircle
} from "lucide-react";

// Helper to compile SVG markers based on types and status
const getSensorMarkerHtml = (type, status) => {
    let mainColor = "#3b82f6"; // blue
    let glowColor = "rgba(59, 130, 246, 0.4)";
    let iconSvg = "";

    if (status === "Offline") {
        mainColor = "#6b7280"; // grey
        glowColor = "rgba(107, 114, 128, 0.4)";
    } else if (status === "Maintenance") {
        mainColor = "#f59e0b"; // yellow
        glowColor = "rgba(245, 158, 11, 0.4)";
    } else {
        // Active colors based on sensor type
        if (type === "RiverGauge") {
            mainColor = "#2563eb"; // deep blue
            glowColor = "rgba(37, 99, 235, 0.4)";
        } else if (type === "RainfallSensor") {
            mainColor = "#06b6d4"; // cyan
            glowColor = "rgba(6, 182, 212, 0.4)";
        } else if (type === "WeatherStation") {
            mainColor = "#10b981"; // emerald
            glowColor = "rgba(16, 185, 129, 0.4)";
        } else {
            mainColor = "#6366f1"; // indigo
            glowColor = "rgba(99, 102, 241, 0.4)";
        }
    }

    // Choose Icon SVG
    if (type === "RiverGauge") {
        iconSvg = `
      <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2v20M17 5H7M17 10H7M18 15v4a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-4"/>
      </svg>
    `;
    } else if (type === "RainfallSensor") {
        iconSvg = `
      <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242M12 12v6M8 14v4M16 14v4"/>
      </svg>
    `;
    } else if (type === "WeatherStation") {
        iconSvg = `
      <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
      </svg>
    `;
    } else {
        // WaterLevelGauge
        iconSvg = `
      <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 20V4M18 14l-6 6-6-6"/>
      </svg>
    `;
    }

    return `
    <div class="relative flex items-center justify-center w-9 h-9">
      ${status === "Active"
            ? `<div class="absolute w-7 h-7 rounded-full animate-ping pointer-events-none" style="background-color: ${glowColor}"></div>`
            : ""
        }
      <div class="relative flex items-center justify-center w-7.5 h-7.5 rounded-full border border-slate-950 shadow-md transition hover:scale-110" style="background-color: ${mainColor}">
        ${iconSvg}
      </div>
    </div>
  `;
};

// Sub-component to load and render historical readings in Leaflet popup
const SensorPopupContent = ({ sensor }) => {
    const [historyLimit, setHistoryLimit] = useState(5);
    const { data: readings = [], isLoading: isHistoryLoading } = useSensorHistory(sensor.sensorId, historyLimit);

    const formattedTime = sensor.lastReading?.timestamp
        ? new Date(sensor.lastReading.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
        : "No telemetry";

    return (
        <div className="p-3 w-76 font-sans text-xs text-slate-800 space-y-4">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-150 pb-2">
                <div>
                    <h4 className="font-extrabold text-[13px] text-slate-900 leading-tight">{sensor.sensorName}</h4>
                    <span className="text-[10px] text-slate-450 block mt-0.5">
                        ID: {sensor.sensorId} | District: {sensor.district}
                    </span>
                </div>
                <span
                    className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${sensor.status === "Active"
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                            : sensor.status === "Maintenance"
                                ? "bg-amber-50 text-amber-600 border border-amber-200"
                                : "bg-red-50 text-red-600 border border-red-200"
                        }`}
                >
                    {sensor.status}
                </span>
            </div>

            {/* Main Indicators Grid */}
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-201/60">
                {sensor.sensorType === "RiverGauge" || sensor.sensorType === "WaterLevelGauge" ? (
                    <div className="space-y-0.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Water Level</span>
                        <p className="text-sm font-black text-blue-650">
                            {sensor.lastReading?.waterLevel !== null ? `${sensor.lastReading.waterLevel} m` : "N/A"}
                        </p>
                    </div>
                ) : null}

                {sensor.sensorType === "RainfallSensor" || sensor.sensorType === "WeatherStation" ? (
                    <div className="space-y-0.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Rainfall</span>
                        <p className="text-sm font-black text-cyan-600">
                            {sensor.lastReading?.rainfall !== null ? `${sensor.lastReading.rainfall} mm/h` : "0 mm/h"}
                        </p>
                    </div>
                ) : null}

                {sensor.lastReading?.temperature !== null && sensor.lastReading?.temperature !== undefined && (
                    <div className="space-y-0.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Temp</span>
                        <p className="text-xs font-bold text-slate-805 flex items-center gap-0.5">
                            <Thermometer className="w-3.5 h-3.5 text-orange-500 scale-75" /> {sensor.lastReading.temperature}°C
                        </p>
                    </div>
                )}

                {sensor.lastReading?.humidity !== null && sensor.lastReading?.humidity !== undefined && (
                    <div className="space-y-0.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Humidity</span>
                        <p className="text-xs font-bold text-slate-805 flex items-center gap-0.5">
                            <Droplet className="w-3.5 h-3.5 text-blue-450 scale-75" /> {sensor.lastReading.humidity}%
                        </p>
                    </div>
                )}

                {sensor.river && (
                    <div className="space-y-0.5 col-span-2 border-t border-slate-200/50 pt-1.5 flex justify-between items-center text-[10px] text-slate-500">
                        <span className="flex items-center gap-1"><Waves className="w-3 h-3 text-blue-500" /> Monitored River</span>
                        <span className="font-bold text-slate-700">{sensor.river}</span>
                    </div>
                )}
            </div>

            {/* Diagnostics */}
            <div className="flex justify-between items-center text-[10px] text-slate-500 bg-slate-900 text-white p-2 rounded-lg">
                <span className="flex items-center gap-1">
                    <Battery className={`w-3.5 h-3.5 ${sensor.batteryLevel < 20 ? 'text-red-500 animate-pulse' : 'text-emerald-450'}`} />
                    Battery: {sensor.batteryLevel}%
                </span>
                <span className="flex items-center gap-1">
                    <Wifi className="w-3.5 h-3.5 text-blue-400" />
                    Signal: {sensor.signalStrength}%
                </span>
                <span className="flex items-center gap-0.5">
                    <Calendar className="w-3 h-3" />
                    {formattedTime}
                </span>
            </div>

            {/* Mini History Spark (Step 10 Historical Trends) */}
            <div className="space-y-1.5 border-t border-slate-100 pt-3">
                <div className="flex justify-between items-center pr-1">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-violet-500" /> Recent Telemetrics
                    </span>
                    <select
                        value={historyLimit}
                        onChange={(e) => setHistoryLimit(parseInt(e.target.value))}
                        className="text-[8px] bg-slate-100 border-none font-bold rounded p-0.5 cursor-pointer text-slate-600 focus:outline-none"
                    >
                        <option value={5}>Last 5</option>
                        <option value={10}>Last 10</option>
                    </select>
                </div>

                {isHistoryLoading ? (
                    <div className="text-center text-[10px] text-slate-400 py-2 animate-pulse">Querying history logs...</div>
                ) : readings.length === 0 ? (
                    <p className="text-[10px] text-slate-450 italic text-center py-2">No historical telemetry points found.</p>
                ) : (
                    <div className="space-y-1 max-h-[100px] overflow-y-auto pr-1">
                        {readings.map((r, i) => (
                            <div key={i} className="flex justify-between items-center text-[9px] bg-slate-50 hover:bg-slate-100 p-1.5 rounded transition">
                                <span className="text-slate-500 font-semibold">
                                    {new Date(r.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                                </span>
                                <div className="flex gap-2 font-black text-slate-800">
                                    {r.waterLevel !== null && <span>Level: {r.waterLevel}m</span>}
                                    {r.rainfall !== null && <span>Rain: {r.rainfall}mm</span>}
                                    {r.temperature !== null && <span>{r.temperature}°C</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const SensorLayer = () => {
    const { data: sensors = [] } = useSensorsList({});

    const markers = useMemo(() => {
        return sensors
            .filter((s) => s.latitude && s.longitude)
            .map((s) => {
                const icon = L.divIcon({
                    className: "custom-sensor-marker-div",
                    html: getSensorMarkerHtml(s.sensorType, s.status),
                    iconSize: [36, 36],
                    iconAnchor: [18, 18],
                });

                return {
                    id: s._id,
                    lat: s.latitude,
                    lon: s.longitude,
                    icon,
                    data: s,
                };
            });
    }, [sensors]);

    return (
        <>
            {markers.map((marker) => (
                <Marker key={marker.id} position={[marker.lat, marker.lon]} icon={marker.icon}>
                    <Popup className="custom-leaflet-popup p-0 overflow-hidden w-80">
                        <SensorPopupContent sensor={marker.data} />
                    </Popup>
                </Marker>
            ))}
        </>
    );
};

export default SensorLayer;
