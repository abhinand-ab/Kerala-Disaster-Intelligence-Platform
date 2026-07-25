import { useState, useEffect } from "react";
import { AlertTriangle, Clock, MapPin, Layers, Info, CheckCircle2 } from "lucide-react";
import { getPublicAlerts } from "../../services/publicService";
import { socket } from "../../services/socket";
import { toast } from "react-hot-toast";

const PublicAlerts = () => {
    const [alerts, setAlerts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterSeverity, setFilterSeverity] = useState("All");
    const [filterDistrict, setFilterDistrict] = useState("All");

    const districts = [
        "Thiruvananthapuram", "Kollam", "Pathanamthitta", "Alappuzha", "Kottayam",
        "Idukki", "Ernakulam", "Thrissur", "Palakkad", "Malappuram",
        "Kozhikode", "Wayanad", "Kannur", "Kasaragod"
    ];

    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const data = await getPublicAlerts();
                setAlerts(data || []);
            } catch (err) {
                console.error("Alerts fetching failing:", err);
                toast.error("Failed to load active system alerts.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchAlerts();
    }, []);

    // Handle incoming socket events
    useEffect(() => {
        const handlePublicAlert = (newAlert) => {
            toast.error(`⚠️ NEW ADVISORY: ${newAlert.type || 'Alert'} issued for ${newAlert.district}!`, {
                icon: "⚠️",
                duration: 6000
            });
            setAlerts((prev) => [newAlert, ...prev]);
        };

        const handleEvacuationNotice = (notice) => {
            toast.error(`🚨 EVACUATION NOTICE: ${notice.title} in ${notice.district}!`, {
                icon: "🚨",
                duration: 10000
            });
            const mappedAlert = {
                id: notice.id || `evac_${Date.now()}`,
                source: "evacuation",
                type: notice.type || "Evacuation Notice",
                severity: "Extreme",
                message: notice.message,
                district: notice.district,
                timestamp: notice.timestamp || new Date()
            };
            setAlerts((prev) => [mappedAlert, ...prev]);
        };

        const handlePublicIncidentUpdate = (incident) => {
            // If incident becomes verified and has high severity, add an alert
            if (incident.verificationStatus && ["High", "Critical"].includes(incident.severity)) {
                const alertId = `inc_${incident._id}`;
                setAlerts((prev) => {
                    const exists = prev.some(a => a.id === alertId);
                    if (exists) return prev;

                    const newAlert = {
                        id: alertId,
                        source: "incident",
                        type: `${incident.category} Warning`,
                        severity: incident.severity,
                        message: incident.description,
                        district: incident.location.district,
                        timestamp: incident.createdAt
                    };
                    return [newAlert, ...prev];
                });
            }
        };

        socket.on("publicAlert", handlePublicAlert);
        socket.on("evacuationNotice", handleEvacuationNotice);
        socket.on("publicIncidentUpdate", handlePublicIncidentUpdate);

        return () => {
            socket.off("publicAlert", handlePublicAlert);
            socket.off("evacuationNotice", handleEvacuationNotice);
            socket.off("publicIncidentUpdate", handlePublicIncidentUpdate);
        };
    }, []);

    const filteredAlerts = alerts.filter(alert => {
        const matchesSeverity = filterSeverity === "All" ? true : alert.severity === filterSeverity;
        const matchesDistrict = filterDistrict === "All" ? true : alert.district.toLowerCase() === filterDistrict.toLowerCase();
        return matchesSeverity && matchesDistrict;
    });

    return (
        <div className="space-y-6 pb-12">

            {/* Header Title */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-2">
                        <AlertTriangle className="text-rose-500 w-6 h-6 animate-pulse" /> Live Disaster Advisories
                    </h1>
                    <p className="text-xs text-slate-400">Broadcast feeds from the State Emergency Coordination Center. Connected to live broadcasts.</p>
                </div>

                {/* Live Connection Tag */}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-semibold rounded-full border border-emerald-500/20">
                    <CheckCircle2 size={12} className="animate-pulse" /> Listening Live
                </span>
            </div>

            {/* Filter controls */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-4">
                <div className="flex-1 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Severity Filter</label>
                    <div className="flex flex-wrap gap-1.5">
                        {["All", "Extreme", "High", "Moderate"].map(sev => (
                            <button
                                key={sev}
                                onClick={() => setFilterSeverity(sev)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${filterSeverity === sev
                                        ? "bg-rose-600 border-rose-500 text-white shadow-md shadow-rose-900/10"
                                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                                    }`}
                            >
                                {sev}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="sm:w-64 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">District Filter</label>
                    <select
                        value={filterDistrict}
                        onChange={(e) => setFilterDistrict(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 px-3 py-2 rounded-xl text-xs outline-none text-white transition"
                    >
                        <option value="All">All Districts (Entire State)</option>
                        {districts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
            </div>

            {/* Alerts Feed items */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="py-16 text-center text-xs text-slate-500 animate-pulse">
                        Querying alerts archive...
                    </div>
                ) : filteredAlerts.length === 0 ? (
                    <div className="text-center py-16 bg-slate-950/40 rounded-2xl border border-slate-850 p-6 space-y-2">
                        <Info className="mx-auto text-slate-650 w-8 h-8" />
                        <h3 className="font-bold text-white text-sm">Clear Advisory Board</h3>
                        <p className="text-xs text-slate-450 max-w-sm mx-auto">No alerts match the selected filters. Verify other districts or check again later.</p>
                    </div>
                ) : (
                    filteredAlerts.map((alert, idx) => {
                        const isExtreme = alert.severity === "Extreme";
                        const isHigh = alert.severity === "High";
                        const borderClass = isExtreme ? "border-red-650 bg-red-950/10" : isHigh ? "border-orange-950 bg-orange-950/10" : "border-slate-800 bg-slate-950/40";
                        const severityBadgeColor = isExtreme ? "bg-red-500/15 text-red-400 border border-red-500/30" : isHigh ? "bg-orange-500/15 text-orange-400 border border-orange-500/30" : "bg-yellow-400/15 text-yellow-400 border border-yellow-400/30";

                        return (
                            <div
                                key={alert.id || idx}
                                className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 ${borderClass}`}
                            >
                                <div className="space-y-2.5 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${severityBadgeColor}`}>
                                            {alert.severity} Severity
                                        </span>
                                        <span className="text-xs font-bold text-slate-200 bg-slate-900 border border-slate-800/80 px-2.5 py-0.5 rounded-lg flex items-center gap-1.5">
                                            <MapPin size={12} className="text-cyan-400" /> {alert.district}
                                        </span>
                                        {alert.source && (
                                            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold border-l border-slate-800 pl-2">
                                                Source: {alert.source}
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="font-bold text-base text-white">{alert.type}</h3>

                                    <p className="text-xs text-slate-300 leading-relaxed max-w-3xl font-medium">
                                        {alert.message}
                                    </p>
                                </div>

                                <div className="text-[10px] text-slate-500 self-end md:self-center flex items-center gap-1.5 border border-slate-900 px-3 py-1.5 rounded-xl bg-slate-950">
                                    <Clock size={12} />
                                    <span>
                                        {new Date(alert.timestamp).toLocaleDateString()} at {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default PublicAlerts;
