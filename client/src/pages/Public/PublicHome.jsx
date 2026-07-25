import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    ShieldAlert,
    CloudRain,
    Building2,
    AlertTriangle,
    ArrowRight,
    Phone,
    HelpCircle,
    BookOpen,
    CheckCircle2,
    Search,
    Map
} from "lucide-react";
import { getPublicDashboard } from "../../services/publicService";
import { toast } from "react-hot-toast";

const PublicHome = () => {
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [globalSearch, setGlobalSearch] = useState("");

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const data = await getPublicDashboard();
                setDashboardData(data);
            } catch (err) {
                console.error("Dashboard failed:", err);
                toast.error("Failed to load live dashboard feeds.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    const handleGlobalSearchSubmit = (e) => {
        e.preventDefault();
        if (!globalSearch.trim()) return;

        const term = globalSearch.toLowerCase().trim();
        // Redirect to appropriate section depending on matching keyword
        if (term.includes("shelter") || term.includes("camp") || term.includes("bed")) {
            navigate(`/public/shelters?search=${encodeURIComponent(globalSearch)}`);
        } else if (term.includes("alert") || term.includes("warning") || term.includes("rain") || term.includes("flood")) {
            navigate(`/public/alerts`);
        } else if (term.includes("contact") || term.includes("phone") || term.includes("call") || term.includes("number")) {
            navigate(`/public/contacts`);
        } else if (term.includes("faq") || term.includes("why") || term.includes("how")) {
            navigate(`/public/faq?search=${encodeURIComponent(globalSearch)}`);
        } else if (term.includes("prep") || term.includes("kit") || term.includes("guide") || term.includes("safe")) {
            navigate(`/public/education`);
        } else {
            // Default to shelters search
            navigate(`/public/shelters?search=${encodeURIComponent(globalSearch)}`);
        }
    };

    return (
        <div className="space-y-10 pb-12">

            {/* Hero Section */}
            <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 border border-slate-800 p-8 sm:p-12 text-center space-y-6 shadow-2xl">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent pointer-events-none"></div>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-500/10 text-cyan-400 text-xs font-semibold rounded-full border border-cyan-500/25 uppercase tracking-wide">
                    <CheckCircle2 size={12} /> State Disaster Intelligence Feed Active
                </span>

                <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                    Statutory Kerala Citizen <br className="hidden sm:inline" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400">Emergency & Logistics Portal</span>
                </h1>

                <p className="max-w-2xl mx-auto text-slate-300 text-sm sm:text-base leading-relaxed">
                    Verify live weather forecasts, search safe evacuation shelters containing available beds, coordinate active public hazards, and display safety manuals without login.
                </p>

                {/* Global Search Bar */}
                <form onSubmit={handleGlobalSearchSubmit} className="max-w-xl mx-auto relative flex items-center bg-slate-950 border border-slate-850 focus-within:border-cyan-500 rounded-2xl p-1.5 transition">
                    <Search className="text-slate-500 ml-3 w-5 h-5 shrink-0" />
                    <input
                        type="text"
                        placeholder="Search shelters, alerts, helicon support, preparation checklists..."
                        value={globalSearch}
                        onChange={(e) => setGlobalSearch(e.target.value)}
                        className="bg-transparent text-sm text-white px-3 py-2 w-full outline-none"
                    />
                    <button type="submit" className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:brightness-110 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition shrink-0 shadow-md">
                        Search Portal
                    </button>
                </form>

                {/* Quick Quicklinks */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <Link to="/public/map" className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-bold transition">
                        <Map size={14} /> Interactive Live Map <ArrowRight size={12} />
                    </Link>
                    <span className="text-slate-700 hidden sm:inline">•</span>
                    <Link to="/sos" className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-bold transition">
                        <ShieldAlert size={14} /> Raise Immediate SOS Request <ArrowRight size={12} />
                    </Link>
                </div>
            </section>

            {/* Aggregated Indicator Widgets */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Weather Indicators */}
                <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl transition-all duration-300 group flex items-start justify-between">
                    <div className="space-y-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Average rainfall</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-white">
                                {isLoading ? "..." : `${(dashboardData?.aggregatedMetrics?.averageRainfall || 0).toFixed(1)}`}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">mm</span>
                        </div>
                        <span className="text-xs text-blue-400 hover:underline cursor-pointer block" onClick={() => navigate("/public/alerts")}>
                            Districts alerts →
                        </span>
                    </div>
                    <div className="p-3 bg-blue-500/10 rounded-xl group-hover:scale-105 transition">
                        <CloudRain className="text-blue-400 w-6 h-6" />
                    </div>
                </div>

                {/* Open Shelters */}
                <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl transition-all duration-300 group flex items-start justify-between">
                    <div className="space-y-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Vacant Shelters</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-white">
                                {isLoading ? "..." : `${dashboardData?.aggregatedMetrics?.openShelterCount || 0}`}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">camps open</span>
                        </div>
                        <span className="text-xs text-emerald-400 hover:underline cursor-pointer block" onClick={() => navigate("/public/shelters")}>
                            Find nearest beds →
                        </span>
                    </div>
                    <div className="p-3 bg-emerald-500/10 rounded-xl group-hover:scale-105 transition">
                        <Building2 className="text-emerald-400 w-6 h-6" />
                    </div>
                </div>

                {/* Verified active incidents */}
                <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl transition-all duration-300 group flex items-start justify-between">
                    <div className="space-y-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Active Incidents</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-white">
                                {isLoading ? "..." : `${dashboardData?.aggregatedMetrics?.activeIncidentsCount || 0}`}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">verified</span>
                        </div>
                        <span className="text-xs text-orange-400 hover:underline cursor-pointer block" onClick={() => navigate("/public/map")}>
                            View danger map →
                        </span>
                    </div>
                    <div className="p-3 bg-orange-500/10 rounded-xl group-hover:scale-105 transition">
                        <AlertTriangle className="text-orange-400 w-6 h-6" />
                    </div>
                </div>

                {/* Safe evacuation status */}
                <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl transition-all duration-300 group flex items-start justify-between">
                    <div className="space-y-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Risk Threshold</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-white">
                                {isLoading ? "..." : (dashboardData?.aggregatedMetrics?.highestRiskLevel || "Low")}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">max level</span>
                        </div>
                        <span className="text-xs text-pink-400 hover:underline cursor-pointer block" onClick={() => navigate("/public/education")}>
                            Read prep guide →
                        </span>
                    </div>
                    <div className="p-3 bg-pink-500/10 rounded-xl group-hover:scale-105 transition">
                        <ShieldAlert className="text-pink-400 w-6 h-6" />
                    </div>
                </div>
            </section>

            {/* Split Feed Views */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left side: Alert highlights feed */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <AlertTriangle className="text-amber-500 w-5 h-5 animate-pulse" /> Certified Emergency Advisories
                        </h3>
                        <Link to="/public/alerts" className="text-xs text-cyan-400 hover:underline flex items-center gap-1">
                            View All <ArrowRight size={12} />
                        </Link>
                    </div>

                    <div className="space-y-4">
                        {isLoading ? (
                            <div className="py-12 bg-slate-950/40 rounded-2xl border border-slate-800 flex items-center justify-center text-xs text-slate-500 animate-pulse">
                                Loading feeds...
                            </div>
                        ) : !dashboardData?.activeAlerts || dashboardData.activeAlerts.length === 0 ? (
                            <div className="py-12 text-center bg-slate-950/20 rounded-2xl border border-slate-850 text-xs text-slate-400">
                                No critical warnings or advisory events active in the state. Stay safe.
                            </div>
                        ) : (
                            dashboardData.activeAlerts.slice(0, 4).map((alert, idx) => (
                                <div key={idx} className="p-4 bg-slate-950/80 border border-slate-850 hover:border-slate-850/60 rounded-2xl flex items-start gap-3 shadow-md transition">
                                    <div className={`p-2 rounded-lg mt-0.5 ${alert.severity === "Extreme" ? "bg-red-500/10 text-red-500" :
                                            alert.severity === "High" ? "bg-orange-500/10 text-orange-500" : "bg-yellow-500/10 text-yellow-500"
                                        }`}>
                                        <AlertTriangle size={16} />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-bold text-sm text-white">{alert.type}</span>
                                            <span className="text-[10px] text-slate-400 bg-slate-900 border border-slate-850 px-2 py-0.5 rounded uppercase font-semibold">{alert.district}</span>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${alert.severity === "Extreme" ? "bg-red-500/10 text-red-400" :
                                                    alert.severity === "High" ? "bg-orange-500/10 text-orange-400" : "bg-yellow-400/10 text-yellow-400"
                                                }`}>{alert.severity}</span>
                                        </div>
                                        <p className="text-xs text-slate-350 leading-relaxed">{alert.message}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right side: Prep / Quick links panel */}
                <div className="lg:col-span-4 space-y-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <BookOpen className="text-cyan-400 w-5 h-5" /> Safety & Prep Guides
                    </h3>

                    <div className="grid grid-cols-1 gap-3 text-xs">
                        <div className="bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-2xl p-4 transition duration-300">
                            <span className="text-red-400 font-bold block mb-1">🚨 Flood Survival Guidelines</span>
                            <p className="text-slate-400 mb-3 leading-relaxed">Turn off utilities, remain inside safe shelters, and avoid crossing active water log vectors.</p>
                            <Link to="/public/education" className="text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-1">
                                View Manual <ArrowRight size={12} />
                            </Link>
                        </div>

                        <div className="bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-2xl p-4 transition duration-300">
                            <span className="text-orange-400 font-bold block mb-1">⛰️ Landslide Preparedness</span>
                            <p className="text-slate-400 mb-3 leading-relaxed font-sans">Check slopes, look for ground shifts and structural tilts, evacuate hillside terrains immediately.</p>
                            <Link to="/public/education" className="text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-1">
                                View Manual <ArrowRight size={12} />
                            </Link>
                        </div>

                        <div className="bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-2xl p-4 transition duration-300">
                            <span className="text-yellow-400 font-bold block mb-1">🎒 Emergency Checklist</span>
                            <p className="text-slate-400 mb-3 leading-relaxed font-sans font-medium">Verify your family kit has clean water bottles, identification cards, batteries, and canned food.</p>
                            <Link to="/public/education" className="text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-1">
                                Read Checklist <ArrowRight size={12} />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default PublicHome;
