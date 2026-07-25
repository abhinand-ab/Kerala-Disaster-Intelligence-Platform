import { useMemo, memo } from "react";
import { Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import { useCommandCenters } from "../../../hooks/useCommandCenter";

const isValidCoordinate = (lat, lng) => {
    if (lat === undefined || lat === null || lng === undefined || lng === null) return false;
    const l1 = Number(lat);
    const l2 = Number(lng);
    return !isNaN(l1) && !isNaN(l2) && l1 !== 0 && l2 !== 0;
};

// Custom DivIcon creator for Command Center Incident command post
const createCommandPostIcon = (commander) => {
    const html = `
    <div class="relative flex items-center justify-center w-12 h-12">
      <!-- Outer pulsing ring -->
      <div class="absolute w-12 h-12 rounded-full bg-indigo-600 opacity-20 animate-ping pointer-events-none"></div>
      <!-- Inner glow -->
      <div class="absolute w-10 h-10 rounded-full bg-indigo-500 opacity-25 animate-pulse pointer-events-none"></div>
      
      <!-- Core icon container -->
      <div class="relative flex items-center justify-center w-9 h-9 rounded-full bg-indigo-600 border-2 border-white shadow-xl">
        <!-- Building/Flag icon inside -->
        <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
          <line x1="4" y1="22" x2="4" y2="15"></line>
        </svg>
      </div>
    </div>
  `;

    return L.divIcon({
        html,
        className: "custom-command-post-marker-container",
        iconSize: [48, 48],
        iconAnchor: [24, 24],
        popupAnchor: [0, -24],
    });
};

// Custom DivIcon creator for participating Agency Headquarters
const createAgencyHeadquartersIcon = (agencyType) => {
    const html = `
    <div class="relative flex items-center justify-center w-10 h-10">
      <div class="relative flex items-center justify-center w-8 h-8 rounded-full bg-amber-500 border-2 border-white shadow-md">
        <!-- Shield/Building icon inside -->
        <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      </div>
    </div>
  `;

    return L.divIcon({
        html,
        className: "custom-agency-hq-marker-container",
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20],
    });
};

const CommandCenterLayer = () => {
    const { data: centers = [], isLoading } = useCommandCenters();

    const activeCenters = useMemo(() => {
        return centers.filter(c => c.status === "Active" && c.incident && isValidCoordinate(c.incident.location?.latitude, c.incident.location?.longitude));
    }, [centers]);

    if (isLoading || activeCenters.length === 0) return null;

    return (
        <>
            {activeCenters.map((center) => {
                const incidentCoord = [center.incident.location.latitude, center.incident.location.longitude];

                // Track agencies for this center with valid HQ coordinates
                const validAgencies = (center.participatingAgencies || []).filter(agency =>
                    agency.headquarters && isValidCoordinate(agency.headquarters.latitude, agency.headquarters.longitude)
                );

                return (
                    <g key={center._id}>
                        {/* 1. Main Command Center Post (Incident Location) */}
                        <Marker
                            position={incidentCoord}
                            icon={createCommandPostIcon(center.assignedCommander)}
                        >
                            <Popup>
                                <div className="p-2 space-y-2 min-w-[280px] font-sans text-slate-800">
                                    <div className="flex items-center justify-between pointer-events-none">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                                            🏢 Multi-Agency Command Center
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-medium">Active Room</span>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-slate-900 text-sm leading-snug">
                                            Incident: {center.incident.title}
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-1">Commander: {center.assignedCommander}</p>
                                    </div>

                                    <div className="border-t border-slate-100 pt-2 space-y-1.5 text-xs text-slate-600">
                                        <p className="m-0 flex items-center justify-between">
                                            <span>Participating Agencies:</span>
                                            <strong className="text-slate-900">{(center.participatingAgencies || []).length}</strong>
                                        </p>
                                        <p className="m-0 flex items-center justify-between">
                                            <span>Active Missions:</span>
                                            <strong className="text-emerald-600">{(center.activeMissions || []).filter(m => m.status !== "Completed" && m.status !== "Aborted").length}</strong>
                                        </p>
                                        <p className="m-0 flex items-center justify-between">
                                            <span>Shared Resources:</span>
                                            <strong className="text-amber-600">{(center.sharedResources || []).length}</strong>
                                        </p>
                                    </div>

                                    {center.objectives && center.objectives.length > 0 && (
                                        <div className="border-t border-slate-100 pt-2">
                                            <span className="block text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">Objectives:</span>
                                            <ul className="m-0 pl-4 text-xs text-slate-600 list-disc space-y-0.5">
                                                {center.objectives.map((obj, i) => (
                                                    <li key={i}>{obj}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </Popup>
                        </Marker>

                        {/* 2. Participating Agencies & Connection Polylines */}
                        {validAgencies.map((agency) => {
                            const agencyCoord = [agency.headquarters.latitude, agency.headquarters.longitude];

                            return (
                                <g key={agency._id}>
                                    {/* Link Command Center to headquarters */}
                                    <Polyline
                                        positions={[incidentCoord, agencyCoord]}
                                        pathOptions={{
                                            color: "#4f46e5",
                                            weight: 2,
                                            dashArray: "5, 10",
                                            opacity: 0.7
                                        }}
                                    />

                                    {/* Agency Headquarters Marker */}
                                    <Marker
                                        position={agencyCoord}
                                        icon={createAgencyHeadquartersIcon(agency.agencyType)}
                                    >
                                        <Popup>
                                            <div className="p-1 space-y-1.5 text-xs text-slate-800 font-sans min-w-[200px]">
                                                <h4 className="font-bold text-slate-900 border-b pb-1 mb-1">{agency.agencyName}</h4>
                                                <p className="m-0"><strong>Type:</strong> {agency.agencyType}</p>
                                                <p className="m-0"><strong>District:</strong> {agency.district}</p>
                                                <p className="m-0"><strong>Contact:</strong> {agency.contactPerson || "N/A"}</p>
                                                <p className="m-0"><strong>Phone:</strong> {agency.phone || "N/A"}</p>
                                            </div>
                                        </Popup>
                                    </Marker>
                                </g>
                            );
                        })}
                    </g>
                );
            })}
        </>
    );
};

export default memo(CommandCenterLayer);
