import { useMap } from "../../context/MapContext";
import { getShelterStatus } from "./icons/shelterIcon";
import { X, Navigation, ShieldCheck, AlertTriangle, Phone, User, MapPin } from "lucide-react";

const RouteInfoPanel = () => {
    const {
        navigationDest,
        setNavigationDest,
        activeRoute,
        setActiveRoute,
        routeInfo,
        setRouteInfo,
    } = useMap();

    if (!navigationDest || !routeInfo) return null;

    const status = getShelterStatus(navigationDest);

    const handleClose = () => {
        setNavigationDest(null);
        setActiveRoute(null);
        setRouteInfo(null);
    };

    const formatTime = (minutes) => {
        const mins = Math.round(minutes);
        if (mins < 60) return `${mins} mins`;
        const hrs = Math.floor(mins / 60);
        const remainingMins = mins % 60;
        return remainingMins > 0 ? `${hrs}h ${remainingMins}m` : `${hrs}h`;
    };

    return (
        <div className="w-full lg:w-[360px] shrink-0 border-t lg:border-t-0 lg:border-l border-slate-205 bg-white text-slate-800 flex flex-col h-full overflow-hidden shadow-2xl transition-all duration-300 font-sans">
            {/* Panel Header */}
            <div className="p-4 border-b border-slate-100 flex items-start justify-between bg-slate-900 text-white">
                <div className="flex items-center gap-2">
                    <Navigation className="h-5 w-5 text-cyan-400 animate-pulse" />
                    <div>
                        <h3 className="font-bold text-sm leading-tight text-white tracking-wide uppercase">
                            Evacuation Route
                        </h3>
                        <span className="text-xs text-slate-350">Directions & Shelter Status</span>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleClose}
                    className="text-slate-300 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition"
                    aria-label="Cancel Navigation"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            {/* Main Content (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Disaster Avoidance Advisory Banner */}
                {routeInfo.isSafe ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-emerald-800">
                        <ShieldCheck className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                            <strong className="font-semibold block text-emerald-950">Safe Route Active</strong>
                            <span>Calculated route avoids known critical disaster/hazard zones.</span>
                        </div>
                    </div>
                ) : (
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-rose-800">
                        <AlertTriangle className="h-4.5 w-4.5 text-rose-600 shrink-0 mt-0.5 animate-bounce" />
                        <div>
                            <strong className="font-semibold block text-rose-950">Hazard Warning</strong>
                            <span>Route passes close to {routeInfo.warningCount} active high-risk incidents. Exercise caution!</span>
                        </div>
                    </div>
                )}

                {/* Shelter Summary */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
                    <div>
                        <h4 className="font-bold text-base text-slate-800 leading-tight">
                            {navigationDest.name}
                        </h4>
                        <span className={`inline-flex items-center mt-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-md ring-1 ${status === "Open" ? "bg-emerald-100 text-emerald-700 ring-emerald-200" :
                            status === "Nearly Full" ? "bg-orange-100 text-orange-700 ring-orange-200" :
                                status === "Full" ? "bg-rose-100 text-rose-700 ring-rose-200" :
                                    "bg-slate-100 text-slate-700 ring-slate-200"
                            }`}>
                            <span className="mr-1">
                                {status === "Open" ? "🟢" : status === "Nearly Full" ? "🟡" : status === "Full" ? "🔴" : "⚫"}
                            </span>
                            {status}
                        </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600">
                        <div className="flex items-start gap-1">
                            <MapPin className="h-4 w-4 text-cyan-600 shrink-0" />
                            <span>{navigationDest.address}, {navigationDest.district}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <User className="h-4 w-4 text-slate-400" />
                            <span>{navigationDest.contactPerson}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Phone className="h-4 w-4 text-slate-400" />
                            <a href={`tel:${navigationDest.phone}`} className="text-cyan-600 font-semibold hover:underline">
                                {navigationDest.phone}
                            </a>
                        </div>
                    </div>

                    {/* Quick Metrics */}
                    <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-200/60">
                        <div className="bg-white rounded-xl p-2.5 border border-slate-100 text-center shadow-sm">
                            <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">Distance</span>
                            <span className="text-lg font-extrabold text-slate-800">
                                {routeInfo.distance.toFixed(1)} km
                            </span>
                        </div>
                        <div className="bg-white rounded-xl p-2.5 border border-slate-100 text-center shadow-sm">
                            <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">Est. Time</span>
                            <span className="text-lg font-extrabold text-slate-850">
                                {formatTime(routeInfo.duration)}
                            </span>
                        </div>
                    </div>

                    {/* Beds Metrics */}
                    <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-1">
                        <div className="bg-white rounded-lg p-1.5 ring-1 ring-slate-100">
                            <span className="block text-slate-400">Total</span>
                            <span className="font-semibold text-slate-700">{navigationDest.capacity}</span>
                        </div>
                        <div className="bg-white rounded-lg p-1.5 ring-1 ring-slate-100">
                            <span className="block text-slate-400">Occupancy</span>
                            <span className="font-semibold text-slate-700">{navigationDest.occupancy}</span>
                        </div>
                        <div className="bg-white rounded-lg p-1.5 ring-1 ring-slate-100">
                            <span className="block text-slate-400">Available</span>
                            <span className="font-semibold text-slate-700">{navigationDest.availableBeds}</span>
                        </div>
                    </div>
                </div>

                {/* Turn-by-Turn Directions */}
                <div className="space-y-3">
                    <h5 className="font-bold text-xs uppercase text-slate-400 tracking-wider">
                        Navigation Instructions
                    </h5>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                        {routeInfo.instructions && routeInfo.instructions.length > 0 ? (
                            routeInfo.instructions.map((step, idx) => (
                                <div key={idx} className="flex gap-3 text-xs bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-cyan-600 font-bold text-[10px]">
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-slate-700 leading-normal m-0">{step.text}</p>
                                        <span className="text-[10px] text-slate-400 mt-1 block">
                                            {step.distance > 1000 ? `${(step.distance / 1000).toFixed(1)} km` : `${Math.round(step.distance)} m`}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-slate-400 italic">No detailed steps available. Follow mapped route line.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RouteInfoPanel;
