import { useEffect, useRef, useMemo, memo } from "react";
import { Marker, Popup, useMap as useLeafletMap } from "react-leaflet";
import useWarehouses from "../../../hooks/useWarehouses";
import { createWarehouseIcon } from "../icons/warehouseIcon";

const isValidCoordinate = (lat, lng) => {
    if (lat === undefined || lat === null || lng === undefined || lng === null) return false;
    const latitude = Number(lat);
    const longitude = Number(lng);
    return !isNaN(latitude) && !isNaN(longitude) && latitude !== 0 && longitude !== 0;
};

const WarehouseLayer = () => {
    const { warehouses, isLoading } = useWarehouses();
    const map = useLeafletMap();
    const hasMovedManually = useRef(false);

    useEffect(() => {
        if (!map) return;
        const handleMove = () => {
            hasMovedManually.current = true;
        };
        map.on("dragstart", handleMove);
        map.on("zoomstart", handleMove);

        return () => {
            map.off("dragstart", handleMove);
            map.off("zoomstart", handleMove);
        };
    }, [map]);

    const mappedWarehouses = useMemo(() => {
        if (!warehouses) return [];
        return warehouses.filter(w => isValidCoordinate(w.latitude, w.longitude));
    }, [warehouses]);

    // Auto-zoom
    useEffect(() => {
        if (!map || hasMovedManually.current || mappedWarehouses.length === 0) return;
        try {
            const coords = mappedWarehouses.map(w => [Number(w.latitude), Number(w.longitude)]);
            map.fitBounds(coords, { padding: [50, 50], maxZoom: 11 });
        } catch (error) {
            console.warn("Auto-zoom to warehouses failed:", error);
        }
    }, [mappedWarehouses, map]);

    const markers = useMemo(() => {
        return mappedWarehouses.map(wh => {
            const icon = createWarehouseIcon(wh);
            const util = wh.currentUtilization || 0;

            return (
                <Marker
                    key={wh._id}
                    position={[Number(wh.latitude), Number(wh.longitude)]}
                    icon={icon}
                >
                    <Popup>
                        <div className="p-1 space-y-3 min-w-[240px] font-sans text-slate-800">
                            <div>
                                <h3 className="font-bold text-base leading-tight text-slate-900 m-0">
                                    {wh.warehouseName}
                                </h3>
                                <span className="inline-block bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] uppercase font-bold mt-1 tracking-wide">
                                    Storage Hub
                                </span>
                            </div>

                            <div className="space-y-1.5 text-xs">
                                <p className="flex items-start gap-1 m-0">
                                    <strong className="text-slate-500 font-medium w-[80px] shrink-0">District:</strong>
                                    <span className="text-slate-800 font-semibold">{wh.district}</span>
                                </p>
                                <p className="flex items-start gap-1 m-0">
                                    <strong className="text-slate-500 font-medium w-[80px] shrink-0">Address:</strong>
                                    <span className="text-slate-700 truncate">{wh.address}</span>
                                </p>
                                <p className="flex items-start gap-1 m-0">
                                    <strong className="text-slate-500 font-medium w-[80px] shrink-0">Manager:</strong>
                                    <span className="text-slate-800 font-semibold">{wh.manager}</span>
                                </p>
                                <p className="flex items-start gap-1 m-0">
                                    <strong className="text-slate-500 font-medium w-[80px] shrink-0">Phone:</strong>
                                    <span className="text-cyan-600 font-semibold">{wh.phone}</span>
                                </p>
                            </div>

                            {/* Space Utilization Details */}
                            <div className="border-t border-slate-100 pt-2.5 space-y-1 text-xs">
                                <div className="flex justify-between text-slate-500">
                                    <span>Space utilization:</span>
                                    <span className="font-bold text-slate-800">{util}%</span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${util > 80 ? "bg-rose-500" : util > 50 ? "bg-amber-500" : "bg-emerald-500"}`}
                                        style={{ width: `${util}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-[11px] text-slate-450 mt-1">
                                    <span>Capacity Limit:</span>
                                    <span>{wh.storageCapacity} units</span>
                                </div>
                            </div>
                        </div>
                    </Popup>
                </Marker>
            );
        });
    }, [mappedWarehouses]);

    return <>{markers}</>;
};

export default memo(WarehouseLayer);
