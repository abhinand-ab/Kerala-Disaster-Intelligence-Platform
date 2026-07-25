import { useEffect, useRef, useMemo, memo } from "react";
import { Marker, Popup, useMap as useLeafletMap } from "react-leaflet";
import useVolunteers from "../../../hooks/useVolunteers";
import { createVolunteerIcon, getVolunteerStatus } from "../icons/volunteerIcon";
import { toast } from "react-hot-toast";

const isValidCoordinate = (lat, lng) => {
    if (lat === undefined || lat === null || lng === undefined || lng === null) return false;
    const latitude = Number(lat);
    const longitude = Number(lng);
    return !isNaN(latitude) && !isNaN(longitude) && latitude !== 0 && longitude !== 0;
};

const VolunteerLayer = () => {
    const { volunteers, isLoading, error } = useVolunteers();
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

    const mappedVolunteers = useMemo(() => {
        if (!volunteers) return [];
        return volunteers.filter((vol) =>
            isValidCoordinate(vol.latitude, vol.longitude)
        );
    }, [volunteers]);

    // Fit map bounds to show all markers automatically on load if user hasn't panned or zoomed yet
    useEffect(() => {
        if (!map || hasMovedManually.current || mappedVolunteers.length === 0) return;

        try {
            const bounds = mappedVolunteers.map((v) => [Number(v.latitude), Number(v.longitude)]);
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
        } catch (e) {
            console.warn("Auto-zoom to volunteer bounds failed:", e);
        }
    }, [mappedVolunteers, map]);

    const markers = useMemo(() => {
        return mappedVolunteers.map((vol) => {
            const status = getVolunteerStatus(vol);
            const icon = createVolunteerIcon(vol);

            return (
                <Marker
                    key={vol._id}
                    position={[Number(vol.latitude), Number(vol.longitude)]}
                    icon={icon}
                >
                    <Popup>
                        <div className="p-1 space-y-3 min-w-[260px] font-sans text-slate-800">
                            <div className="flex items-start justify-between gap-2">
                                <h3 className="font-bold text-base leading-tight text-slate-900 m-0">
                                    {vol.fullName}
                                </h3>
                                <span className={`inline-flex shrink-0 items-center px-2/5 py-0.5 text-xs font-semibold rounded-md ring-1 ${status === "Available" ? "bg-emerald-50 text-emerald-700 ring-emerald-200" :
                                    "bg-amber-50 text-amber-700 ring-amber-200"
                                    }`}>
                                    <span className="mr-1">
                                        {status === "Available" ? "🟢" : "🟡"}
                                    </span>
                                    {status}
                                </span>
                            </div>

                            <div className="space-y-1.5 text-xs">
                                <p className="flex items-start gap-1 m-0">
                                    <strong className="text-slate-500 font-medium w-[90px] shrink-0">Rescue Team:</strong>
                                    <span className="text-slate-800 font-semibold">{vol.team || "None"}</span>
                                </p>
                                <p className="flex items-start gap-1 m-0">
                                    <strong className="text-slate-500 font-medium w-[90px] shrink-0">District:</strong>
                                    <span className="text-slate-800 font-semibold">{vol.district}</span>
                                </p>
                                <p className="flex items-start gap-1 m-0">
                                    <strong className="text-slate-500 font-medium w-[90px] shrink-0">Contact Number:</strong>
                                    <a href={`tel:${vol.phone}`} className="text-cyan-600 font-semibold hover:underline">
                                        {vol.phone}
                                    </a>
                                </p>
                                <p className="flex items-start gap-1 m-0">
                                    <strong className="text-slate-500 font-medium w-[90px] shrink-0">Email:</strong>
                                    <span className="text-slate-700 font-semibold">{vol.email}</span>
                                </p>
                            </div>

                            {vol.skills && vol.skills.length > 0 && (
                                <div className="border-t border-slate-100 pt-2.5">
                                    <strong className="block text-slate-500 text-[10px] uppercase font-semibold mb-1">Skills</strong>
                                    <div className="flex flex-wrap gap-1">
                                        {vol.skills.map((skill, index) => (
                                            <span key={index} className="bg-sky-50 text-sky-800 border border-sky-100 rounded px-1.5 py-0.5 text-[10px] font-medium">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {vol.currentIncident && (
                                <div className="border-t border-slate-100 pt-2.5">
                                    <strong className="block text-amber-500 text-[10px] uppercase font-bold mb-1">Assigned Incident</strong>
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-[10px]">
                                        <span className="font-semibold text-slate-850 block">{vol.currentIncident.title}</span>
                                        <span className="text-slate-500 mt-0.5 block">Category: {vol.currentIncident.category}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Popup>
                </Marker>
            );
        });
    }, [mappedVolunteers]);

    const errorMessage = error
        ? typeof error === "string"
            ? error
            : error?.message || "Unable to load volunteers."
        : null;

    return (
        <>
            {isLoading && (
                <div className="absolute top-16 right-4 z-[1000] bg-white/95 backdrop-blur-sm px-3.5 py-2 rounded-2xl shadow-lg border border-slate-200 flex items-center gap-2 text-xs font-semibold text-slate-700 animate-pulse pointer-events-none">
                    <svg className="animate-spin h-3.5 w-3.5 text-cyan-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Loading volunteers...</span>
                </div>
            )}

            {errorMessage && (
                <div className="absolute top-16 right-4 z-[1000] bg-rose-50/95 backdrop-blur-sm px-3.5 py-2 rounded-2xl shadow-lg border border-rose-200 flex items-center gap-2 text-xs font-semibold text-rose-700 pointer-events-none">
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

export default memo(VolunteerLayer);
