import { useState, useMemo } from "react";
import MainLayout from "../../components/layout/MainLayout";
import Header from "../../components/layout/Header";
import Card from "../../components/common/Card";
import StatCard from "../../components/common/StatCard";
import BackButton from "../../components/common/BackButton";
import { useRisk, useRiskHistory } from "../../hooks/useRisk";
import useShelters from "../../hooks/useShelters";
import useRescueTeams from "../../hooks/useRescueTeams";
import useVehicles from "../../hooks/useVehicles";
import useWarehouses from "../../hooks/useWarehouses";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-hot-toast";
import {
    CloudRain,
    Mountain,
    AlertTriangle,
    RefreshCw,
    MapPin,
    Calendar,
    Waves,
    Trees,
    Navigation,
    Shield,
    Truck,
    Building,
    Activity,
    Compass,
    Droplet
} from "lucide-react";

const RiskPage = () => {
    const { user } = useAuth();
    const isAdmin = user?.role?.toLowerCase() === "admin";

    const {
        riskAssessments = [],
        riskSummary = {},
        isLoading,
        isSyncing,
        syncRisk,
    } = useRisk({ refetchInterval: 30000 });

    const [selectedDistrict, setSelectedDistrict] = useState("Idukki");
    const [historyDays, setHistoryDays] = useState(7);

    // Grab resources for Step 11 Integration
    const { shelters = [], isLoading: sheltersLoading } = useShelters();
    const { teams = [], isLoading: teamsLoading } = useRescueTeams();
    const { vehicles = [], isLoading: vehiclesLoading } = useVehicles();
    const { warehouses = [], isLoading: warehousesLoading } = useWarehouses();

    const { data: districtHistoryDataRaw } = useRiskHistory({
        district: selectedDistrict,
        days: historyDays,
    });

    const districtHistoryData = useMemo(() => {
        return districtHistoryDataRaw || [];
    }, [districtHistoryDataRaw]);

    const handleSync = async () => {
        try {
            await syncRisk();
            toast.success("Risk index parameters re-calculated across all districts!");
        } catch (e) {
            toast.error(e || "Failed to trigger risk recalculation.");
        }
    };

    const activeAssessment = useMemo(() => {
        if (!riskAssessments) return null;
        return riskAssessments.find(
            (a) => a.district.toLowerCase() === selectedDistrict.toLowerCase()
        );
    }, [riskAssessments, selectedDistrict]);

    // Filters resources for suggestion panel (Step 11)
    const nearbyShelters = useMemo(() => {
        return shelters.filter(s => s.district.toLowerCase() === selectedDistrict.toLowerCase() && s.status === "Open");
    }, [shelters, selectedDistrict]);

    const nearbyTeams = useMemo(() => {
        return teams.filter(t => t.district.toLowerCase() === selectedDistrict.toLowerCase() && t.status === "Available");
    }, [teams, selectedDistrict]);

    const nearbyVehicles = useMemo(() => {
        return vehicles.filter(v => v.district.toLowerCase() === selectedDistrict.toLowerCase() && v.status === "Available");
    }, [vehicles, selectedDistrict]);

    const nearbyWarehouses = useMemo(() => {
        return warehouses.filter(w => w.district.toLowerCase() === selectedDistrict.toLowerCase());
    }, [warehouses, selectedDistrict]);

    // List of high risk districts for High Risk Area List widget
    const highRiskAreas = useMemo(() => {
        return riskAssessments.filter(a => a.riskLevel === "High" || a.riskLevel === "Extreme");
    }, [riskAssessments]);

    return (
        <MainLayout>
            <div className="space-y-6 bg-slate-50 min-h-screen p-1 text-slate-805">
                <BackButton />

                {/* Master Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            <Mountain className="h-8 w-8 text-rose-600 animate-pulse" />
                            Flood & Landslide Risk Intelligence
                        </h1>
                        <p className="text-slate-500 mt-1">
                            Multi-indicator predictive modeling combining weather feeds, topography slope, and historical events.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400 font-semibold bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                            Updates automatically
                        </span>
                        {isAdmin && (
                            <button
                                disabled={isSyncing}
                                onClick={handleSync}
                                className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white font-semibold px-4.5 py-2.5 rounded-xl shadow-lg shadow-rose-500/10 transition-all hover:scale-[1.02] cursor-pointer"
                            >
                                <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
                                {isSyncing ? "Evaluating..." : "Run Risk Engine"}
                            </button>
                        )}
                    </div>
                </div>

                {/* Risk Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    <StatCard
                        title="State Average Risk Score"
                        value={`${riskSummary.avgRiskScore || 0}`}
                        subtitle="Combined index 0-100"
                        color="bg-indigo-50 text-indigo-700"
                        icon={<Activity />}
                    />
                    <StatCard
                        title="Extreme Risk Districts"
                        value={riskSummary.extremeDistricts?.length || 0}
                        subtitle={riskSummary.extremeDistricts?.join(", ") || "None currently"}
                        color={riskSummary.extremeDistricts?.length > 0 ? "bg-red-50 text-red-650 font-bold" : "bg-slate-50 text-slate-500"}
                        icon={<AlertTriangle />}
                    />
                    <StatCard
                        title="High Hazard Districts"
                        value={riskSummary.highDistricts?.length || 0}
                        subtitle={riskSummary.highDistricts?.join(", ") || "None currently"}
                        color={riskSummary.highDistricts?.length > 0 ? "bg-amber-50 text-amber-700" : "bg-slate-50 text-slate-500"}
                        icon={<MapPin />}
                    />
                    <StatCard
                        title="Evacuations Required"
                        value={highRiskAreas.length}
                        subtitle="Shelters stand by"
                        color={highRiskAreas.length > 0 ? "bg-red-50 border-red-200 text-red-600 animate-pulse font-bold" : "bg-emerald-50 text-emerald-600"}
                        icon={<Navigation />}
                    />
                </div>

                {/* Master Selector & Detail Panel Grid */}
                <div className="grid grid-cols-12 gap-6">
                    {/* Districts Selector sidebar */}
                    <div className="col-span-12 lg:col-span-4 xl:col-span-3 space-y-4">
                        <Card className="p-4 overflow-hidden h-[650px] flex flex-col">
                            <h3 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider">Kerala Districts</h3>
                            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar">
                                {isLoading ? (
                                    <div className="flex justify-center items-center py-20">
                                        <span className="animate-spin rounded-full h-8 w-8 border-4 border-slate-204 border-t-red-600"></span>
                                    </div>
                                ) : (
                                    riskAssessments.map((a) => {
                                        const isSelected = selectedDistrict.toLowerCase() === a.district.toLowerCase();
                                        const isDanger = a.riskLevel === "Extreme" || a.riskLevel === "High";
                                        return (
                                            <button
                                                key={a.district}
                                                onClick={() => setSelectedDistrict(a.district)}
                                                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${isSelected
                                                    ? "bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/10 hover:bg-rose-700"
                                                    : "bg-white border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-700"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <MapPin className={`h-4.5 w-4.5 ${isSelected ? "text-white" : "text-slate-400"}`} />
                                                    <span className="font-bold text-sm truncate w-24">{a.district}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={`text-[10px] px-1.5 py-0.5 rounded font-extrabold shadow-sm ${a.riskLevel === "Extreme"
                                                            ? "bg-red-600 text-white animate-pulse"
                                                            : a.riskLevel === "High"
                                                                ? "bg-amber-500 text-white"
                                                                : a.riskLevel === "Moderate"
                                                                    ? "bg-yellow-100 text-slate-800 bg-yellow-100"
                                                                    : "bg-slate-100 text-slate-600"
                                                            }`}
                                                    >
                                                        {a.riskScore}
                                                    </span>
                                                    {isDanger && (
                                                        <span className="w-1.5 h-1.5 bg-red-650 rounded-full animate-ping" />
                                                    )}
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
                        {!activeAssessment ? (
                            <div className="bg-white rounded-2xl border border-slate-200 p-20 flex justify-center items-center h-[650px]">
                                <span className="animate-spin rounded-full h-10 w-10 border-4 border-slate-204 border-t-red-600"></span>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Current District Conditions Panel */}
                                <Card className="p-6 relative overflow-hidden bg-white border border-slate-200 shadow-sm">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{activeAssessment.district} District</h2>
                                            <p className="text-sm text-slate-450 mt-1 flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5" /> Evaluated: {new Date(activeAssessment.createdAt).toLocaleString("en-IN")}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1.5">
                                            <span
                                                className={`text-sm font-extrabold uppercase px-4 py-1.5 rounded-2xl border flex items-center gap-1.5 ${activeAssessment.riskLevel === "Extreme"
                                                    ? "bg-red-100 text-red-700 border-red-202 animate-pulse"
                                                    : activeAssessment.riskLevel === "High"
                                                        ? "bg-amber-100 text-amber-700 border-amber-202"
                                                        : activeAssessment.riskLevel === "Moderate"
                                                            ? "bg-yellow-50 text-yellow-750 border-yellow-250"
                                                            : "bg-slate-100 text-slate-600 border-slate-200"
                                                    }`}
                                            >
                                                <AlertTriangle className="h-4 w-4" />
                                                {activeAssessment.riskLevel} Risk ({activeAssessment.riskScore}/100)
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-bold bg-slate-50 px-2 py-0.5 rounded border border-slate-150">
                                                Top danger: {activeAssessment.riskType}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Dual Indicator Section */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                        {/* Flood Risk Indicators */}
                                        <div className="bg-blue-50/40 rounded-2xl p-5 border border-blue-100 space-y-4">
                                            <h3 className="text-sm font-extrabold text-blue-800 uppercase tracking-wider flex items-center gap-2">
                                                <Waves className="h-5 w-5 text-blue-600 animate-bounce" />
                                                Flood Risk Indicators
                                            </h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-white p-3 rounded-xl border border-blue-50">
                                                    <p className="text-[10px] uppercase font-bold text-slate-450">Active Rainfall</p>
                                                    <p className="text-xl font-extrabold text-slate-800 mt-1">{activeAssessment.rainfall.toFixed(1)} mm</p>
                                                </div>
                                                <div className="bg-white p-3 rounded-xl border border-blue-50">
                                                    <p className="text-[10px] uppercase font-bold text-slate-450">River Level</p>
                                                    <p className="text-xl font-extrabold text-slate-800 mt-1">{activeAssessment.riverLevel.toFixed(2)} m</p>
                                                </div>
                                                <div className="bg-white p-3 rounded-xl border border-blue-50 col-span-2">
                                                    <div className="flex justify-between text-[10px] uppercase font-bold text-slate-450 mb-1">
                                                        <span>Saturated Soil Component</span>
                                                        <span>{activeAssessment.soilMoisture}%</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                                        <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: `${activeAssessment.soilMoisture}%` }}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Landslide Risk Indicators */}
                                        <div className="bg-amber-50/30 rounded-2xl p-5 border border-amber-100 space-y-4">
                                            <h3 className="text-sm font-extrabold text-amber-800 uppercase tracking-wider flex items-center gap-2">
                                                <Mountain className="h-5 w-5 text-amber-600 animate-pulse" />
                                                Landslide Risk Indicators
                                            </h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-white p-3 rounded-xl border border-amber-50">
                                                    <p className="text-[10px] uppercase font-bold text-slate-450">Terrain Slope Index</p>
                                                    <p className="text-xl font-extrabold text-slate-800 mt-1">{activeAssessment.slopeIndex}%</p>
                                                </div>
                                                <div className="bg-white p-3 rounded-xl border border-amber-50">
                                                    <p className="text-[10px] uppercase font-bold text-slate-450 font-sans">Vegetation Density</p>
                                                    <p className="text-xl font-extrabold text-slate-800 mt-1">{activeAssessment.vegetationIndex}%</p>
                                                </div>
                                                <div className="bg-white p-3 rounded-xl border border-amber-50 col-span-2">
                                                    <div className="flex justify-between text-[10px] uppercase font-bold text-slate-450 mb-1">
                                                        <span>Vulnerability Factor</span>
                                                        <span>{Math.max(0, 100 - activeAssessment.vegetationIndex)}%</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                                        <div className="bg-amber-600 h-full rounded-full transition-all" style={{ width: `${Math.max(0, 100 - activeAssessment.vegetationIndex)}%` }}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Recommendations */}
                                    <div className="mt-6 border-t border-slate-150 pt-5">
                                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2.5">Distict Advisory Recommendations</h3>
                                        <ul className="space-y-2">
                                            {activeAssessment.recommendations.map((rec, i) => (
                                                <li key={i} className="flex gap-2 text-xs md:text-sm text-slate-707 items-start">
                                                    <span className={`text-sm mt-0.5 ${activeAssessment.riskLevel === "Extreme" ? "text-red-500" : "text-amber-500"}`}>•</span>
                                                    <span className="font-medium leading-relaxed">{rec}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </Card>

                                {/* Historical Risk Chart Panel */}
                                <Card className="p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Historical Susceptibility Trend</h3>
                                        <select
                                            value={historyDays}
                                            onChange={(e) => setHistoryDays(Number(e.target.value))}
                                            className="border border-slate-205 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none bg-white text-slate-800"
                                        >
                                            <option value={3}>Last 3 Days</option>
                                            <option value={7}>Last 7 Days</option>
                                            <option value={14}>Last 14 Days</option>
                                        </select>
                                    </div>

                                    {districtHistoryData.length > 0 ? (
                                        <div className="space-y-4">
                                            {/* High Fidelity Area SVG Chart */}
                                            <div className="w-full h-[220px] bg-slate-900 rounded-xl p-4 border border-white/5 relative">
                                                <svg className="w-full h-full" viewBox="0 0 500 120" preserveAspectRatio="none">
                                                    <defs>
                                                        <linearGradient id="scoreAreaGradient" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.4" />
                                                            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
                                                        </linearGradient>
                                                    </defs>

                                                    {/* Grid lines */}
                                                    <line x1="0" y1="30" x2="500" y2="30" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="3,3" />
                                                    <line x1="0" y1="60" x2="500" y2="60" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="3,3" />
                                                    <line x1="0" y1="90" x2="500" y2="90" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="3,3" />

                                                    {/* Graph build */}
                                                    {(() => {
                                                        const steps = Math.min(10, districtHistoryData.length);
                                                        const sliceToUse = districtHistoryData.slice(-steps);

                                                        const points = sliceToUse.map((h, i) => {
                                                            const x = (i / (sliceToUse.length - 1 || 1)) * 500;
                                                            // Normalized Y: 100 max, 0 min
                                                            const y = 110 - ((Math.min(100, Math.max(0, h.riskScore)) / 100) * 100);
                                                            return { x, y };
                                                        });

                                                        const pathD = points.reduce((acc, p, i) => {
                                                            return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
                                                        }, "");

                                                        const areaD = points.length > 0 ? `${pathD} L ${points[points.length - 1].x} 120 L ${points[0].x} 120 Z` : "";

                                                        return points.length > 0 ? (
                                                            <>
                                                                <path d={areaD} fill="url(#scoreAreaGradient)" />
                                                                <path d={pathD} fill="none" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                                                {points.map((p, i) => (
                                                                    <g key={i}>
                                                                        <circle cx={p.x} cy={p.y} r="4.5" fill="#ffffff" stroke="#f43f5e" strokeWidth="2" />
                                                                        <text x={p.x} y={p.y - 10} fill="#f43f5e" fontSize="8" fontWeight="bold" textAnchor="middle">
                                                                            {sliceToUse[i].riskScore}
                                                                        </text>
                                                                    </g>
                                                                ))}
                                                            </>
                                                        ) : null;
                                                    })()}
                                                </svg>
                                            </div>

                                            <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-2">
                                                {districtHistoryData.slice(-10).map((h, i, arr) => (
                                                    <span key={i}>
                                                        {new Date(h.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center p-12 text-slate-400 text-xs">
                                            No trend data found. Generate some risk measurements to view the dashboard graphs.
                                        </div>
                                    )}
                                </Card>

                                {/* Step 11 Integration: Resource suggestions for High/Extreme Risk Districts */}
                                {(activeAssessment.riskLevel === "High" || activeAssessment.riskLevel === "Extreme") && (
                                    <Card className="p-6 border-red-200 bg-red-50/10">
                                        <h3 className="text-base font-extrabold text-red-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                                            <Shield className="h-5 w-5 text-red-600 animate-bounce" />
                                            Incident Evacuation & Dispatch Suggestions
                                        </h3>
                                        <p className="text-xs text-slate-500 mb-4">
                                            The risk severity in {activeAssessment.district} requires strategic asset deployment. The following matching rescue resources are currently online in the district:
                                        </p>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            {/* Shelter List */}
                                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                                        <Building className="h-3.5 w-3.5 text-blue-600" /> Nearby Shelters
                                                    </span>
                                                    <div className="mt-3 space-y-2">
                                                        {sheltersLoading ? (
                                                            <p className="text-xs text-slate-400">Loading...</p>
                                                        ) : nearbyShelters.length > 0 ? (
                                                            nearbyShelters.slice(0, 3).map(sh => (
                                                                <div key={sh._id} className="text-xs">
                                                                    <p className="font-bold text-slate-800 truncate">{sh.name}</p>
                                                                    <p className="text-[10px] text-slate-400">Capacity: {sh.occupancy}/{sh.capacity}</p>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <p className="text-xs text-slate-400 italic">None available inside district</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Rescue Teams List */}
                                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                                        <Shield className="h-3.5 w-3.5 text-orange-600" /> Active Rescue Teams
                                                    </span>
                                                    <div className="mt-3 space-y-2">
                                                        {teamsLoading ? (
                                                            <p className="text-xs text-slate-400">Loading...</p>
                                                        ) : nearbyTeams.length > 0 ? (
                                                            nearbyTeams.slice(0, 3).map(rt => (
                                                                <div key={rt._id} className="text-xs">
                                                                    <p className="font-bold text-slate-800 truncate">{rt.teamName}</p>
                                                                    <p className="text-[10px] text-slate-400">Spec: {rt.specialization || "General"}</p>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <p className="text-xs text-slate-400 italic">None available inside district</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Vehicles List */}
                                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                                        <Truck className="h-3.5 w-3.5 text-emerald-600" /> Emergency Vehicles
                                                    </span>
                                                    <div className="mt-3 space-y-2">
                                                        {vehiclesLoading ? (
                                                            <p className="text-xs text-slate-400">Loading...</p>
                                                        ) : nearbyVehicles.length > 0 ? (
                                                            nearbyVehicles.slice(0, 3).map(v => (
                                                                <div key={v._id} className="text-xs">
                                                                    <p className="font-bold text-slate-800 truncate">{v.vehicleNumber} ({v.vehicleType})</p>
                                                                    <p className="text-[10px] text-slate-400">Driver: {v.driverName}</p>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <p className="text-xs text-slate-400 italic">None available inside district</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Warehouses List */}
                                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                                        <Building className="h-3.5 w-3.5 text-indigo-600" /> Resource Warehouses
                                                    </span>
                                                    <div className="mt-3 space-y-2">
                                                        {warehousesLoading ? (
                                                            <p className="text-xs text-slate-400">Loading...</p>
                                                        ) : nearbyWarehouses.length > 0 ? (
                                                            nearbyWarehouses.slice(0, 3).map(w => (
                                                                <div key={w._id} className="text-xs">
                                                                    <p className="font-bold text-slate-800 truncate">{w.warehouseName}</p>
                                                                    <p className="text-[10px] text-slate-400">Utilization: {w.currentUtilization}%</p>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <p className="text-xs text-slate-400 italic">None available inside district</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                )}

                                {/* High Hazard Area List (Step 8 / 13) */}
                                <Card className="p-6">
                                    <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider mb-4">Critical Risk Areas Watchlist</h3>
                                    {highRiskAreas.length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-xs border-collapse">
                                                <thead>
                                                    <tr className="border-b border-slate-150 text-slate-450 font-bold uppercase">
                                                        <th className="pb-2.5">District</th>
                                                        <th className="pb-2.5">Active Threat</th>
                                                        <th className="pb-2.5">Combined Score</th>
                                                        <th className="pb-2.5">Rainfall</th>
                                                        <th className="pb-2.5">Soil moisture</th>
                                                        <th className="pb-2.5">Risk Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {highRiskAreas.map((a) => (
                                                        <tr key={a._id} className="border-b border-slate-100 hover:bg-slate-50/50">
                                                            <td className="py-3 font-bold text-slate-800">{a.district}</td>
                                                            <td className="py-3 text-slate-600 font-medium">{a.riskType}</td>
                                                            <td className="py-3 font-extrabold text-slate-900">{a.riskScore}/100</td>
                                                            <td className="py-3 font-medium text-slate-650">{a.rainfall.toFixed(1)} mm</td>
                                                            <td className="py-3 font-medium text-slate-650">{a.soilMoisture}%</td>
                                                            <td className="py-3">
                                                                <span
                                                                    className={`px-2 py-0.5 rounded font-extrabold text-[10px] ${a.riskLevel === "Extreme"
                                                                        ? "bg-red-100 text-red-700 animate-pulse"
                                                                        : "bg-amber-100 text-amber-700"
                                                                        }`}
                                                                >
                                                                    {a.riskLevel}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-xs text-slate-400 italic">No districts are currently in High or Extreme warning categories.</div>
                                    )}
                                </Card>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default RiskPage;
