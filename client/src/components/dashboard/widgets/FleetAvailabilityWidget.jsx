import { useMemo } from "react";
import Card from "../../common/Card";
import useVehicles from "../../../hooks/useVehicles";
import { Truck, Activity, Compass, Flame, Shield, Anchor } from "lucide-react";
import { Link } from "react-router-dom";

const typeOptions = [
    { name: "Ambulance", icon: Activity, color: "text-rose-500", progressBg: "bg-rose-500" },
    { name: "Rescue Boat", icon: Anchor, color: "text-sky-500", progressBg: "bg-sky-500" },
    { name: "Fire Engine", icon: Flame, color: "text-orange-500", progressBg: "bg-orange-500" },
    { name: "Police Vehicle", icon: Shield, color: "text-blue-500", progressBg: "bg-blue-500" },
    { name: "Supply Truck", icon: Truck, color: "text-emerald-500", progressBg: "bg-emerald-500" },
    { name: "NDRF Vehicle", icon: Compass, color: "text-indigo-500", progressBg: "bg-indigo-500" },
];

const FleetAvailabilityWidget = () => {
    const { vehicles, isLoading, error } = useVehicles();

    const stats = useMemo(() => {
        if (vehicles.length === 0) return [];
        return typeOptions.map((opt) => {
            const typeVehicles = vehicles.filter((v) => v.vehicleType === opt.name);
            const total = typeVehicles.length;
            const available = typeVehicles.filter((v) => v.status === "Available").length;
            const pct = total > 0 ? Math.round((available / total) * 100) : 0;
            return {
                ...opt,
                total,
                available,
                pct,
            };
        });
    }, [vehicles]);

    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-slate-800">Fleet Availability</h3>
                <Link to="/vehicles" className="text-xs font-bold text-indigo-650 hover:underline">
                    View All
                </Link>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center py-6">
                    <span className="animate-spin rounded-full h-5 w-5 border-2 border-slate-200 border-t-indigo-600"></span>
                </div>
            ) : error ? (
                <p className="text-xs text-rose-500">Offline</p>
            ) : vehicles.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No fleet units enrolled.</p>
            ) : (
                <div className="space-y-4">
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
                                    <div className="text-[10px] text-slate-400 italic">No units registered</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </Card>
    );
};

export default FleetAvailabilityWidget;
