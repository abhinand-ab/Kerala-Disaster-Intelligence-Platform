import { useSensorsList, useSensorAnalytics } from "../../../hooks/useSensors";
import Card from "../../common/Card";
import { Cpu, Waves, Battery, Wifi, AlertTriangle, CloudRain, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

const IoTSensorWidget = () => {
    const { data: sensors = [], isLoading: isListLoading } = useSensorsList({}, { refetchInterval: 5000 });
    const { data: analyticsRes, isLoading: isAnalyticLoading } = useSensorAnalytics({ refetchInterval: 5000 });

    const widgets = analyticsRes?.widgets || {
        totalSensors: 0,
        onlineSensors: 0,
        offlineSensors: 0,
        maxWaterLevel: 0,
        maxRainfall: 0,
    };

    // Find river gauges to list river levels
    const riverGauges = sensors.filter(
        (s) => s.sensorType === "RiverGauge" || s.sensorType === "WaterLevelGauge"
    );

    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-1.5">
                    <Cpu className="h-5 w-5 text-blue-600 animate-pulse" />
                    <h3 className="font-semibold text-slate-800">Telemetry Monitors</h3>
                </div>
                <Link to="/sensors" className="text-xs font-bold text-blue-600 hover:underline">
                    Sensor Station
                </Link>
            </div>

            {isListLoading || isAnalyticLoading ? (
                <div className="flex justify-center items-center py-6">
                    <span className="animate-spin rounded-full h-5 w-5 border-2 border-slate-205 border-t-blue-600"></span>
                </div>
            ) : (
                <div className="space-y-4 text-xs font-sans">

                    {/* Quick Metrics Bar */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-2">
                            <span className="text-[9px] font-bold text-slate-400 uppercase block leading-none mb-1">Gauges</span>
                            <span className="text-sm font-bold text-slate-700">{widgets.totalSensors}</span>
                        </div>
                        <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-2">
                            <span className="text-[9px] font-bold text-emerald-600 uppercase block leading-none mb-1">Uptime</span>
                            <span className="text-sm font-extrabold text-emerald-700">{widgets.onlineSensors}</span>
                        </div>
                        <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-2">
                            <span className="text-[9px] font-bold text-rose-600 uppercase block leading-none mb-1">Offline</span>
                            <span className={`text-sm font-extrabold ${widgets.offlineSensors > 0 ? "text-rose-650 animate-pulse" : "text-slate-500"}`}>
                                {widgets.offlineSensors}
                            </span>
                        </div>
                    </div>

                    {/* Active Sensor Alerts */}
                    {(() => {
                        const alerts = sensors.filter(
                            (s) =>
                                s.status === "Offline" ||
                                s.batteryLevel < 20 ||
                                (s.lastReading?.waterLevel && s.lastReading.waterLevel > 4.5) ||
                                (s.lastReading?.rainfall && s.lastReading.rainfall > 50)
                        );

                        if (alerts.length === 0) {
                            return (
                                <div className="flex items-center gap-1.5 p-2 bg-emerald-50/40 text-emerald-700 rounded-xl border border-emerald-100 text-[10px]">
                                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                    <span>All environmental telemetry channels reporting clear.</span>
                                </div>
                            );
                        }

                        return (
                            <div className="space-y-1.5 border-t border-slate-100 pt-3">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                                    Active System Hazards
                                </span>
                                <div className="space-y-1 max-h-[90px] overflow-y-auto pr-1">
                                    {alerts.map((al) => (
                                        <div
                                            key={al._id}
                                            className="flex justify-between items-center bg-rose-50 border border-rose-100 p-1.5 rounded-lg text-[10px] text-rose-700"
                                        >
                                            <span className="font-extrabold truncate max-w-[150px]">{al.sensorName}</span>
                                            <span className="font-black bg-rose-100 text-rose-700 px-1 py-0.2 rounded text-[9px] uppercase shrink-0">
                                                {al.status === "Offline"
                                                    ? "Offline"
                                                    : al.batteryLevel < 20
                                                        ? "Low Bat"
                                                        : al.lastReading?.waterLevel > 6.0
                                                            ? "Danger Height"
                                                            : "High Flow"}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })()}

                    {/* River Water Levels List */}
                    <div className="space-y-1.5 border-t border-slate-100 pt-3">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                            Live River Depth
                        </span>
                        <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                            {riverGauges.map((rg) => {
                                const reading = rg.lastReading?.waterLevel;
                                const levelColor =
                                    reading > 6.0
                                        ? "text-rose-600"
                                        : reading > 4.5
                                            ? "text-amber-600 font-bold"
                                            : "text-blue-600 font-bold";

                                return (
                                    <div
                                        key={rg._id}
                                        className="flex justify-between items-center py-1 hover:bg-slate-50 rounded px-1 transition"
                                    >
                                        <div className="min-w-0">
                                            <p className="font-bold text-slate-700 truncate">{rg.sensorName}</p>
                                            <span className="text-[9px] text-slate-400 mt-0.5 block italic">{rg.river || rg.district}</span>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className={`${levelColor} font-black text-[11px]`}>
                                                {reading !== undefined && reading !== null ? `${reading.toFixed(2)}m` : "--"}
                                            </span>
                                            <div className="flex items-center gap-1 justify-end text-[9px] text-slate-400 mt-0.2">
                                                <Wifi className="w-2.5 h-2.5 text-slate-350" />
                                                <span>{rg.signalStrength}%</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {riverGauges.length === 0 && (
                                <p className="text-[10px] text-slate-450 italic text-center py-2">No gauge metrics active.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
};

export default IoTSensorWidget;
