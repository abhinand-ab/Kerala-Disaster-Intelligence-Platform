import { useEffect, useMemo, useRef, memo } from "react";
import { Marker, Popup, useMap } from "react-leaflet";
import useVehicles from "../../../hooks/useVehicles";
import { createVehicleIcon } from "../icons/vehicleIcon";
import { Phone, MapPin, Shield, Activity, User, HeartHandshake } from "lucide-react";

const isValidCoordinate = (lat, lng) => {
    const latitude = Number(lat);
    const longitude = Number(lng);
    return (
        !isNaN(latitude) &&
        !isNaN(longitude) &&
        latitude >= 8.0 &&
        latitude <= 13.0 &&
        longitude >= 74.0 &&
        longitude <= 78.0
    );
};

const VehicleLayer = () => {
    const map = useMap();
    const { vehicles, isLoading, error } = useVehicles();
    const hasMovedManually = useRef(false);

    // Tracking user movements on the map to avoid snapping
    useEffect(() => {
        if (!map) return;

        const handleMoveStart = (e) => {
            if (e.originalEvent || e.type === "dragstart" || e.type === "zoomstart") {
                hasMovedManually.current = true;
            }
        };

        map.on("dragstart", handleMoveStart);
        map.on("zoomstart", handleMoveStart);

        return () => {
            map.off("dragstart", handleMoveStart);
            map.off("zoomstart", handleMoveStart);
        };
    }, [map]);

    const validVehicles = useMemo(() => {
        if (!vehicles) return [];
        return vehicles.filter((v) => isValidCoordinate(v.latitude, v.longitude));
    }, [vehicles]);

    // Auto-fit bounds on load
    useEffect(() => {
        if (!map || hasMovedManually.current || validVehicles.length === 0) return;

        try {
            const bounds = validVehicles.map((v) => [Number(v.latitude), Number(v.longitude)]);
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
        } catch (e) {
            console.warn("Auto-zoom to vehicle bounds failed:", e);
        }
    }, [validVehicles, map]);

    const markers = useMemo(() => {
        return validVehicles.map((vehicle) => {
            const icon = createVehicleIcon(vehicle);

            return (
                <Marker
                    key={vehicle._id}
                    position={[Number(vehicle.latitude), Number(vehicle.longitude)]}
                    icon={icon}
                >
                    <Popup>
                        <div className="p-1 space-y-3 min-w-[280px] font-sans text-slate-800">
                            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                                <div>
                                    <h3 className="font-bold text-base leading-tight text-slate-900 m-0">
                                        {vehicle.vehicleNumber}
                                    </h3>
                                    <span className="inline-block bg-slate-150 text-slate-600 font-bold px-2 py-0.5 rounded text-[10px] uppercase mt-1 tracking-wide">
                                        {vehicle.vehicleType}
                                    </span>
                                </div>
                                <span className={`inline-flex shrink-0 items-center px-2.5 py-1 text-xs font-bold rounded-full ring-1 ${vehicle.status === "Available" ? "bg-emerald-50 text-emerald-700 ring-emerald-200" :
                                        vehicle.status === "On Mission" ? "bg-amber-50 text-amber-700 ring-amber-200" :
                                            vehicle.status === "Assigned" ? "bg-blue-50 text-blue-700 ring-blue-200" :
                                                vehicle.status === "Returning" ? "bg-purple-50 text-purple-700 ring-purple-200" :
                                                    "bg-rose-50 text-rose-700 ring-rose-200"
                                    }`}>
                                    {vehicle.status}
                                </span>
                            </div>

                            {/* Live telemetry metrics */}
                            <div className="space-y-2 text-xs">
                                <p className="flex items-start gap-2 m-0 text-slate-600">
                                    <Shield className="h-3.5 w-3.5 text-slate-450 shrink-0 mt-0.5" />
                                    <span><strong>Dept:</strong> {vehicle.department}</span>
                                </p>
                                <p className="flex items-start gap-2 m-0 text-slate-600 font-medium">
                                    <User className="h-3.5 w-3.5 text-slate-450 shrink-0 mt-0.5" />
                                    <span><strong>Driver:</strong> {vehicle.driverName}</span>
                                </p>
                                <p className="flex items-start gap-2 m-0 text-slate-600">
                                    <Phone className="h-3.5 w-3.5 text-slate-450 shrink-0 mt-0.5" />
                                    <span><strong>Call:</strong> <a href={`tel:${vehicle.driverPhone}`} className="text-indigo-650 hover:underline font-bold">{vehicle.driverPhone}</a></span>
                                </p>
                                <p className="flex items-start gap-2 m-0 text-slate-600">
                                    <MapPin className="h-3.5 w-3.5 text-slate-450 shrink-0 mt-0.5" />
                                    <span className="truncate"><strong>GPS:</strong> {vehicle.latitude.toFixed(5)}, {vehicle.longitude.toFixed(5)} ({vehicle.district})</span>
                                </p>

                                {/* Fuel Indicator inside popup */}
                                <div className="space-y-1 pt-1.5">
                                    <div className="flex justify-between text-[11px] font-bold text-slate-500">
                                        <span>Fuel Level</span>
                                        <span>{vehicle.fuelLevel}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                        <div className={`h-full ${vehicle.fuelLevel < 20 ? "bg-rose-500" : "bg-emerald-500"}`} style={{ width: `${vehicle.fuelLevel}%` }}></div>
                                    </div>
                                </div>
                            </div>

                            {/* Incident assignment */}
                            {vehicle.assignedIncident && (
                                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-3 space-y-1 text-xs">
                                    <p className="font-bold text-indigo-900 flex items-center gap-1.5">
                                        <Activity className="h-3.5 w-3.5 text-indigo-500" />
                                        Assigned Incident Call
                                    </p>
                                    <p className="text-indigo-800 font-semibold line-clamp-1">
                                        {typeof vehicle.assignedIncident === "object" ? vehicle.assignedIncident.title : "Active Rescue Operations"}
                                    </p>
                                    {vehicle.currentMission && (
                                        <p className="text-indigo-600 italic mt-1 leading-relaxed">
                                            "{vehicle.currentMission}"
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </Popup>
                </Marker>
            );
        });
    }, [validVehicles]);

    const errorMessage = error
        ? typeof error === "string"
            ? error
            : error?.message || "Unable to load vehicle fleet data."
        : null;

    return (
        <>
            {isLoading && (
                <div className="absolute top-4 right-4 z-[1000] bg-white/95 backdrop-blur-sm px-3.5 py-2 rounded-2xl shadow-lg border border-slate-200 flex items-center gap-2 text-xs font-semibold text-slate-700 animate-pulse pointer-events-none">
                    <span className="animate-spin rounded-full h-3 w-3 border-2 border-slate-200 border-t-indigo-600"></span>
                    <span>Tracking active fleet...</span>
                </div>
            )}

            {errorMessage && (
                <div className="absolute top-4 right-4 z-[1000] bg-rose-50/95 backdrop-blur-sm px-3.5 py-2 rounded-2xl shadow-lg border border-rose-200 flex items-center gap-2 text-xs font-semibold text-rose-700 pointer-events-none">
                    <span>Telemetry Connection Offline: {errorMessage}</span>
                </div>
            )}

            {markers}
        </>
    );
};

export default memo(VehicleLayer);
