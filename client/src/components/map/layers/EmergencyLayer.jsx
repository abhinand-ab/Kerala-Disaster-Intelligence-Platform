import { useMemo } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { useEmergencyRequests } from "../../../hooks/useEmergencyRequests";
import {
    ShieldAlert,
    User,
    Phone,
    AlertOctagon,
    CheckCircle,
    Truck,
    Building,
    Navigation,
    Image,
    Video
} from "lucide-react";

// Inline helper for SOS marker Leaflet HTML
const getEmergencySOSMarkerHtml = (name, type, severity, status) => {
    let mainColor = "#dc2626"; // red
    let pingColor = "bg-red-650";
    let iconSvg = "";

    if (severity === "Critical") {
        mainColor = "#dc2626";
        pingColor = "bg-red-600";
        iconSvg = `
      <svg class="w-5 h-5 text-white animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    `;
    } else if (severity === "High") {
        mainColor = "#f97316"; // orange
        pingColor = "bg-orange-500";
        iconSvg = `
      <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    `;
    } else if (severity === "Medium") {
        mainColor = "#eab308"; // yellow
        pingColor = "bg-yellow-500";
        iconSvg = `
      <svg class="w-5 h-5 text-slate-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    `;
    } else {
        mainColor = "#10b981"; // emerald green
        pingColor = "bg-emerald-500";
        iconSvg = `
      <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="m9 12 2 2 4-4"/>
      </svg>
    `;
    }

    // Draw active ping animations for pending SOS requests
    const showPing = status !== "Resolved" && status !== "Cancelled";

    return `
    <div class="relative flex items-center justify-center w-10 h-10">
      ${showPing
            ? `<div class="absolute w-8 h-8 rounded-full ${pingColor} opacity-40 animate-ping pointer-events-none"></div>`
            : ""
        }
      <div class="relative flex items-center justify-center w-9 h-9 rounded-full shadow-lg border-2 border-slate-900" style="background-color: ${mainColor}">
        ${iconSvg}
      </div>
    </div>
  `;
};

const EmergencyLayer = () => {
    // Query all requests to place markers on Map container
    const { data: requests = [] } = useEmergencyRequests({});

    const markers = useMemo(() => {
        return requests
            .filter((r) => r.latitude && r.longitude)
            .map((r) => {
                const icon = L.divIcon({
                    className: "custom-sos-marker-div",
                    html: getEmergencySOSMarkerHtml(r.citizenName, r.emergencyType, r.severity, r.requestStatus),
                    iconSize: [40, 40],
                    iconAnchor: [20, 20],
                });

                return {
                    id: r._id,
                    lat: r.latitude,
                    lon: r.longitude,
                    icon,
                    data: r,
                };
            });
    }, [requests]);

    return (
        <>
            {markers.map((marker) => (
                <Marker key={marker.id} position={[marker.lat, marker.lon]} icon={marker.icon}>
                    <Popup className="custom-leaflet-popup font-sans w-72">
                        <div className="p-3 space-y-4 max-h-[350px] overflow-y-auto">
                            {/* Header Status */}
                            <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                                <div>
                                    <h4 className="font-extrabold text-[13px] text-slate-800 flex items-center gap-1">
                                        <AlertOctagon className="w-4 h-4 text-red-650" /> {marker.data.emergencyType} SOS
                                    </h4>
                                    <span className="text-[10px] text-slate-400 block mt-0.5">
                                        Reported: {new Date(marker.data.createdAt).toLocaleString("en-IN")}
                                    </span>
                                </div>
                                <span
                                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${marker.data.severity === "Critical"
                                            ? "bg-red-100 text-red-600 animate-pulse"
                                            : marker.data.severity === "High"
                                                ? "bg-orange-100 text-orange-700"
                                                : marker.data.severity === "Medium"
                                                    ? "bg-yellow-108 text-yellow-700 bg-yellow-50"
                                                    : "bg-emerald-50 text-emerald-600"
                                        }`}
                                >
                                    {marker.data.severity}
                                </span>
                            </div>

                            {/* Citizen Details */}
                            <div className="text-xs text-slate-700 space-y-2 bg-slate-50 p-2.5 rounded-lg border border-slate-201/50">
                                <p className="flex items-center gap-1.5 font-bold text-slate-800">
                                    <User className="w-3.5 h-3.5 text-slate-400" /> {marker.data.citizenName}
                                </p>
                                <p className="flex items-center gap-1.5 font-medium text-slate-600">
                                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {marker.data.phone}
                                </p>
                                {marker.data.address && (
                                    <p className="flex items-start gap-1.5 font-medium text-slate-500">
                                        <Navigation className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                        <span>{marker.data.address}</span>
                                    </p>
                                )}
                            </div>

                            {/* Description */}
                            <div className="space-y-1">
                                <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Incident Message</h5>
                                <p className="text-xs text-slate-700 italic border-l-2 border-red-500 pl-2 leading-relaxed">
                                    "{marker.data.description}"
                                </p>
                            </div>

                            {/* Media attachments */}
                            {(marker.data.photos?.length > 0 || marker.data.videos?.length > 0) && (
                                <div className="space-y-2 pt-1 border-t border-slate-100">
                                    <h5 className="text-[10px] font-bold text-slate-450 uppercase tracking-widest flex items-center gap-1">
                                        <Image className="w-3 h-3 text-slate-400" /> Attached Incident Media
                                    </h5>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {marker.data.photos?.map((url, index) => (
                                            <a
                                                key={index}
                                                href={url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="block bg-slate-100 rounded overflow-hidden aspect-video border border-slate-200 relative group"
                                            >
                                                <img
                                                    src={url}
                                                    alt={`sos-img-${index}`}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition"
                                                />
                                            </a>
                                        ))}
                                        {marker.data.videos?.map((url, index) => (
                                            <a
                                                key={index}
                                                href={url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="bg-slate-100 rounded overflow-hidden aspect-video border border-slate-200 flex items-center justify-center relative group"
                                            >
                                                <Video className="w-5 h-5 text-slate-500 group-hover:scale-110 transition" />
                                                <span className="absolute bottom-1 right-1 text-[8px] bg-slate-900/60 text-white px-1 py-0.5 rounded">
                                                    Video
                                                </span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Responder Engagements */}
                            <div className="space-y-2 pt-2 border-t border-slate-100">
                                <span className="text-[10px] font-bold text-slate-450 uppercase block">Dispatched Responders</span>
                                <div className="space-y-1.5">
                                    {marker.data.assignedTeam && (
                                        <div className="bg-orange-50 border border-orange-100 text-orange-850 p-2 rounded flex items-center gap-1.5 text-[10px] font-bold">
                                            <ShieldAlert className="w-4 h-4 text-orange-500" />
                                            Rescue Team: {marker.data.assignedTeam.teamName}
                                        </div>
                                    )}
                                    {marker.data.assignedVehicle && (
                                        <div className="bg-blue-50 border border-blue-105 text-blue-850 p-2 rounded flex items-center gap-1.5 text-[10px] font-bold">
                                            <Truck className="w-4 h-4 text-blue-500" />
                                            Vehicle: {marker.data.assignedVehicle.vehicleNumber}
                                        </div>
                                    )}
                                    {marker.data.assignedShelter && (
                                        <div className="bg-indigo-50 border border-indigo-110 text-indigo-850 p-2 rounded flex items-center gap-1.5 text-[10px] font-bold">
                                            <Building className="w-4 h-4 text-indigo-550" />
                                            Shelter: {marker.data.assignedShelter.name}
                                        </div>
                                    )}
                                    {!marker.data.assignedTeam && !marker.data.assignedVehicle && !marker.data.assignedShelter && (
                                        <p className="text-[10px] text-slate-450 italic">No assets assigned yet. Evaluate suggestions in dashboard.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </>
    );
};

export default EmergencyLayer;
