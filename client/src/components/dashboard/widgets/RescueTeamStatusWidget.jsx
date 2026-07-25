import { useMemo } from "react";
import Card from "../../common/Card";
import useRescueTeams from "../../../hooks/useRescueTeams";
import { Shield, LifeBuoy, HeartPulse, HardHat, Eye } from "lucide-react";
import { Link } from "react-router-dom";

const specializationOptions = [
    { name: "Water Rescue", icon: LifeBuoy, color: "text-blue-500", progressBg: "bg-blue-500" },
    { name: "Landslide Relief", icon: HardHat, color: "text-amber-600", progressBg: "bg-amber-600" },
    { name: "Medical Aid", icon: HeartPulse, color: "text-rose-500", progressBg: "bg-rose-500" },
    { name: "General Rescue", icon: Shield, color: "text-indigo-500", progressBg: "bg-indigo-500" },
];

const RescueTeamStatusWidget = () => {
    const { teams, isLoading, error } = useRescueTeams();

    const stats = useMemo(() => {
        if (!teams || teams.length === 0) return [];

        return specializationOptions.map((opt) => {
            // Find teams matching this specialization keyword
            const specTeams = teams.filter((t) => {
                const specLower = (t.specialization || "").toLowerCase();
                const optLower = opt.name.toLowerCase();
                return specLower.includes(optLower) ||
                    (opt.name === "General Rescue" && !specLower) || // fallback to General if no spec
                    (opt.name === "Water Rescue" && specLower.includes("water")) ||
                    (opt.name === "Landslide Relief" && (specLower.includes("landslide") || specLower.includes("search")));
            });

            const total = specTeams.length;
            const available = specTeams.filter((t) => t.status === "Available").length;
            const pct = total > 0 ? Math.round((available / total) * 100) : 0;

            return {
                ...opt,
                total,
                available,
                pct,
            };
        });
    }, [teams]);

    const activeMissionsCount = useMemo(() => {
        if (!teams) return 0;
        return teams.filter(t => t.status === "On Mission").length;
    }, [teams]);

    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-1.5">
                    <Shield className="h-5 w-5 text-indigo-650" />
                    <h3 className="font-semibold text-slate-800">Rescue Deployment</h3>
                </div>
                <Link to="/rescue-teams" className="text-xs font-bold text-indigo-650 hover:underline">
                    Manage Teams
                </Link>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center py-6">
                    <span className="animate-spin rounded-full h-5 w-5 border-2 border-slate-205 border-t-indigo-600"></span>
                </div>
            ) : error ? (
                <p className="text-xs text-rose-500">Offline</p>
            ) : !teams || teams.length === 0 ? (
                <div className="text-center py-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-xs text-slate-500 italic">No rescue teams registered.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 mb-2">
                        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 text-center">
                            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide block">Available Squads</span>
                            <span className="text-2xl font-bold text-emerald-800">
                                {teams.filter(t => t.status === "Available").length}
                            </span>
                        </div>
                        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 text-center">
                            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wide block">On Active Mission</span>
                            <span className="text-2xl font-bold text-amber-800">
                                {activeMissionsCount}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-3 pt-1 border-t border-slate-100">
                        {stats.map((item) => {
                            const IconComponent = item.icon;
                            return (
                                <div key={item.name} className="space-y-1.5">
                                    <div className="flex justify-between items-center text-xs">
                                        <div className="flex items-center gap-2 font-semibold text-slate-700">
                                            <IconComponent className={`h-4 w-4 ${item.color}`} />
                                            <span>{item.name}</span>
                                        </div>
                                        <span className="font-bold text-slate-500">
                                            {item.available} / {item.total} Ready
                                        </span>
                                    </div>
                                    {item.total > 0 ? (
                                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-300 ${item.progressBg}`}
                                                style={{ width: `${item.pct}%` }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="text-[10px] text-slate-400 italic pl-6">No squads assembled</div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </Card>
    );
};

export default RescueTeamStatusWidget;
