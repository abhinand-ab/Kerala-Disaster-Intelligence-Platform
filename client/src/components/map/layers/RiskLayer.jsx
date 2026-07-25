import { useEffect, useState, useMemo, memo } from "react";
import { GeoJSON, Marker, Popup, Circle, useMap as useLeafletMap } from "react-leaflet";
import L from "leaflet";
import { useRisk } from "../../../hooks/useRisk";
import {
    AlertTriangle,
    Waves,
    Mountain,
    Droplet,
    Compass,
    ChevronsUp,
    MapPin,
    Flame,
    ShieldAlert
} from "lucide-react";

// Custom marker icon HTML for high-risk alerts
const getRiskMarkerHtml = (district, riskLevel, riskScore, riskType) => {
    const isExtreme = riskLevel === "Extreme";
    const bgClass = isExtreme ? "bg-red-500 text-white border-red-700" : "bg-orange-500 text-white border-orange-700";
    const pulseColor = isExtreme ? "bg-red-500" : "bg-orange-500";

    return `
    <div class="relative flex flex-col items-center justify-center w-12 h-12">
      <!-- Pulsing Glow Ring -->
      <div class="absolute w-10 h-10 rounded-full ${pulseColor} opacity-30 animate-ping pointer-events-none"></div>
      
      <!-- Icon core -->
      <div class="relative flex items-center justify-center w-8 h-8 rounded-full border-2 shadow-md ${bgClass} font-bold font-sans text-xs">
        !
      </div>
    </div>
  `;
};

const RiskLayer = ({ showFlood = false, showLandslide = false, showCombined = false, showHeatmap = false, showHistorical = false }) => {
    const { riskAssessments = [], isLoading } = useRisk();
    const [geoJsonData, setGeoJsonData] = useState(null);

    // Load Kerala Districts GeoJSON
    useEffect(() => {
        fetch("/data/kerala_districts.geojson")
            .then((res) => res.json())
            .then((data) => setGeoJsonData(data))
            .catch((err) => console.error("Error loading geojson in RiskLayer:", err));
    }, []);

    // Determine district styling based on selected options
    const getStyleForFeature = (feature) => {
        const districtName = feature.properties.DISTRICT;
        const assessment = riskAssessments.find(
            (a) => a.district.toLowerCase() === districtName.toLowerCase()
        );

        if (!assessment) {
            return { color: "#cbd5e1", weight: 1, fillOpacity: 0.1, fillColor: "#cbd5e1" };
        }

        // Default parameters
        let color = "#94a3b8";
        let fillOpacity = 0.15;
        let weight = 1.5;

        if (showFlood) {
            // Scale blue color hierarchy
            const score = assessment.rainfall > 0 ? (assessment.riskScore + 10) : assessment.riskScore; // boost active rain
            if (assessment.riskLevel === "Extreme") { color = "#0f172a"; fillOpacity = 0.7; }
            else if (assessment.riskLevel === "High") { color = "#1e3a8a"; fillOpacity = 0.55; }
            else if (assessment.riskLevel === "Moderate") { color = "#3b82f6"; fillOpacity = 0.4; }
            else { color = "#93c5fd"; fillOpacity = 0.2; }
        } else if (showLandslide) {
            // Scale brown/orange hierarchy
            if (assessment.riskLevel === "Extreme") { color = "#78350f"; fillOpacity = 0.7; }
            else if (assessment.riskLevel === "High") { color = "#b45309"; fillOpacity = 0.55; }
            else if (assessment.riskLevel === "Moderate") { color = "#f59e0b"; fillOpacity = 0.4; }
            else { color = "#fef08a"; fillOpacity = 0.15; }
        } else if (showCombined) {
            // Classic red/orange warning levels
            if (assessment.riskLevel === "Extreme") { color = "#dc2626"; fillOpacity = 0.7; weight = 2.5; }
            else if (assessment.riskLevel === "High") { color = "#ea580c"; fillOpacity = 0.55; weight = 2; }
            else if (assessment.riskLevel === "Moderate") { color = "#eab308"; fillOpacity = 0.45; }
            else { color = "#10b981"; fillOpacity = 0.15; }
        }

        return {
            color,
            weight,
            fillColor: color,
            fillOpacity,
        };
    };

    // Popup content formatting
    const onEachFeature = (feature, layer) => {
        const districtName = feature.properties.DISTRICT;
        const assessment = riskAssessments.find(
            (a) => a.district.toLowerCase() === districtName.toLowerCase()
        );

        if (!assessment) {
            layer.bindPopup(`<strong>${districtName}</strong><br/>No risk data loaded.`);
            return;
        }

        const { riskScore, riskLevel, riskType, rainfall, riverLevel, soilMoisture, slopeIndex, historicalEvents, recommendations } = assessment;

        const popupHtml = `
      <div class="w-[280px] p-2 font-sans space-y-3 text-slate-800">
        <div class="flex justify-between items-start border-b border-slate-100 pb-2">
          <div>
            <h3 class="font-extrabold text-sm text-slate-900 leading-tight m-0">${districtName}</h3>
            <span class="text-[10px] text-slate-400 font-bold">Risk Assessment Report</span>
          </div>
          <span class="px-2 py-0.5 rounded text-[9px] font-extrabold shadow-sm ${riskLevel === "Extreme" ? "bg-red-500 text-white animate-pulse" :
                riskLevel === "High" ? "bg-orange-500 text-white" :
                    riskLevel === "Moderate" ? "bg-yellow-400 text-slate-900" :
                        "bg-emerald-500 text-white"
            }">${riskLevel.toUpperCase()}</span>
        </div>

        <div class="grid grid-cols-2 gap-2 text-[11px]">
          <div class="bg-slate-50 p-1.5 rounded border border-slate-100">
            <span class="text-[9px] font-bold text-slate-400 block">Risk score</span>
            <span class="font-extrabold text-slate-900">${riskScore}/100</span>
          </div>
          <div class="bg-slate-50 p-1.5 rounded border border-slate-100">
            <span class="text-[9px] font-bold text-slate-400 block">Threat Type</span>
            <span class="font-extrabold text-slate-900">${riskType}</span>
          </div>
          <div class="bg-slate-50 p-1.5 rounded border border-slate-100">
            <span class="text-[9px] font-bold text-slate-400 block">Rainfall</span>
            <span class="font-extrabold text-blue-600">${rainfall.toFixed(1)} mm</span>
          </div>
          <div class="bg-slate-50 p-1.5 rounded border border-slate-100">
            <span class="text-[9px] font-bold text-slate-400 block">River Level</span>
            <span class="font-extrabold text-blue-600">${riverLevel.toFixed(2)} m</span>
          </div>
          <div class="bg-slate-50 p-1.5 rounded border border-slate-100">
            <span class="text-[9px] font-bold text-slate-400 block">Soil Moisture</span>
            <span class="font-extrabold text-slate-800">${soilMoisture}%</span>
          </div>
          <div class="bg-slate-50 p-1.5 rounded border border-slate-100">
            <span class="text-[9px] font-bold text-slate-400 block">Slope index</span>
            <span class="font-extrabold text-slate-800">${slopeIndex}%</span>
          </div>
        </div>

        <div class="bg-slate-50 p-2 rounded border border-slate-150 text-[10px]">
          <span class="font-bold text-slate-800 block mb-1">Recommended Action:</span>
          <p class="m-0 leading-relaxed font-semibold text-rose-700">${recommendations[0] || "No alert guidelines issued."}</p>
        </div>

        <div class="text-[9px] text-slate-400 text-right">
          Historical Events recorded: <strong>${historicalEvents}</strong>
        </div>
      </div>
    `;

        layer.bindPopup(popupHtml);
    };

    // Render Heatmap overlay circles
    const heatmapCircles = useMemo(() => {
        if (!showHeatmap) return [];
        return riskAssessments.map((a) => {
            // Calculate heat radius based on risk score
            const radius = 10000 + (a.riskScore * 200);
            let color = "#3b82f6"; // Safe blue
            if (a.riskScore > 75) color = "#dc2626"; // Extreme
            else if (a.riskScore > 50) color = "#f97316"; // High
            else if (a.riskScore > 30) color = "#eab308"; // Moderate

            return (
                <Circle
                    key={`heat-${a.district}`}
                    center={[Number(a.latitude), Number(a.longitude)]}
                    radius={radius}
                    pathOptions={{
                        color: "transparent",
                        fillColor: color,
                        fillOpacity: 0.35,
                    }}
                />
            );
        });
    }, [riskAssessments, showHeatmap]);

    // Render High Risk markers (pulsing warnings for Extreme/High)
    const highRiskMarkers = useMemo(() => {
        return riskAssessments
            .filter((a) => a.riskLevel === "Extreme" || a.riskLevel === "High")
            .map((a) => {
                const html = getRiskMarkerHtml(a.district, a.riskLevel, a.riskScore, a.riskType);
                const icon = L.divIcon({
                    html,
                    className: "custom-risk-alert-marker",
                    iconSize: [48, 48],
                    iconAnchor: [24, 24],
                    popupAnchor: [0, -10],
                });

                return (
                    <Marker
                        key={`rt-marker-${a.district}`}
                        position={[Number(a.latitude), Number(a.longitude)]}
                        icon={icon}
                    >
                        <Popup>
                            <div className="text-center font-sans space-y-1.5 p-1">
                                <span className="font-extrabold text-xs text-red-650 flex items-center gap-1 justify-center animate-pulse">
                                    <ShieldAlert className="w-4 h-4" /> EMERGENCY WARNING
                                </span>
                                <p className="text-sm font-bold text-slate-800 m-0">{a.district}</p>
                                <p className="text-xs text-slate-500 m-0">Risk Score: <strong>{a.riskScore}/100</strong></p>
                                <p className="text-[10px] text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded italic mt-1.5">{a.recommendations[0]}</p>
                            </div>
                        </Popup>
                    </Marker>
                );
            });
    }, [riskAssessments]);

    // Historical Disaster Points Markers
    const historicalDisasterPoints = useMemo(() => {
        if (!showHistorical) return [];
        return riskAssessments.map((a) => {
            // Draw small indicators for historical hazard zones
            const count = a.historicalEvents;
            if (count === 0) return null;

            const icon = L.divIcon({
                html: `
          <div class="flex items-center justify-center w-6 h-6 rounded-full bg-slate-850 text-white border border-slate-500 text-[10px] font-bold shadow opacity-80">
            ${count}
          </div>
        `,
                className: "historical-disaster-marker",
                iconSize: [24, 24],
                iconAnchor: [12, 12],
            });

            return (
                <Marker
                    key={`hist-${a.district}`}
                    position={[Number(a.latitude) - 0.05, Number(a.longitude) + 0.05]} // slight offset
                    icon={icon}
                >
                    <Popup>
                        <div className="text-center text-xs p-1">
                            <span className="font-bold block uppercase text-[10px] text-slate-400">Historical Incidents</span>
                            <span className="text-slate-800 font-bold">{count} occurrences</span>
                            <p className="text-[10px] text-slate-500 mt-1">Recorded extreme weather impacts within district borders</p>
                        </div>
                    </Popup>
                </Marker>
            );
        }).filter(Boolean);
    }, [riskAssessments, showHistorical]);

    if (isLoading || !geoJsonData) return null;

    return (
        <>
            <GeoJSON
                key={`${showFlood}-${showLandslide}-${showCombined}-${riskAssessments.length}`}
                data={geoJsonData}
                style={getStyleForFeature}
                onEachFeature={onEachFeature}
            />
            {heatmapCircles}
            {highRiskMarkers}
            {historicalDisasterPoints}
        </>
    );
};

export default memo(RiskLayer);
