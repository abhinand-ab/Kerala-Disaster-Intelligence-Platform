import { useState, useEffect } from "react";
import { CloudRain, Wind, Droplets, Sun, Sparkles } from "lucide-react";
import { getPublicWeather } from "../../services/publicService";
import { toast } from "react-hot-toast";

const PublicWeather = () => {
    const [weatherData, setWeatherData] = useState(null);
    const [selectedDistrict, setSelectedDistrict] = useState("Thiruvananthapuram");
    const [isLoading, setIsLoading] = useState(true);

    const districts = [
        "Thiruvananthapuram", "Kollam", "Pathanamthitta", "Alappuzha", "Kottayam",
        "Idukki", "Ernakulam", "Thrissur", "Palakkad", "Malappuram",
        "Kozhikode", "Wayanad", "Kannur", "Kasaragod"
    ];

    useEffect(() => {
        const fetchWeather = async () => {
            setIsLoading(true);
            try {
                const data = await getPublicWeather({ district: selectedDistrict });
                // If data is array (returned list), find the one or use first
                if (Array.isArray(data)) {
                    setWeatherData(data[0] || null);
                } else {
                    setWeatherData(data);
                }
            } catch (err) {
                console.error("Public weather error:", err);
                toast.error("Failed to query district weather stats.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchWeather();
    }, [selectedDistrict]);

    return (
        <div className="space-y-8 pb-12">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-2">
                        <CloudRain className="text-cyan-400 w-6 h-6 animate-pulse" /> Meteorological & Rain Telemetry
                    </h1>
                    <p className="text-xs text-slate-400 font-medium">Real-time weather station metrics and early precipitation hazard diagnostics.</p>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-bold shrink-0">District:</span>
                    <select
                        value={selectedDistrict}
                        onChange={(e) => setSelectedDistrict(e.target.value)}
                        className="bg-slate-950 border border-slate-800 focus:border-cyan-500 px-3.5 py-2 rounded-xl text-xs outline-none text-white transition max-w-[180px]"
                    >
                        {districts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
            </div>

            {isLoading ? (
                <div className="py-24 text-center text-xs text-slate-500 animate-pulse">
                    Retrieving district atmospheric sensors...
                </div>
            ) : !weatherData ? (
                <div className="py-20 text-center text-xs text-slate-500 border border-slate-850 bg-slate-950/20 rounded-2xl">
                    No active telemetry snapshot saved for {selectedDistrict}.
                </div>
            ) : (
                <div className="space-y-8">

                    {/* Current Telemetry Widgets */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

                        {/* Temp */}
                        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Temperature</span>
                                <span className="text-2xl font-black text-white">{(weatherData.temp || 27.5).toFixed(1)}°C</span>
                            </div>
                            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
                                <Sun className="w-5 h-5 animate-spin-slow" />
                            </div>
                        </div>

                        {/* Rain */}
                        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Accumulation (1h)</span>
                                <span className="text-2xl font-black text-white">{(weatherData.rainfall || 0).toFixed(1)} mm</span>
                            </div>
                            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
                                <CloudRain className="w-5 h-5 animate-bounce-slow" />
                            </div>
                        </div>

                        {/* Humidity */}
                        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Relative Humidity</span>
                                <span className="text-2xl font-black text-white">{Math.round(weatherData.humidity || 82)}%</span>
                            </div>
                            <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl">
                                <Droplets className="w-5 h-5" />
                            </div>
                        </div>

                        {/* Wind */}
                        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Wind Speed</span>
                                <span className="text-2xl font-black text-white">{(weatherData.windSpeed || 12).toFixed(1)} km/h</span>
                            </div>
                            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
                                <Wind className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    {/* Alerts widget for target district */}
                    {weatherData.alerts && weatherData.alerts.length > 0 && (
                        <div className="p-5 bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-2xl space-y-3">
                            <span className="text-[10px] bg-red-500/20 border border-red-500/30 text-red-300 font-extrabold uppercase px-2 py-0.5 rounded tracking-wider">
                                Live Warning Active
                            </span>
                            {weatherData.alerts.map((al, idx) => (
                                <div key={idx} className="space-y-1.5">
                                    <h4 className="font-bold text-white text-base">{al.type}</h4>
                                    <p className="text-xs text-red-200 leading-relaxed font-semibold">{al.message}</p>
                                    <span className="text-[10px] text-slate-450 block">Issued at: {new Date(al.issuedAt).toLocaleDateString()}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Seven Day Forecast summary */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
                            <Sparkles size={16} className="text-cyan-400" /> 7-Day Meteorological Forecast
                        </h3>

                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
                            {(!weatherData.forecast || weatherData.forecast.length === 0) ? (
                                <span className="text-xs text-slate-500 block col-span-7 text-center py-6 border border-slate-850 rounded">
                                    Adaptive projection parameters loading...
                                </span>
                            ) : (
                                weatherData.forecast.map((fc, fcIdx) => (
                                    <div key={fcIdx} className="bg-slate-900 border border-slate-850 p-4 rounded-2xl text-center space-y-2">
                                        <span className="text-[10px] font-bold text-slate-400 block">{fc.day || "Day"}</span>
                                        <span className="text-xs font-bold text-white block">{fc.condition || "Moderate"}</span>
                                        <span className="text-lg font-black text-cyan-400 block">{Math.round(fc.temp || 27)}°C</span>
                                        <span className="text-[10px] text-slate-450 block">🌧️ {(fc.rainfall || 0).toFixed(1)}mm</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* SVG Trend charts */}
                    {weatherData.history && weatherData.history.length > 0 && (
                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                            <span className="text-xs font-bold text-slate-350 uppercase block">District Precipitation History (Past Hours)</span>

                            {/* Simple responsive SVG line chart representing rainfall history */}
                            <div className="h-48 w-full">
                                <svg className="w-full h-full" viewBox="0 0 500 150">
                                    {/* Grid Lines */}
                                    <line x1="30" y1="20" x2="480" y2="20" stroke="#1e293b" strokeDasharray="3" />
                                    <line x1="30" y1="60" x2="480" y2="60" stroke="#1e293b" strokeDasharray="3" />
                                    <line x1="30" y1="100" x2="480" y2="100" stroke="#1e293b" strokeDasharray="3" />
                                    <line x1="30" y1="130" x2="480" y2="130" stroke="#334155" />

                                    {/* Render path */}
                                    {(() => {
                                        const values = weatherData.history.map(pt => pt.rainfall || 0);
                                        const maxV = Math.max(...values, 10);
                                        const xStep = 450 / Math.max(values.length - 1, 1);

                                        const points = values.map((val, idx) => {
                                            const x = 30 + idx * xStep;
                                            const y = 130 - (val / maxV) * 100;
                                            return `${x},${y}`;
                                        }).join(" ");

                                        return (
                                            <>
                                                <polyline
                                                    fill="none"
                                                    stroke="#06b6d4"
                                                    strokeWidth="3.5"
                                                    points={points}
                                                />
                                                {/* Circles for values */}
                                                {values.map((val, idx) => {
                                                    const x = 30 + idx * xStep;
                                                    const y = 130 - (val / maxV) * 100;
                                                    return (
                                                        <circle
                                                            key={idx}
                                                            cx={x}
                                                            cy={y}
                                                            r="4"
                                                            fill="#ffffff"
                                                            stroke="#0891b2"
                                                            strokeWidth="2"
                                                        />
                                                    );
                                                })}
                                            </>
                                        );
                                    })()}
                                </svg>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PublicWeather;
