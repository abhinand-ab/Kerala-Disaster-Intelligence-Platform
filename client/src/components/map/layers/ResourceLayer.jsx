import { useMemo, memo } from "react";
import { Marker, Popup } from "react-leaflet";
import useResources from "../../../hooks/useResources";
import { createResourceIcon } from "../icons/resourceIcon";

const isValidCoordinate = (lat, lng) => {
    if (lat === undefined || lat === null || lng === undefined || lng === null) return false;
    const latitude = Number(lat);
    const longitude = Number(lng);
    return !isNaN(latitude) && !isNaN(longitude) && latitude !== 0 && longitude !== 0;
};

const ResourceLayer = () => {
    const { resources } = useResources();

    const mappedResources = useMemo(() => {
        if (!resources) return [];
        // Filter valid coordinates and add subtle jitter/offset if they overlap on the exact same spot 
        // so that they don't hide directly behind each other.
        const coordinatesMap = {};

        return resources
            .filter(r => isValidCoordinate(r.latitude, r.longitude))
            .map(r => {
                const baseKey = `${Number(r.latitude).toFixed(4)}_${Number(r.longitude).toFixed(4)}`;
                if (coordinatesMap[baseKey] === undefined) {
                    coordinatesMap[baseKey] = 0;
                } else {
                    coordinatesMap[baseKey] += 1;
                }

                // Offset slightly for overlap jittering (approx 15-20 meters)
                const jitterIndex = coordinatesMap[baseKey];
                const angle = jitterIndex * 0.5; // Rads
                const radius = 0.00015 * Math.sqrt(jitterIndex); // Offset coordinate delta

                const finalLat = Number(r.latitude) + (jitterIndex > 0 ? radius * Math.cos(angle) : 0);
                const finalLng = Number(r.longitude) + (jitterIndex > 0 ? radius * Math.sin(angle) : 0);

                return {
                    ...r,
                    finalLat,
                    finalLng
                };
            });
    }, [resources]);

    const markers = useMemo(() => {
        return mappedResources.map(res => {
            const icon = createResourceIcon(res);

            return (
                <Marker
                    key={res._id}
                    position={[res.finalLat, res.finalLng]}
                    icon={icon}
                >
                    <Popup>
                        <div className="p-1 space-y-3 min-w-[220px] font-sans text-slate-800">
                            <div>
                                <div className="flex justify-between items-center gap-1">
                                    <h3 className="font-bold text-base leading-tight text-slate-900 m-0 truncate">
                                        {res.resourceName}
                                    </h3>
                                    <span className={`inline-block px-2 py-0.5 rounded text-[9px] uppercase font-bold ${res.status === "Out of Stock" ? "bg-rose-50 text-rose-700" :
                                            res.status === "Low Stock" ? "bg-amber-50 text-amber-700" :
                                                "bg-emerald-50 text-emerald-700"
                                        }`}>
                                        {res.status}
                                    </span>
                                </div>
                                <span className="inline-block bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] uppercase font-bold mt-1 tracking-wide">
                                    {res.category}
                                </span>
                            </div>

                            <div className="space-y-1 text-xs">
                                <p className="flex items-center gap-1 m-0">
                                    <strong className="text-slate-500 font-medium w-[75px] shrink-0">Quantity:</strong>
                                    <span className="text-slate-900 font-extrabold text-sm">{res.quantity} <span className="text-[10px] font-semibold text-slate-500">{res.unit}</span></span>
                                </p>
                                <p className="flex items-start gap-1 m-0">
                                    <strong className="text-slate-500 font-medium w-[75px] shrink-0">District:</strong>
                                    <span className="text-slate-800 font-semibold">{res.district}</span>
                                </p>
                                <p className="flex items-start gap-1 m-0 animate-fadeIn">
                                    <strong className="text-slate-500 font-medium w-[75px] shrink-0">Warehouse:</strong>
                                    <span className="text-slate-700 font-semibold truncate">{res.warehouse?.warehouseName || "N/A"}</span>
                                </p>
                                {res.supplier && (
                                    <p className="flex items-start gap-1 m-0">
                                        <strong className="text-slate-500 font-medium w-[75px] shrink-0">Supplier:</strong>
                                        <span className="text-slate-700 truncate">{res.supplier}</span>
                                    </p>
                                )}
                            </div>
                        </div>
                    </Popup>
                </Marker>
            );
        });
    }, [mappedResources]);

    return <>{markers}</>;
};

export default memo(ResourceLayer);
