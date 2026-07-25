import { useState, useMemo } from "react";
import MainLayout from "../../components/layout/MainLayout";
import Header from "../../components/layout/Header";
import Card from "../../components/common/Card";
import StatCard from "../../components/common/StatCard";
import BackButton from "../../components/common/BackButton";
import {
    useWeather,
    useDistrictWeather,
    useWeatherForecast,
    useWeatherHistory,
} from "../../hooks/useWeather";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-hot-toast";
import {
    CloudRain,
    Wind,
    Droplet,
    Thermometer,
    AlertTriangle,
    RefreshCw,
    Compass,
    Eye,
    MapPin,
    Calendar,
    CloudLightning,
    Sun,
    Cloud,
    CloudDrizzle,
} from "lucide-react";

const WeatherPage = () => {
    const { user } = useAuth();
    const isAdmin = user?.role?.toLowerCase() === "admin";

    const {
        weatherData = [],
        alerts = [],
        summary = {},
        isLoading,
        isSyncing,
        syncWeather,
    } = useWeather({ refetchInterval: 30000 });

    const [selectedDistrict, setSelectedDistrict] = useState("Kozhikode");
    const [historyDays, setHistoryDays] = useState(7);

    // Fetch forecast and history for selected district
    const { data: activeDistrictData, isLoading: isActiveLoading } =
        useDistrictWeather(selectedDistrict);

    const { data: activeHistoryData } = useWeatherHistory({
        district: selectedDistrict,
        days: historyDays,
    });

    const handleSync = async () => {
        try {
            await syncWeather();
            toast.success("Weather cached data synced successfully with provider!");
        } catch (e) {
            toast.error(e || "Failed to sync weather data.");
        }
    };

    // Find active snapshot details
    const activeSnapshot = useMemo(() => {
        if (!weatherData) return null;
        return weatherData.find(
            (d) => d.district.toLowerCase() === selectedDistrict.toLowerCase()
        );
    }, [weatherData, selectedDistrict]);

    // Hourly and Daily arrays
    const hourlyForecast = activeSnapshot?.forecast?.hourly || [];
    const dailyForecast = activeSnapshot?.forecast?.daily || [];

    return (
        <MainLayout>
            <div className="space-y-6 bg-slate-50 min-h-screen p-1">
                <BackButton />

                {/* Master Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            <CloudRain className="h-8 w-8 text-blue-600 animate-bounce" />
                            Weather Intelligence & Early Warning
                        </h1>
                        <p className="text-slate-500 mt-1">
                            Real-time atmospheric monitoring, rainfall audits, and active hazard warnings.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400 font-semibold bg-white px-3 py-1.5 rounded-xl border">
                            Providers: Open-Meteo & OpenWeather
                        </span>
                        {isAdmin && (
                            <button
                                disabled={isSyncing}
                                onClick={handleSync}
                                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold px-4.5 py-2.5 rounded-xl shadow-lg shadow-blue-500/10 transition-all hover:scale-[1.02] cursor-pointer"
                            >
                                <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
                                {isSyncing ? "Syncing..." : "Sync Weather Data"}
                            </button>
                        )}
                    </div>
                </div>

                {/* Summary Widgets Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    <StatCard
                        title="Kerala Average Rainfall"
                        value={`${summary.avgRainfall || 0} mm`}
                        subtitle="Current precipitation scan"
                        color="bg-blue-50 text-blue-600"
                        icon={<CloudRain />}
                    />
                    <StatCard
                        title="Highest Temperature"
                        value={`${summary.highestTemp?.value || 0}°C`}
                        subtitle={summary.highestTemp?.district || "None"}
                        color="bg-rose-50 text-rose-600"
                        icon={<Thermometer />}
                    />
                    <StatCard
                        title="Strongest Winds"
                        value={`${summary.maxWind?.value || 0} km/h`}
                        subtitle={summary.maxWind?.district || "None"}
                        color="bg-emerald-50 text-emerald-600"
                        icon={<Wind />}
                    />
                    <StatCard
                        title="Active State Warnings"
                        value={summary.activeAlertsCount || 0}
                        subtitle="Triggered early warnings"
                        color={summary.activeAlertsCount > 0 ? "bg-red-50 text-red-600 animate-pulse" : "bg-slate-100 text-slate-500"}
                        icon={<AlertTriangle />}
                    />
                </div>

                {/* Alerts Broadcaster */}
                {alerts && alerts.length > 0 && (
                    <Card className="border-red-200 bg-red-50/50">
                        <h3 className="font-bold text-red-800 text-sm flex items-center gap-1.5 uppercase mb-3 tracking-wider">
                            <AlertTriangle className="h-4.5 w-4.5 animate-bounce" /> Active Hazard Warnings Across State
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {alerts.map((alert, idx) => (
                                <div key={idx} className="bg-white border border-red-100 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-start">
                                            <span className="font-bold text-xs uppercase text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                                                {alert.district}
                                            </span>
                                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border shadow-sm ${alert.severity === "Extreme" ? "bg-red-100 text-red-700 border-red-200 animate-pulse" : "bg-amber-100 text-amber-700 border-amber-200"
                                                }`}>
                                                {alert.type} : {alert.severity}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-650 leading-relaxed mt-2">{alert.message}</p>
                                    </div>
                                    <span className="text-[10px] text-slate-400 mt-2 block font-medium">
                                        Issued: {new Date(alert.issuedAt).toLocaleTimeString("en-IN")}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                {/* Master Selector & Detail Panel Grid */}
                <div className="grid grid-cols-12 gap-6">

                    {/* Districts Selector sidebar */}
                    <div className="col-span-12 lg:col-span-4 xl:col-span-3 space-y-4">
                        <Card className="p-4 overflow-hidden h-[600px] flex flex-col">
                            <h3 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider">Select District</h3>
                            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar">
                                {isLoading ? (
                                    <div className="flex justify-center items-center py-20">
                                        <span className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600"></span>
                                    </div>
                                ) : (
                                    weatherData.map((d) => {
                                        const isSelected = selectedDistrict.toLowerCase() === d.district.toLowerCase();
                                        const hasSnAlert = d.alerts && d.alerts.length > 0;
                                        return (
                                            <button
                                                key={d.district}
                                                onClick={() => setSelectedDistrict(d.district)}
                                                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${isSelected
                                                        ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/10 hover:bg-blue-700"
                                                        : "bg-white border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-700"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <MapPin className={`h-4.5 w-4.5 ${isSelected ? "text-white" : "text-slate-400"}`} />
                                                    <span className="font-bold text-sm truncate w-28">{d.district}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 font-sans">
                                                    {hasSnAlert && (
                                                        <span className={`w-2 h-2 rounded-full ${d.alerts.some(a => a.severity === "Extreme") ? "bg-red-500" : "bg-amber-500"} animate-ping`} />
                                                    )}
                                                    <span className={`text-xs font-bold ${isSelected ? "text-blue-10" : "text-slate-400"}`}>
                                                        {d.rainfall > 0 ? `${d.rainfall.toFixed(1)} mm` : `${Math.round(d.temperature)}°C`}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* District details view */}
                    <div className="col-span-12 lg:col-span-8 xl:col-span-9 space-y-6">
                        {isActiveLoading || !activeSnapshot ? (
                            <div className="bg-white rounded-2xl border p-20 flex justify-center items-center h-[600px]">
                                <span className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-blue-600"></span>
                            </div>
                        ) : (
                            <div className="space-y-6">

                                {/* Current District Conditions Panel */}
                                <Card className="p-6 relative overflow-hidden bg-white border border-slate-200 shadow-sm">
                                    {/* Subtle Background Icon */}
                                    <div className="absolute right-6 top-6 opacity-5 pointer-events-none">
                                        <CloudRain className="w-48 h-48 text-slate-900" />
                                    </div>

                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{activeSnapshot.district} District</h2>
                                            <p className="text-sm text-slate-450 mt-1 flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5" /> Checked: {new Date(activeSnapshot.fetchedAt).toLocaleString("en-IN")}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 bg-blue-50 text-blue-800 rounded-2xl px-4 py-2 border border-blue-150">
                                            {activeSnapshot.weather?.condition === "Clear" && <Sun className="w-5 h-5 text-orange-500 animate-spin-slow" />}
                                            {activeSnapshot.weather?.condition === "Cloudy" && <Cloud className="w-5 h-5 text-slate-500" />}
                                            {activeSnapshot.weather?.condition === "Drizzle" && <CloudDrizzle className="w-5 h-5 text-sky-500" />}
                                            {activeSnapshot.weather?.condition === "Rainy" && <CloudRain className="w-5 h-5 text-blue-550" />}
                                            {activeSnapshot.weather?.condition === "Thunderstorm" && <CloudLightning className="w-5 h-5 text-amber-505" />}
                                            <span className="font-extrabold text-sm">{activeSnapshot.weather?.condition}</span>
                                        </div>
                                    </div>

                                    {/* Param grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between">
                                            <span className="text-[10px] uppercase font-bold text-slate-400">Temperature</span>
                                            <div className="flex items-center gap-2 mt-2">
                                                <Thermometer className="h-6 w-6 text-rose-500" />
                                                <h4 className="text-2xl font-extrabold text-slate-800">{activeSnapshot.temperature.toFixed(1)}°C</h4>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between">
                                            <span className="text-[10px] uppercase font-bold text-slate-400">Rainfall (1h)</span>
                                            <div className="flex items-center gap-2 mt-2">
                                                <CloudRain className="h-6 w-6 text-blue-500" />
                                                <h4 className="text-2xl font-extrabold text-slate-800">{activeSnapshot.rainfall.toFixed(1)} mm</h4>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between">
                                            <span className="text-[10px] uppercase font-bold text-slate-400">Wind Velocity</span>
                                            <div className="flex items-center gap-2 mt-2">
                                                <Wind className="h-6 w-6 text-emerald-500" />
                                                <h4 className="text-2xl font-extrabold text-slate-800">{activeSnapshot.wind.speed.toFixed(1)} km/h</h4>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between">
                                            <span className="text-[10px] uppercase font-bold text-slate-400">Relative Humidity</span>
                                            <div className="flex items-center gap-2 mt-2">
                                                <Droplet className="h-6 w-6 text-cyan-500" />
                                                <h4 className="text-2xl font-extrabold text-slate-800">{activeSnapshot.humidity}%</h4>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs font-semibold">
                                            <span className="text-slate-400">Atmospheric pressure</span>
                                            <span className="text-slate-700 font-bold">{activeSnapshot.pressure} hPa</span>
                                        </div>
                                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs font-semibold">
                                            <span className="text-slate-400">Wind Direction</span>
                                            <span className="text-slate-700 font-bold flex items-center gap-1">
                                                <Compass className="w-3.5 h-3.5 text-indigo-500" /> {activeSnapshot.wind.direction}°
                                            </span>
                                        </div>
                                    </div>
                                </Card>

                                {/* Graphical Analytis Panels (Reengineered using High Fidelity SVG Area/Line/Bar graphics) */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                    {/* Temperature Graph Widget */}
                                    <Card p={6}>
                                        <h3 className="font-bold text-slate-800 text-sm uppercase mb-4 tracking-wider">24-Hour Temperature Graph</h3>
                                        {hourlyForecast.length > 0 ? (
                                            <div className="space-y-4">
                                                {/* Custom SVG Line Chart */}
                                                <div className="w-full h-[180px] bg-slate-900 rounded-xl p-3 border border-white/5 relative">
                                                    <svg className="w-full h-full" viewBox="0 0 400 120" preserveAspectRatio="none">
                                                        <defs>
                                                            <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
                                                                <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                                                            </linearGradient>
                                                        </defs>
                                                        {/* Gridlines */}
                                                        <line x1="0" y1="30" x2="400" y2="30" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                                                        <line x1="0" y1="60" x2="400" y2="60" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                                                        <line x1="0" y1="90" x2="400" y2="90" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

                                                        {/* Line path builder */}
                                                        {(() => {
                                                            const points = hourlyForecast.slice(0, 12).map((h, i) => {
                                                                const x = (i / 11) * 400;
                                                                // Normalized Y: max 38C represents 10, min 20C represents 110
                                                                const y = 110 - ((Math.min(38, Math.max(18, h.temperature)) - 18) / 20) * 100;
                                                                return { x, y };
                                                            });

                                                            const pathD = points.reduce((acc, p, i) => {
                                                                return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
                                                            }, "");

                                                            const areaD = `${pathD} L ${points[points.length - 1].x} 120 L ${points[0].x} 120 Z`;

                                                            return (
                                                                <>
                                                                    <path d={areaD} fill="url(#tempGradient)" />
                                                                    <path d={pathD} fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                                                    {points.map((p, i) => (
                                                                        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#ffffff" stroke="#ef4444" strokeWidth="1.5" />
                                                                    ))}
                                                                </>
                                                            );
                                                        })()}
                                                    </svg>
                                                </div>
                                                {/* Legends */}
                                                <div className="flex justify-between text-[10px] text-slate-400 px-3">
                                                    <span>{new Date(hourlyForecast[0]?.time).toLocaleTimeString("en-IN", { hour: "numeric" })}</span>
                                                    <span>+6 hrs</span>
                                                    <span>+12 hrs</span>
                                                    <span>+18 hrs</span>
                                                    <span>{new Date(hourlyForecast[23]?.time).toLocaleTimeString("en-IN", { hour: "numeric" })}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-400">Trend data unavailable.</p>
                                        )}
                                    </Card>

                                    {/* Rainfall Bar Chart Widget */}
                                    <Card p={6}>
                                        <h3 className="font-bold text-slate-800 text-sm uppercase mb-4 tracking-wider">Rainfall Forecast Graph</h3>
                                        {hourlyForecast.length > 0 ? (
                                            <div className="space-y-4">
                                                {/* Custom SVG Bar Chart */}
                                                <div className="w-full h-[180px] bg-slate-900 rounded-xl p-3 border border-white/5 relative">
                                                    <svg className="w-full h-full" viewBox="0 0 400 120" preserveAspectRatio="none">
                                                        {/* Gridlines */}
                                                        <line x1="0" y1="30" x2="400" y2="30" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                                                        <line x1="0" y1="60" x2="400" y2="60" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                                                        <line x1="0" y1="90" x2="400" y2="90" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

                                                        {/* Bar building */}
                                                        {hourlyForecast.slice(0, 12).map((h, i) => {
                                                            const barWidth = 18;
                                                            const x = (i / 11) * 360 + 10;
                                                            // Max precip 30mm represented as 100, min 0mm as 0
                                                            const height = Math.round(((h.precipitation || 0) / 30) * 110);
                                                            const y = 120 - Math.max(2, height);

                                                            return (
                                                                <rect
                                                                    key={i}
                                                                    x={x}
                                                                    y={y}
                                                                    width={barWidth}
                                                                    height={Math.max(2, height)}
                                                                    rx="2"
                                                                    fill="#2563eb"
                                                                    opacity="0.85"
                                                                    className="transition-all hover:opacity-100"
                                                                />
                                                            );
                                                        })}
                                                    </svg>
                                                </div>
                                                {/* Legends */}
                                                <div className="flex justify-between text-[10px] text-slate-400 px-3">
                                                    <span>{new Date(hourlyForecast[0]?.time).toLocaleTimeString("en-IN", { hour: "numeric" })}</span>
                                                    <span>+6 hrs</span>
                                                    <span>+12 hrs</span>
                                                    <span>+18 hrs</span>
                                                    <span>{new Date(hourlyForecast[23]?.time).toLocaleTimeString("en-IN", { hour: "numeric" })}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-400">Rainfall forecast unavailable.</p>
                                        )}
                                    </Card>

                                    {/* Wind History Line Chart Widget */}
                                    <Card p={6}>
                                        <h3 className="font-bold text-slate-800 text-sm uppercase mb-4 tracking-wider">Wind Velocity (Hourly)</h3>
                                        {hourlyForecast.length > 0 ? (
                                            <div className="space-y-4">
                                                <div className="w-full h-[180px] bg-slate-900 rounded-xl p-3 border border-white/5 relative">
                                                    <svg className="w-full h-full" viewBox="0 0 400 120" preserveAspectRatio="none">
                                                        <defs>
                                                            <linearGradient id="windGradient" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                                                                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                                                            </linearGradient>
                                                        </defs>
                                                        <line x1="0" y1="30" x2="400" y2="30" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                                                        <line x1="0" y1="60" x2="400" y2="60" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                                                        <line x1="0" y1="90" x2="400" y2="90" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

                                                        {(() => {
                                                            const points = hourlyForecast.slice(0, 12).map((h, i) => {
                                                                const x = (i / 11) * 400;
                                                                // Normalized Y: max 60km/h represents 10, min 0km/h represents 110
                                                                const y = 110 - ((Math.min(60, Math.max(0, h.windSpeed)) / 60) * 100);
                                                                return { x, y };
                                                            });

                                                            const pathD = points.reduce((acc, p, i) => {
                                                                return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
                                                            }, "");

                                                            const areaD = `${pathD} L ${points[points.length - 1].x} 120 L ${points[0].x} 120 Z`;

                                                            return (
                                                                <>
                                                                    <path d={areaD} fill="url(#windGradient)" />
                                                                    <path d={pathD} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                                                    {points.map((p, i) => (
                                                                        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#ffffff" stroke="#10b981" strokeWidth="1.5" />
                                                                    ))}
                                                                </>
                                                            );
                                                        })()}
                                                    </svg>
                                                </div>
                                                <div className="flex justify-between text-[10px] text-slate-400 px-3">
                                                    <span>{new Date(hourlyForecast[0]?.time).toLocaleTimeString("en-IN", { hour: "numeric" })}</span>
                                                    <span>+6 hrs</span>
                                                    <span>+12 hrs</span>
                                                    <span>+18 hrs</span>
                                                    <span>{new Date(hourlyForecast[23]?.time).toLocaleTimeString("en-IN", { hour: "numeric" })}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-400">Wind history unavailable.</p>
                                        )}
                                    </Card>

                                    {/* Humidity Forecast Line Chart Widget */}
                                    <Card p={6}>
                                        <h3 className="font-bold text-slate-800 text-sm uppercase mb-4 tracking-wider">Relative Humidity Profile</h3>
                                        {hourlyForecast.length > 0 ? (
                                            <div className="space-y-4">
                                                <div className="w-full h-[180px] bg-slate-900 rounded-xl p-3 border border-white/5 relative">
                                                    <svg className="w-full h-full" viewBox="0 0 400 120" preserveAspectRatio="none">
                                                        <defs>
                                                            <linearGradient id="humidityGradient" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
                                                                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                                                            </linearGradient>
                                                        </defs>
                                                        <line x1="0" y1="30" x2="400" y2="30" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                                                        <line x1="0" y1="60" x2="400" y2="60" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                                                        <line x1="0" y1="90" x2="400" y2="90" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

                                                        {(() => {
                                                            const points = hourlyForecast.slice(0, 12).map((h, i) => {
                                                                const x = (i / 11) * 400;
                                                                // Normalized Y: max 100% represents 10, min 40% represents 110
                                                                const y = 110 - (((Math.min(100, Math.max(40, h.humidity)) - 40) / 60) * 100);
                                                                return { x, y };
                                                            });

                                                            const pathD = points.reduce((acc, p, i) => {
                                                                return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
                                                            }, "");

                                                            const areaD = `${pathD} L ${points[points.length - 1].x} 120 L ${points[0].x} 120 Z`;

                                                            return (
                                                                <>
                                                                    <path d={areaD} fill="url(#humidityGradient)" />
                                                                    <path d={pathD} fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                                                    {points.map((p, i) => (
                                                                        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#ffffff" stroke="#06b6d4" strokeWidth="1.5" />
                                                                    ))}
                                                                </>
                                                            );
                                                        })()}
                                                    </svg>
                                                </div>
                                                <div className="flex justify-between text-[10px] text-slate-400 px-3">
                                                    <span>{new Date(hourlyForecast[0]?.time).toLocaleTimeString("en-IN", { hour: "numeric" })}</span>
                                                    <span>+6 hrs</span>
                                                    <span>+12 hrs</span>
                                                    <span>+18 hrs</span>
                                                    <span>{new Date(hourlyForecast[23]?.time).toLocaleTimeString("en-IN", { hour: "numeric" })}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-400">Humidity profiles unavailable.</p>
                                        )}
                                    </Card>
                                </div>

                                {/* 7-Day daily forecast cards */}
                                <Card>
                                    <h3 className="font-bold text-slate-800 text-sm uppercase mb-4 tracking-wider">7-Day Local Forecast</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
                                        {dailyForecast.map((day, idx) => {
                                            const dayName = new Date(day.date).toLocaleDateString("en-IN", { weekday: "short" });
                                            const dateString = new Date(day.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
                                            return (
                                                <div key={idx} className="bg-slate-50 border border-slate-150 rounded-2xl p-4 text-center space-y-3 hover:bg-slate-100 hover:shadow-xs transition duration-200">
                                                    <div className="space-y-0.5">
                                                        <p className="font-extrabold text-sm text-slate-700 m-0">{dayName}</p>
                                                        <span className="text-[10px] text-slate-400">{dateString}</span>
                                                    </div>
                                                    <div className="flex justify-center text-slate-600">
                                                        {day.condition === "Clear" && <Sun className="w-7 h-7 text-orange-500 animate-spin-slow" />}
                                                        {day.condition === "Cloudy" && <Cloud className="w-7 h-7 text-slate-500" />}
                                                        {day.condition === "Drizzle" && <CloudDrizzle className="w-7 h-7 text-sky-500" />}
                                                        {day.condition === "Rainy" && <CloudRain className="w-7 h-7 text-blue-500" />}
                                                        {day.condition === "Thunderstorm" && <CloudLightning className="w-7 h-7 text-amber-500" />}
                                                    </div>
                                                    <div>
                                                        <span className="text-xs font-extrabold text-slate-800">{Math.round(day.tempMax)}°</span>
                                                        <span className="text-[10px] text-slate-400 ml-1">/{Math.round(day.tempMin)}°</span>
                                                    </div>
                                                    {day.precipitationSum > 0 && (
                                                        <span className="inline-block bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded text-[9px] font-bold">
                                                            {day.precipitationSum.toFixed(1)} mm
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </Card>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default WeatherPage;
