import { useEffect, useRef, useMemo, memo } from "react";
import { Marker, Popup, useMap as useLeafletMap } from "react-leaflet";
import useShelters from "../../../hooks/useShelters";
import { createShelterIcon, getShelterStatus } from "../icons/shelterIcon";
import { useMap } from "../../../context/MapContext";
import { toast } from "react-hot-toast";

const isValidCoordinate = (lat, lng) => {
    if (lat === undefined || lat === null || lng === undefined || lng === null) return false;
    const latitude = Number(lat);
    const longitude = Number(lng);
    return !isNaN(latitude) && !isNaN(longitude) && latitude !== 0 && longitude !== 0;
};

const ShelterLayer = () => {
    const { shelters, isLoading, error } = useShelters();
    const { setNavigationDest } = useMap();
    const map = useLeafletMap();
    const hasMovedManually = useRef(false);

    // Track map interaction to determine if auto zooming is allowed
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

    const mappedShelters = useMemo(() => {
        if (!shelters) return [];
        return shelters.filter((shelter) =>
            isValidCoordinate(shelter.latitude, shelter.longitude)
        );
    }, [shelters]);

    // Fit map bounds to show all markers automatically on load if user hasn't panned or zoomed yet
    useEffect(() => {
        if (!map || hasMovedManually.current || mappedShelters.length === 0) return;

        try {
            const bounds = mappedShelters.map((s) => [Number(s.latitude), Number(s.longitude)]);
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
        } catch (e) {
            console.warn("Auto-zoom to shelter bounds failed:", e);
        }
    }, [mappedShelters, map]);

    const markers = useMemo(() => {
        return mappedShelters.map((shelter) => {
            const status = getShelterStatus(shelter);
            const icon = createShelterIcon(shelter);

            return (
                <Marker
                    key={shelter._id}
                    position={[Number(shelter.latitude), Number(shelter.longitude)]}
                    icon={icon}
                >
                    <Popup>
                        <div className="p-1 space-y-3 min-w-[260px] font-sans text-slate-800">
                            <div className="flex items-start justify-between gap-2">
                                <h3 className="font-bold text-base leading-tight text-slate-900 m-0">
                                    {shelter.name}
                                </h3>
                                <span className={`inline-flex shrink-0 items-center px-2 py-0.5 text-xs font-semibold rounded-md ring-1 ${status === "Open" ? "bg-emerald-50 text-emerald-700 ring-emerald-200 bg-emerald-50" :
                                    status === "Nearly Full" ? "bg-orange-50 text-orange-700 ring-orange-200" :
                                        status === "Full" ? "bg-rose-50 text-rose-700 ring-rose-200" :
                                            "bg-slate-50 text-slate-700 ring-slate-200"
                                    }`}>
                                    <span className="mr-1">
                                        {status === "Open" ? "🟢" : status === "Nearly Full" ? "🟡" : status === "Full" ? "🔴" : "⚫"}
                                    </span>
                                    {status}
                                </span>
                            </div>

                            <div className="space-y-1.5 text-xs">
                                <p className="flex items-start gap-1 m-0">
                                    <strong className="text-slate-500 font-medium w-[90px] shrink-0">District:</strong>
                                    <span className="text-slate-800 font-semibold">{shelter.district}</span>
                                </p>
                                <p className="flex items-start gap-1 m-0">
                                    <strong className="text-slate-500 font-medium w-[90px] shrink-0">Address:</strong>
                                    <span className="text-slate-700">{shelter.address}</span>
                                </p>
                                <p className="flex items-start gap-1 m-0">
                                    <strong className="text-slate-500 font-medium w-[90px] shrink-0">Contact:</strong>
                                    <span className="text-slate-700">{shelter.contactPerson}</span>
                                </p>
                                <p className="flex items-start gap-1 m-0">
                                    <strong className="text-slate-500 font-medium w-[90px] shrink-0">Phone:</strong>
                                    <a href={`tel:${shelter.phone}`} className="text-cyan-600 font-semibold hover:underline">
                                        {shelter.phone}
                                    </a>
                                </p>
                            </div>

                            <div className="border-t border-slate-100 pt-2.5 space-y-1.5 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500">Food Available:</span>
                                    <span className={`font-semibold ${shelter.foodAvailable ? "text-emerald-600" : "text-rose-600"}`}>
                                        {shelter.foodAvailable ? "Yes" : "No"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500">Water Available:</span>
                                    <span className={`font-semibold ${shelter.waterAvailable ? "text-emerald-600" : "text-rose-600"}`}>
                                        {shelter.waterAvailable ? "Yes" : "No"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500">Medical Support:</span>
                                    <span className={`font-semibold ${shelter.medicalSupport ? "text-emerald-600" : "text-slate-500"}`}>
                                        {shelter.medicalSupport ? "Yes" : "No"}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-2.5 text-center">
                                <div className="bg-slate-50 rounded-xl p-1.5">
                                    <span className="block text-slate-400 text-[10px] uppercase font-semibold">Capacity</span>
                                    <span className="font-bold text-sm text-slate-800">{shelter.capacity}</span>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-1.5">
                                    <span className="block text-slate-400 text-[10px] uppercase font-semibold">Occupied</span>
                                    <span className="font-bold text-sm text-slate-800">{shelter.occupancy}</span>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-1.5">
                                    <span className="block text-slate-400 text-[10px] uppercase font-semibold">Available</span>
                                    <span className="font-bold text-sm text-slate-800">{shelter.availableBeds}</span>
                                </div>
                            </div>

                            {status !== "Closed" && status !== "Full" && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setNavigationDest(shelter);
                                        toast.success(`Navigating to ${shelter.name}...`);
                                    }}
                                    className="w-full mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 py-2.5 text-xs font-semibold text-white shadow-sm transition"
                                >
                                    Navigate to Shelter
                                </button>
                            )}
                        </div>
                    </Popup>
                </Marker>
            );
        });
    }, [mappedShelters]);

    const errorMessage = error
        ? typeof error === "string"
            ? error
            : error?.message || "Unable to load shelters."
        : null;

    return (
        <>
            {isLoading && (
                <div className="absolute top-4 right-4 z-[1000] bg-white/95 backdrop-blur-sm px-3.5 py-2 rounded-2xl shadow-lg border border-slate-200 flex items-center gap-2 text-xs font-semibold text-slate-700 animate-pulse pointer-events-none">
                    <svg className="animate-spin h-3.5 w-3.5 text-cyan-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Loading shelters...</span>
                </div>
            )}

            {errorMessage && (
                <div className="absolute top-4 right-4 z-[1000] bg-rose-50/95 backdrop-blur-sm px-3.5 py-2 rounded-2xl shadow-lg border border-rose-200 flex items-center gap-2 text-xs font-semibold text-rose-700 pointer-events-none">
                    <svg className="h-3.5 w-3.5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>Error: {errorMessage}</span>
                </div>
            )}

            {markers}
        </>
    );
};

export default memo(ShelterLayer);
