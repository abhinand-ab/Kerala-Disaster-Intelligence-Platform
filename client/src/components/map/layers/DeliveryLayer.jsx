import { useMemo, memo } from "react";
import { Marker, Popup, Polyline } from "react-leaflet";
import useDeliveries from "../../../hooks/useDeliveries";
import { createDeliveryIcon } from "../icons/deliveryIcon";

const isValidCoordinate = (lat, lng) => {
    if (lat === undefined || lat === null || lng === undefined || lng === null) return false;
    const latitude = Number(lat);
    const longitude = Number(lng);
    return !isNaN(latitude) && !isNaN(longitude) && latitude !== 0 && longitude !== 0;
};

const DeliveryLayer = () => {
    const { deliveries } = useDeliveries();

    // Select active/scheduled delivery transits
    const activeDeliveries = useMemo(() => {
        if (!deliveries) return [];
        return deliveries.filter(d =>
            (d.missionStatus === "Dispatched" || d.missionStatus === "In Transit" || d.missionStatus === "Pending") &&
            d.warehouse && d.destinationShelter
        );
    }, [deliveries]);

    // Format routes & markers
    const layersData = useMemo(() => {
        const routes = [];
        const markers = [];

        activeDeliveries.forEach(del => {
            const whLat = Number(del.warehouse?.latitude || del.warehouse?.liveGPS?.latitude);
            const whLng = Number(del.warehouse?.longitude || del.warehouse?.liveGPS?.longitude);
            const shLat = Number(del.destinationShelter?.latitude);
            const shLng = Number(del.destinationShelter?.longitude);

            // Check valid start and endpoint coordinates
            const isStartValid = isValidCoordinate(whLat, whLng);
            const isEndValid = isValidCoordinate(shLat, shLng);

            if (isStartValid && isEndValid) {
                // Draw route path
                routes.push({
                    id: del._id,
                    positions: [[whLat, whLng], [shLat, shLng]],
                    status: del.missionStatus,
                });
            }

            // Truck vehicle placement
            let vehicleLat = Number(del.liveGPS?.latitude);
            let vehicleLng = Number(del.liveGPS?.longitude);

            // Fallback to departing warehouse if dispatcher hasn't moved the live tracker
            if (!isValidCoordinate(vehicleLat, vehicleLng) && isStartValid) {
                vehicleLat = whLat;
                vehicleLng = whLng;
            }

            if (isValidCoordinate(vehicleLat, vehicleLng)) {
                markers.push({
                    ...del,
                    lat: vehicleLat,
                    lng: vehicleLng,
                });
            }
        });

        return { routes, markers };
    }, [activeDeliveries]);

    return (
        <>
            {/* Route Lines */}
            {layersData.routes.map(rt => {
                const isPending = rt.status === "Pending";
                const lineColor = isPending ? "#F59E0B" : "#0284C7"; // Amber for pending, Sky Blue for active
                const opacity = isPending ? 0.45 : 0.75;
                const dashArray = isPending ? "6, 6" : "8, 5"; // Dashed for pending logistics path

                return (
                    <Polyline
                        key={rt.id}
                        positions={rt.positions}
                        pathOptions={{
                            color: lineColor,
                            weight: 4,
                            opacity: opacity,
                            dashArray: dashArray,
                            lineCap: "round",
                            lineJoin: "round",
                        }}
                    />
                );
            })}

            {/* Active Vehicle Markers */}
            {layersData.markers.map(mk => {
                const icon = createDeliveryIcon(mk);

                return (
                    <Marker
                        key={mk._id}
                        position={[mk.lat, mk.lng]}
                        icon={icon}
                    >
                        <Popup>
                            <div className="p-1 space-y-3 min-w-[245px] font-sans text-slate-800">
                                <div>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                                        VEHICLE TRANSIT #{mk._id.slice(-6).toUpperCase()}
                                    </span>
                                    <h3 className="font-bold text-base leading-tight text-slate-900 mt-1 m-0">
                                        {mk.warehouse?.warehouseName} → {mk.destinationShelter?.name}
                                    </h3>
                                </div>

                                <div className="space-y-1.5 text-xs">
                                    <p className="flex items-start gap-1 m-0">
                                        <strong className="text-slate-500 font-medium w-[85px] shrink-0">Driver Name:</strong>
                                        <span className="text-slate-800 font-semibold">{mk.assignedDriver}</span>
                                    </p>
                                    <p className="flex items-start gap-1 m-0">
                                        <strong className="text-slate-500 font-medium w-[85px] shrink-0">Vehicle tag:</strong>
                                        <span className="text-slate-700 font-mono font-bold bg-slate-105 border px-1 rounded">{mk.assignedVehicle}</span>
                                    </p>
                                    <p className="flex items-start gap-1 m-0">
                                        <strong className="text-slate-505 font-medium w-[85px] shrink-0">Est. Arrival:</strong>
                                        <span className="text-cyan-650 font-bold bg-sky-50 px-1.5 border border-sky-100 rounded">{mk.estimatedArrival || "N/A"}</span>
                                    </p>
                                    {mk.assignedVolunteer && (
                                        <p className="flex items-start gap-1 m-0">
                                            <strong className="text-slate-500 font-medium w-[85px] shrink-0">Escort:</strong>
                                            <span className="text-slate-805 font-medium">{mk.assignedVolunteer?.fullName}</span>
                                        </p>
                                    )}
                                </div>

                                {/* cargo payload summary */}
                                <div className="border-t border-slate-100 pt-2.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Cargo Payload</p>
                                    <ul className="space-y-1 max-h-24 overflow-y-auto pr-1">
                                        {(mk.dispatchedResources || []).map((item, index) => (
                                            <li key={index} className="flex justify-between items-center text-xs font-medium text-slate-750">
                                                <span className="truncate">{item.resource?.resourceName || "Resource"}</span>
                                                <span className="font-semibold text-slate-900 shrink-0">
                                                    {item.quantity} {item.resource?.unit || "units"}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </>
    );
};

export default memo(DeliveryLayer);
