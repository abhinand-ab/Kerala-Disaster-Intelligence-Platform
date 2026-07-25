import { useEffect, useRef, useMemo, memo } from "react";
import { Marker, Popup, useMap as useLeafletMap } from "react-leaflet";
import useRescueTeams from "../../../hooks/useRescueTeams";
import { createRescueTeamIcon, getRescueTeamStatusColor } from "../icons/rescueTeamIcon";

const isValidCoordinate = (lat, lng) => {
    if (lat === undefined || lat === null || lng === undefined || lng === null) return false;
    const latitude = Number(lat);
    const longitude = Number(lng);
    return !isNaN(latitude) && !isNaN(longitude) && latitude !== 0 && longitude !== 0;
};

const RescueTeamLayer = () => {
    const { teams, isLoading, error } = useRescueTeams();
    const map = useLeafletMap();
    const hasMovedManually = useRef(false);

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

    const mappedTeams = useMemo(() => {
        if (!teams) return [];
        return teams
            .map((team) => {
                let latitude = null;
                let longitude = null;
                let source = "Unknown";

                if (team.assignedVehicle && isValidCoordinate(team.assignedVehicle.latitude, team.assignedVehicle.longitude)) {
                    latitude = Number(team.assignedVehicle.latitude);
                    longitude = Number(team.assignedVehicle.longitude);
                    source = `Vehicle (${team.assignedVehicle.vehicleNumber})`;
                } else if (team.leader && isValidCoordinate(team.leader.latitude, team.leader.longitude)) {
                    latitude = Number(team.leader.latitude);
                    longitude = Number(team.leader.longitude);
                    source = `Leader (${team.leader.fullName})`;
                } else if (Array.isArray(team.members)) {
                    const activeMember = team.members.find(m => isValidCoordinate(m.latitude, m.longitude));
                    if (activeMember) {
                        latitude = Number(activeMember.latitude);
                        longitude = Number(activeMember.longitude);
                        source = `Member (${activeMember.fullName})`;
                    }
                }

                return {
                    ...team,
                    latitude,
                    longitude,
                    locationSource: source,
                };
            })
            .filter((t) => t.latitude !== null && t.longitude !== null);
    }, [teams]);

    // Fit map bounds to show all markers automatically on load if user hasn't panned or zoomed yet
    useEffect(() => {
        if (!map || hasMovedManually.current || mappedTeams.length === 0) return;

        try {
            const bounds = mappedTeams.map((t) => [t.latitude, t.longitude]);
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
        } catch (e) {
            console.warn("Auto-zoom to rescue teams bounds failed:", e);
        }
    }, [mappedTeams, map]);

    const markers = useMemo(() => {
        return mappedTeams.map((team) => {
            const colors = getRescueTeamStatusColor(team.status);
            const icon = createRescueTeamIcon(team);

            return (
                <Marker
                    key={team._id}
                    position={[team.latitude, team.longitude]}
                    icon={icon}
                >
                    <Popup>
                        <div className="p-1 space-y-3 min-w-[270px] font-sans text-slate-800">
                            <div className="flex items-start justify-between gap-2">
                                <h3 className="font-bold text-base leading-tight text-slate-900 m-0">
                                    {team.teamName}
                                </h3>
                                <span className={`inline-flex shrink-0 items-center px-2 py-0.5 text-xs font-semibold rounded-md ring-1 bg-white ${colors.text} ${colors.border}`}>
                                    <span className="mr-1">🛡️</span>
                                    {team.status}
                                </span>
                            </div>

                            <div className="space-y-1.5 text-xs">
                                <p className="flex items-start gap-1 m-0">
                                    <strong className="text-slate-500 font-medium w-[100px] shrink-0">Specialization:</strong>
                                    <span className="text-slate-800 font-semibold">{team.specialization || "General"}</span>
                                </p>
                                <p className="flex items-start gap-1 m-0">
                                    <strong className="text-slate-500 font-medium w-[100px] shrink-0">Leader:</strong>
                                    <span className="text-slate-800 font-semibold">{team.leader?.fullName || "None"}</span>
                                </p>
                                <p className="flex items-start gap-1 m-0">
                                    <strong className="text-slate-500 font-medium w-[100px] shrink-0">Members Count:</strong>
                                    <span className="text-slate-800 font-semibold">{team.members?.length || 0} members</span>
                                </p>
                                <p className="flex items-start gap-1 m-0">
                                    <strong className="text-slate-500 font-medium w-[100px] shrink-0">Assigned Vehicle:</strong>
                                    <span className="text-slate-800 font-semibold">
                                        {team.assignedVehicle ? `${team.assignedVehicle.vehicleNumber} (${team.assignedVehicle.vehicleType})` : "None"}
                                    </span>
                                </p>
                                <p className="flex items-start gap-1 m-0">
                                    <strong className="text-slate-500 font-medium w-[100px] shrink-0">District:</strong>
                                    <span className="text-slate-800 font-semibold">{team.district}</span>
                                </p>
                                <p className="flex items-start gap-1 m-0">
                                    <strong className="text-slate-500 font-medium w-[100px] shrink-0">Map Source:</strong>
                                    <span className="text-cyan-700 font-semibold italic">{team.locationSource}</span>
                                </p>
                            </div>

                            {team.assignedIncident && (
                                <div className="border-t border-slate-100 pt-2.5">
                                    <strong className="block text-rose-500 text-[10px] uppercase font-bold mb-1">Assigned Mission</strong>
                                    <div className="bg-rose-50 border border-rose-100 rounded-lg p-2 text-[10px]">
                                        <span className="font-semibold text-slate-900 block">{team.assignedIncident.title}</span>
                                        <span className="text-slate-500 mt-0.5 block">Severity: {team.assignedIncident.severity}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Popup>
                </Marker>
            );
        });
    }, [mappedTeams]);

    const errorMessage = error
        ? typeof error === "string"
            ? error
            : error?.message || "Unable to load rescue teams."
        : null;

    return (
        <>
            {isLoading && (
                <div className="absolute top-28 right-4 z-[1000] bg-white/95 backdrop-blur-sm px-3.5 py-2 rounded-2xl shadow-lg border border-slate-200 flex items-center gap-2 text-xs font-semibold text-slate-700 animate-pulse pointer-events-none">
                    <svg className="animate-spin h-3.5 w-3.5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Loading rescue teams...</span>
                </div>
            )}

            {errorMessage && (
                <div className="absolute top-28 right-4 z-[1000] bg-rose-50/95 backdrop-blur-sm px-3.5 py-2 rounded-2xl shadow-lg border border-rose-200 flex items-center gap-2 text-xs font-semibold text-rose-700 pointer-events-none">
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

export default memo(RescueTeamLayer);
