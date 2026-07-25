import { useMemo } from "react";
import { Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import { useAIRecommendations, useAIPredictions } from "../../../hooks/useAIRecommendations";

// ── SVG Marker builders ─────────────────────────────────────────────────────
const getAIMarkerHtml = (type, priority) => {
    let mainColor = "#6366f1"; // indigo default
    let iconSvg = "";

    const priorityColors = {
        Critical: "#e11d48",
        High: "#f59e0b",
        Medium: "#3b82f6",
        Low: "#64748b",
    };
    mainColor = priorityColors[priority] || mainColor;

    if (type === "EvacuationShelter") {
        iconSvg = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/></svg>`;
    } else if (type === "VehicleDispatch") {
        iconSvg = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17h2M17 17h2"/><path d="M12 17H7V5h10l3 6v6h-3"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>`;
    } else if (type === "RescueTeamDeploy") {
        iconSvg = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;
    } else if (type === "HighRiskAlert" || type === "FloodPrediction") {
        iconSvg = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`;
    } else if (type === "IncidentPrioritization") {
        iconSvg = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
    } else {
        // Generic AI brain icon
        iconSvg = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a4 4 0 0 1 4 4v1a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/><path d="M16.5 9.4l.8.6a4 4 0 0 1 .7 5.6l-.6.8a4 4 0 0 1-5.6.7l-.8-.6"/><path d="M7.5 9.4l-.8.6a4 4 0 0 0-.7 5.6l.6.8a4 4 0 0 0 5.6.7l.8-.6"/></svg>`;
    }

    return `
    <div class="relative flex items-center justify-center w-10 h-10">
      <div class="absolute w-8 h-8 rounded-full animate-ping pointer-events-none opacity-30" style="background-color: ${mainColor}"></div>
      <div class="relative flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-lg" style="background-color: ${mainColor}">
        ${iconSvg}
      </div>
    </div>
  `;
};

const AIRecommendationLayer = () => {
    const { data: recsRes } = useAIRecommendations(
        { status: "Pending", limit: 30 },
        { refetchInterval: 20000 }
    );
    const { data: predsRes } = useAIPredictions({ refetchInterval: 30000 });

    const recs = recsRes?.data || [];
    const preds = predsRes?.data || [];

    // Build markers from recommendations that have location metadata
    const recMarkers = useMemo(() => {
        return recs
            .filter((r) => r.metadata?.shelterLat || r.metadata?.lat)
            .map((r) => {
                const lat = r.metadata.shelterLat || r.metadata.lat;
                const lon = r.metadata.shelterLon || r.metadata.lon;
                if (!lat || !lon) return null;

                const icon = L.divIcon({
                    className: "custom-ai-marker-div",
                    html: getAIMarkerHtml(r.recommendationType, r.priority),
                    iconSize: [40, 40],
                    iconAnchor: [20, 20],
                });

                return { id: r._id, lat, lon, icon, data: r, markerType: "recommendation" };
            })
            .filter(Boolean);
    }, [recs]);

    // Build circles from predictions that have flood/risk indicators
    const predCircles = useMemo(() => {
        return preds
            .filter((p) => p.type === "FloodPrediction" && p.indicators)
            .map((p, i) => {
                // Use DISTRICT_RISK_METADATA-like coordinates from the risk summary
                // We'll need to approximate these from the district name
                return { id: `pred-${i}`, district: p.district, data: p };
            });
    }, [preds]);

    return (
        <>
            {/* Recommendation markers */}
            {recMarkers.map((marker) => (
                <Marker key={marker.id} position={[marker.lat, marker.lon]} icon={marker.icon}>
                    <Popup className="custom-leaflet-popup p-0 overflow-hidden w-72">
                        <div className="p-3 font-sans text-xs text-slate-800 space-y-3">
                            <div className="flex items-start gap-2">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${marker.data.priority === "Critical"
                                                ? "bg-rose-100 text-rose-700"
                                                : marker.data.priority === "High"
                                                    ? "bg-amber-100 text-amber-700"
                                                    : "bg-blue-100 text-blue-700"
                                            }`}>
                                            {marker.data.priority}
                                        </span>
                                        <span className="text-[9px] text-slate-400 font-bold">
                                            🤖 AI Recommendation
                                        </span>
                                    </div>
                                    <p className="text-[11px] font-semibold text-slate-800 leading-relaxed">
                                        {marker.data.recommendation}
                                    </p>
                                </div>
                            </div>

                            {/* Confidence Score */}
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-bold text-slate-400">Confidence:</span>
                                <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${marker.data.confidenceScore >= 80
                                                ? "bg-emerald-500"
                                                : marker.data.confidenceScore >= 60
                                                    ? "bg-blue-500"
                                                    : "bg-amber-500"
                                            }`}
                                        style={{ width: `${marker.data.confidenceScore}%` }}
                                    />
                                </div>
                                <span className="text-[9px] font-black text-slate-500">{marker.data.confidenceScore}%</span>
                            </div>

                            {/* ETA if vehicle */}
                            {marker.data.metadata?.etaMinutes && (
                                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-2 text-[10px]">
                                    <span className="font-bold text-indigo-700">
                                        ETA: ~{marker.data.metadata.etaMinutes} min ({marker.data.metadata.distance?.toFixed(1)}km)
                                    </span>
                                </div>
                            )}

                            {/* Available Spots if shelter */}
                            {marker.data.metadata?.availableSpots !== undefined && (
                                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2 text-[10px]">
                                    <span className="font-bold text-emerald-700">
                                        {marker.data.metadata.availableSpots} spots available ({100 - marker.data.metadata.occupancyPct}% free)
                                    </span>
                                </div>
                            )}

                            <div className="text-[9px] text-slate-400 border-t border-slate-100 pt-2">
                                📍 {marker.data.district} · {new Date(marker.data.generatedAt).toLocaleString()}
                            </div>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </>
    );
};

export default AIRecommendationLayer;
