import { useState, useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Polyline, GeoJSON } from "react-leaflet";
import L from "leaflet";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
    Search,
    MapPin,
    Navigation,
    Navigation2,
    AlertTriangle,
    Layers,
    Home,
    ShieldAlert,
    Phone,
    Activity,
    Compass,
    Waves
} from "lucide-react";
import {
    getPublicShelters,
    getPublicIncidents,
    getPublicWeather,
    getPublicRiskAssessments
} from "../../services/publicService";

// Helper to check if coordinates are valid
const isValidCoordinate = (lat, lng) => {
    if (lat === undefined || lat === null || lng === undefined || lng === null) return false;
    const l1 = Number(lat);
    const l2 = Number(lng);
    return !isNaN(l1) && !isNaN(l2) && l1 !== 0 && l2 !== 0;
};

// Distance helper (Haversine Formula)
const getDistanceKm = (lat1, lon1, lat2, lon2) => {
    const deg2rad = (deg) => deg * (Math.PI / 180);
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// Custom User Marker Icon
const createUserIcon = () => {
    const html = `
    <div class="relative flex items-center justify-center w-8 h-8">
      <div class="absolute w-8 h-8 rounded-full bg-blue-500 opacity-35 animate-ping pointer-events-none"></div>
      <div class="relative w-5 h-5 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center">
        <div class="w-2.5 h-2.5 rounded-full bg-white"></div>
      </div>
    </div>
  `;
    return L.divIcon({
        html,
        className: "custom-user-marker-container",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
    });
};

// Custom Shelter Marker Icon
const createShelterIcon = (shelter) => {
    const capacity = Number(shelter.capacity) || 1;
    const occupancy = Number(shelter.occupancy) || 0;
    const availabilityRatio = occupancy / capacity;
    let colorClass = "border-emerald-500 text-emerald-600";
    let bgClass = "bg-emerald-500";

    if (shelter.status === "Closed") {
        colorClass = "border-slate-400 text-slate-400";
        bgClass = "bg-slate-400";
    } else if (availabilityRatio >= 1.0) {
        colorClass = "border-rose-500 text-rose-600";
        bgClass = "bg-rose-500";
    } else if (availabilityRatio >= 0.8) {
        colorClass = "border-orange-500 text-orange-600";
        bgClass = "bg-orange-500";
    }

    const html = `
    <div class="relative flex items-center justify-center w-9 h-9">
      <div class="absolute w-9 h-9 rounded-full ${bgClass} opacity-20 animate-pulse pointer-events-none"></div>
      <div class="relative flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 ${colorClass.split(" ")[0]} shadow-md">
        <svg class="w-4 h-4 ${colorClass.split(" ")[1]}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </div>
    </div>
  `;
    return L.divIcon({
        html,
        className: "custom-shelter-marker",
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18],
    });
};

const MapResizer = ({ mapRef }) => {
    useEffect(() => {
        if (mapRef.current) {
            setTimeout(() => {
                mapRef.current.invalidateSize();
            }, 250);
        }
    }, [mapRef]);
    return null;
};

const PublicMap = () => {
    const mapRef = useRef(null);
    const [shelters, setShelters] = useState([]);
    const [incidents, setIncidents] = useState([]);
    const [riskAssessments, setRiskAssessments] = useState([]);
    const [geoJsonData, setGeoJsonData] = useState(null);

    // Map Layers Toggle State
    const [layers, setLayers] = useState({
        shelters: true,
        hazards: true,
        floodRisk: true,
        landslideRisk: true,
        districtBorders: true
    });

    // Map Center/Zoom
    const [mapCenter] = useState([10.8505, 76.2711]);
    const [mapZoom, setMapZoom] = useState(8);

    // Filter and Search States
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDistrict, setSelectedDistrict] = useState("");

    // Navigation and GPS states
    const [userLocation, setUserLocation] = useState(null);
    const [isLocating, setIsLocating] = useState(false);
    const [navigationDest, setNavigationDest] = useState(null);
    const [activeRoute, setActiveRoute] = useState(null);
    const [routeInfo, setRouteInfo] = useState(null);
    const [isFetchingRoute, setIsFetchingRoute] = useState(false);

    // Districts of Kerala list
    const districts = [
        "Thiruvananthapuram", "Kollam", "Pathanamthitta", "Alappuzha", "Kottayam",
        "Idukki", "Ernakulam", "Thrissur", "Palakkad", "Malappuram",
        "Kozhikode", "Wayanad", "Kannur", "Kasaragod"
    ];

    // Load initial data
    useEffect(() => {
        const loadMapData = async () => {
            try {
                const [sheltersList, incidentsList, riskList] = await Promise.all([
                    getPublicShelters(),
                    getPublicIncidents(),
                    getPublicRiskAssessments()
                ]);
                setShelters(sheltersList || []);
                setIncidents(incidentsList || []);
                setRiskAssessments(riskList || []);
            } catch (err) {
                console.error("Error loading map data:", err);
                toast.error("Failed to load map overlays.");
            }
        };

        loadMapData();

        // Load geojson boundary
        fetch("/data/kerala_districts.geojson")
            .then((res) => res.json())
            .then((data) => setGeoJsonData(data))
            .catch((err) => console.error("Error loading GeoJSON boundaries:", err));
    }, []);

    // Filtered shelters
    const filteredShelters = useMemo(() => {
        return shelters.filter(s => {
            const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.address.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesDistrict = selectedDistrict ? s.district.toLowerCase() === selectedDistrict.toLowerCase() : true;
            return matchesSearch && matchesDistrict;
        });
    }, [shelters, searchTerm, selectedDistrict]);

    // Locate User GPS
    const locateUser = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser.");
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const newLoc = [latitude, longitude];
                setUserLocation(newLoc);
                setIsLocating(false);
                toast.success("Successfully calculated current GPS coordinates.");

                // Fly map to user location
                if (mapRef.current) {
                    mapRef.current.flyTo(newLoc, 13);
                }
            },
            (geoError) => {
                console.error(geoError);
                toast.error("GPS location permission denied or timed out.");
                setIsLocating(false);
            },
            { enableHighAccuracy: true, timeout: 8000 }
        );
    };

    // Calculate nearest shelter
    const navigateToNearestShelter = () => {
        if (!userLocation) {
            locateUser();
            return;
        }

        const openShelters = shelters.filter(s => s.status === "Open" && s.availableBeds > 0);
        if (openShelters.length === 0) {
            toast.error("No open shelters with vacancy available.");
            return;
        }

        let nearest = null;
        let minD = Infinity;

        openShelters.forEach(s => {
            if (isValidCoordinate(s.latitude, s.longitude)) {
                const dist = getDistanceKm(userLocation[0], userLocation[1], s.latitude, s.longitude);
                if (dist < minD) {
                    minD = dist;
                    nearest = s;
                }
            }
        });

        if (nearest) {
            handleNavigate(nearest);
            toast.success(`Nearest open shelter: ${nearest.name} (${minD.toFixed(1)} km)`);
        }
    };

    // Trigger Route Navigation
    const handleNavigate = (shelter) => {
        setNavigationDest(shelter);

        // Fly map to show destination
        if (mapRef.current && isValidCoordinate(shelter.latitude, shelter.longitude)) {
            mapRef.current.setView([shelter.latitude, shelter.longitude], 12);
        }
    };

    // Clear Route Navigation
    const clearNavigation = () => {
        setNavigationDest(null);
        setActiveRoute(null);
        setRouteInfo(null);
    };

    // Fetch Route directions using OSRM
    useEffect(() => {
        if (!userLocation || !navigationDest) return;

        const [uLat, uLng] = userLocation;
        const [dLat, dLng] = [navigationDest.latitude, navigationDest.longitude];

        if (!isValidCoordinate(uLat, uLng) || !isValidCoordinate(dLat, dLng)) return;

        const fetchOSRMRoute = async () => {
            setIsFetchingRoute(true);
            try {
                const url = `https://router.project-osrm.org/route/v1/driving/${uLng},${uLat};${dLng},${dLat}?overview=full&geometries=geojson&steps=true`;
                const res = await axios.get(url);

                if (res.data?.code !== "Ok" || !res.data?.routes || res.data?.routes.length === 0) {
                    toast.error("Routing server failed to compute evacuation path.");
                    return;
                }

                const r = res.data.routes[0];
                const coords = r.geometry.coordinates.map(c => [c[1], c[0]]);

                // Screen critical incidents along the coordinate vector to detect flood warning / roadblock overlaps
                const hazardPronePoints = incidents.filter(i =>
                    (i.severity === "High" || i.severity === "Critical") &&
                    ["Road Block", "Flood", "Landslide"].includes(i.category)
                );

                let warningCount = 0;
                coords.forEach(([lat, lng]) => {
                    hazardPronePoints.forEach(inc => {
                        const dist = getDistanceKm(lat, lng, inc.location.latitude, inc.location.longitude);
                        if (dist < 0.6) { // 600 meters proximity
                            warningCount++;
                            alertTriggered = true;
                        }
                    });
                });

                setActiveRoute(coords);
                setRouteInfo({
                    distance: r.distance / 1000,
                    duration: r.duration / 60,
                    isSafe: warningCount === 0,
                    warningCount,
                    instructions: (r.legs[0]?.steps || []).map(s => ({
                        text: s.maneuver?.instruction || `Driving onto ${s.name || 'unnamed street'}`,
                        distance: s.distance
                    }))
                });

                if (warningCount > 0) {
                    toast.warn("CAUTION: calculated route passes near reported blockades or active flash hazards!");
                }
            } catch (err) {
                console.error("OSRM failed:", err);
                toast.error("Evacuation routing service timed out.");
            } finally {
                setIsFetchingRoute(false);
            }
        };

        fetchOSRMRoute();
    }, [userLocation, navigationDest, incidents]);

    // Fit map bounds to show route
    useEffect(() => {
        if (mapRef.current && activeRoute && activeRoute.length > 0) {
            try {
                mapRef.current.fitBounds(activeRoute, { padding: [40, 40] });
            } catch (e) {
                console.warn(e);
            }
        }
    }, [activeRoute]);

    // Risk Border Stylings
    const getRiskStyle = (feature) => {
        const districtName = feature.properties.DISTRICT;
        const assessment = riskAssessments.find(
            (a) => a.district.toLowerCase() === districtName.toLowerCase()
        );

        if (!assessment) {
            return { color: "#475569", weight: 1, fillOpacity: 0.1, fillColor: "#475569" };
        }

        let color = "#475569";
        let fillOpacity = 0.15;
        let weight = 1;

        if (layers.floodRisk && assessment.riskType !== "Landslide") {
            if (assessment.riskLevel === "Extreme") { color = "#0284c7"; fillOpacity = 0.55; weight = 2; }
            else if (assessment.riskLevel === "High") { color = "#0369a1"; fillOpacity = 0.45; }
            else if (assessment.riskLevel === "Moderate") { color = "#38bdf8"; fillOpacity = 0.3; }
        } else if (layers.landslideRisk && assessment.riskType !== "Flood") {
            if (assessment.riskLevel === "Extreme") { color = "#b45309"; fillOpacity = 0.55; weight = 2; }
            else if (assessment.riskLevel === "High") { color = "#d97706"; fillOpacity = 0.45; }
            else if (assessment.riskLevel === "Moderate") { color = "#fbbf24"; fillOpacity = 0.3; }
        }

        return {
            color,
            weight,
            fillColor: color,
            fillOpacity,
        };
    };

    const onEachDistrictFeature = (feature, layer) => {
        const districtName = feature.properties.DISTRICT;
        const assessment = riskAssessments.find(a => a.district.toLowerCase() === districtName.toLowerCase());

        let label = `<strong>${districtName}</strong>`;
        if (assessment) {
            label += `<br />Risk level: <strong>${assessment.riskLevel}</strong> (${assessment.riskScore}/100)<br />Rainfall: ${assessment.rainfall}mm`;
        }

        layer.bindPopup(label);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-170px)] min-h-[500px]">

            {/* Left Panel: Search & Controls */}
            <div className="lg:col-span-4 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-4 space-y-4">

                {/* Search Header */}
                <div className="space-y-2">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Compass className="text-cyan-400 w-5 h-5" /> Shelter & Hazard Directory
                    </h2>
                    <p className="text-xs text-slate-400">Search local capacities, active blockades, and plot high-safety evacuation lines.</p>
                </div>

                {/* Filter Widgets */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search shelters..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-slate-950/80 border border-slate-800 focus:border-cyan-500 w-full pl-9 pr-3 py-2 rounded-xl text-xs outline-none text-white transition"
                        />
                    </div>

                    <select
                        value={selectedDistrict}
                        onChange={(e) => setSelectedDistrict(e.target.value)}
                        className="bg-slate-950 border border-slate-800 focus:border-cyan-500 px-3 py-2 rounded-xl text-xs outline-none text-white transition max-w-[120px]"
                    >
                        <option value="">All Districts</option>
                        {districts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>

                {/* Layer Control Bar */}
                <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 space-y-2.5">
                    <span className="text-[10px] font-bold tracking-wider text-slate-400 block uppercase">Layer Display Options</span>

                    <div className="flex flex-wrap gap-2 text-[10px] font-medium text-slate-350">
                        <label className="flex items-center gap-1.5 cursor-pointer bg-slate-950/80 px-2 py-1.5 border border-slate-800 hover:border-slate-700 rounded-lg">
                            <input
                                type="checkbox"
                                checked={layers.shelters}
                                onChange={() => setLayers(prev => ({ ...prev, shelters: !prev.shelters }))}
                                className="accent-cyan-500"
                            />
                            <span>Open Shelters</span>
                        </label>

                        <label className="flex items-center gap-1.5 cursor-pointer bg-slate-950/80 px-2 py-1.5 border border-slate-800 hover:border-slate-700 rounded-lg">
                            <input
                                type="checkbox"
                                checked={layers.hazards}
                                onChange={() => setLayers(prev => ({ ...prev, hazards: !prev.hazards }))}
                                className="accent-cyan-500"
                            />
                            <span>Active Hazards & Blocks</span>
                        </label>

                        <label className="flex items-center gap-1.5 cursor-pointer bg-slate-950/80 px-2 py-1.5 border border-slate-800 hover:border-slate-700 rounded-lg">
                            <input
                                type="checkbox"
                                checked={layers.floodRisk}
                                onChange={() => setLayers(prev => ({ ...prev, floodRisk: !prev.floodRisk }))}
                                className="accent-cyan-500"
                            />
                            <span>Fluvial Flood Risk</span>
                        </label>

                        <label className="flex items-center gap-1.5 cursor-pointer bg-slate-950/80 px-2 py-1.5 border border-slate-800 hover:border-slate-700 rounded-lg">
                            <input
                                type="checkbox"
                                checked={layers.landslideRisk}
                                onChange={() => setLayers(prev => ({ ...prev, landslideRisk: !prev.landslideRisk }))}
                                className="accent-cyan-500"
                            />
                            <span>Landslide Hazard Index</span>
                        </label>
                    </div>
                </div>

                {/* GPS and Evacuation Actions */}
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                    <button
                        onClick={locateUser}
                        disabled={isLocating}
                        className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition ${isLocating
                            ? "bg-slate-950/40 text-slate-500 border border-slate-800 animate-pulse"
                            : "bg-slate-950 border border-slate-800 text-slate-200 hover:bg-slate-850"
                            }`}
                    >
                        <Navigation size={14} className={isLocating ? "animate-spin" : ""} />
                        {isLocating ? "Finding GPS..." : "Calibrate GPS"}
                    </button>

                    <button
                        onClick={navigateToNearestShelter}
                        className="flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl shadow-lg shadow-red-650/10 hover:brightness-110 active:scale-98 transition"
                    >
                        <ShieldAlert size={14} />
                        Find Nearest
                    </button>
                </div>

                {/* Active Routing Directions */}
                {navigationDest && (
                    <div className="bg-slate-950 border border-slate-800/80 p-3 rounded-xl space-y-3 max-h-[220px] overflow-y-auto animate-fade-in shrink-0">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <div>
                                <span className="text-[10px] font-bold text-red-400 block uppercase">Evacuation Router Active</span>
                                <h4 className="text-xs font-bold text-white truncate max-w-[180px]">{navigationDest.name}</h4>
                            </div>
                            <button
                                onClick={clearNavigation}
                                className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 border border-slate-800 rounded bg-slate-900"
                            >
                                Clear
                            </button>
                        </div>

                        {isFetchingRoute ? (
                            <div className="flex items-center gap-2 py-2 text-xs text-slate-400 animate-pulse">
                                <Activity className="animate-spin text-red-500 w-4 h-4" />
                                <span>Tracing safe roadways...</span>
                            </div>
                        ) : routeInfo ? (
                            <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-350 bg-slate-900/50 p-2 rounded">
                                    <div>Distance: <strong className="text-white">{routeInfo.distance.toFixed(1)} km</strong></div>
                                    <div>Est. Time: <strong className="text-white">{Math.round(routeInfo.duration)} mins</strong></div>
                                    <div className="col-span-2 flex items-center gap-1">
                                        Status:
                                        <span className={`font-bold ${routeInfo.isSafe ? "text-emerald-500" : "text-rose-500"}`}>
                                            {routeInfo.isSafe ? "🟢 Clear Evac Road" : "🚨 Road Block Borders"}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <span className="text-[10px] font-semibold text-slate-450 uppercase block">Drive Logs:</span>
                                    <ol className="text-[10px] text-slate-400 space-y-1 list-decimal list-inside pl-1.5 leading-tight">
                                        {routeInfo.instructions.slice(0, 3).map((step, sIdx) => (
                                            <li key={sIdx} className="truncate">{step.text} ({Math.round(step.distance)}m)</li>
                                        ))}
                                        {routeInfo.instructions.length > 3 && (
                                            <li className="list-none text-slate-500 italic mt-0.5">And {routeInfo.instructions.length - 3} further turns...</li>
                                        )}
                                    </ol>
                                </div>
                            </div>
                        ) : (
                            <span className="text-[11px] text-slate-500 block">No route mapped. Wait for user GPS connection.</span>
                        )}
                    </div>
                )}

                {/* Shelters list directory */}
                <div className="flex-1 overflow-y-auto space-y-2 max-h-[300px] pr-1.5 scrollbar-thin">
                    <span className="text-[10px] font-bold tracking-wider text-slate-450 block uppercase sticky top-0 bg-slate-900 pb-1">
                        Shelters Found ({filteredShelters.length})
                    </span>

                    {filteredShelters.length === 0 ? (
                        <div className="text-center py-6 text-xs text-slate-500">
                            No open shelters match filters.
                        </div>
                    ) : (
                        filteredShelters.map(s => {
                            const bedCount = s.availableBeds || (s.capacity - s.occupancy);
                            return (
                                <div
                                    key={s._id}
                                    className="p-3 bg-slate-950/60 hover:bg-slate-900 border border-slate-800/80 rounded-xl transition cursor-pointer text-xs space-y-2 group"
                                    onClick={() => handleNavigate(s)}
                                >
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-white group-hover:text-cyan-400 transition truncate max-w-[190px]">{s.name}</h4>
                                        <span className={`px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold ${s.status === "Open" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                            }`}>
                                            {s.status}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-400 border-b border-slate-850 pb-2">
                                        <p>District: <strong className="text-slate-200">{s.district}</strong></p>
                                        <p>Available Beds: <strong className={bedCount > 10 ? "text-emerald-400" : "text-amber-500 font-extrabold"}>{bedCount}</strong></p>
                                    </div>

                                    <div className="flex items-center justify-between text-[10px] pt-1">
                                        <span className="text-slate-500 truncate max-w-[130px]">📞 {s.phone}</span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleNavigate(s);
                                            }}
                                            className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-bold"
                                        >
                                            <Navigation2 size={10} /> Route
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Right Panel: Interactive Sheet Leaflet Map */}
            <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
                <MapContainer
                    center={mapCenter}
                    zoom={mapZoom}
                    scrollWheelZoom={true}
                    className="h-full w-full"
                    whenReady={(mapInstance) => {
                        mapRef.current = mapInstance.target;
                    }}
                >
                    <MapResizer mapRef={mapRef} />

                    <TileLayer
                        attribution='&copy; OpenStreetMap contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* District Borders Boundaries Layer */}
                    {layers.districtBorders && geoJsonData && (
                        <GeoJSON
                            key={riskAssessments.length}
                            data={geoJsonData}
                            style={getRiskStyle}
                            onEachFeature={onEachDistrictFeature}
                        />
                    )}

                    {/* Shelters Pins Overlay */}
                    {layers.shelters && shelters.map(s => {
                        if (!isValidCoordinate(s.latitude, s.longitude)) return null;
                        const icon = createShelterIcon(s);
                        return (
                            <Marker
                                key={`m-shelter-${s._id}`}
                                position={[s.latitude, s.longitude]}
                                icon={icon}
                            >
                                <Popup>
                                    <div className="p-1 space-y-2 min-w-[200px] text-slate-850 font-sans text-xs">
                                        <h4 className="font-bold text-slate-900 border-b pb-1 text-sm">{s.name}</h4>
                                        <p><strong>District:</strong> {s.district}</p>
                                        <p><strong>Address:</strong> {s.address}</p>
                                        <p><strong>Bed Availability:</strong> {s.availableBeds} beds left</p>
                                        <p><strong>Food/Water:</strong> {s.foodAvailable ? "🟢 Available" : "🔴 Unavailable"} / {s.waterAvailable ? "🟢 Clear" : "🔴 No"}</p>
                                        <p><strong>Contact Person:</strong> {s.contactPerson} {s.phone}</p>
                                        <button
                                            onClick={() => handleNavigate(s)}
                                            className="w-full mt-2 bg-gradient-to-r from-blue-600 to-cyan-600 font-bold hover:brightness-110 text-white rounded py-2 transition"
                                        >
                                            Evacuation Directions
                                        </button>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}

                    {/* Active Hazards / Road Blocks Overlay */}
                    {layers.hazards && incidents.map(inc => {
                        if (!isValidCoordinate(inc.location.latitude, inc.location.longitude)) return null;
                        const isRB = inc.category === "Road Block";
                        const rad = isRB ? 10 : 8;
                        const color = isRB ? "#f97316" : inc.severity === "Critical" ? "#ef4444" : "#eab308";

                        return (
                            <CircleMarker
                                key={`m-hazard-${inc._id}`}
                                center={[inc.location.latitude, inc.location.longitude]}
                                radius={rad}
                                pathOptions={{
                                    color: color,
                                    fillColor: color,
                                    fillOpacity: 0.85
                                }}
                            >
                                <Popup>
                                    <div className="font-sans text-xs p-1 text-slate-850 space-y-2 min-w-[180px]">
                                        <h4 className="font-bold text-orange-700 flex items-center gap-1">
                                            <AlertTriangle size={14} /> {inc.category} Alert
                                        </h4>
                                        <p className="font-semibold text-slate-950">{inc.title}</p>
                                        <p className="text-slate-650">{inc.description}</p>
                                        <hr />
                                        <p><strong>Severity:</strong> {inc.severity}</p>
                                        <p><strong>District:</strong> {inc.location.district}</p>
                                    </div>
                                </Popup>
                            </CircleMarker>
                        );
                    })}

                    {/* User GPS Pin Marker */}
                    {userLocation && (
                        <Marker position={userLocation} icon={createUserIcon()}>
                            <Popup>
                                <span className="font-sans text-xs text-slate-800">Your Current Position</span>
                            </Popup>
                        </Marker>
                    )}

                    {/* Evacuation Route Line Path Overlay */}
                    {activeRoute && activeRoute.length > 0 && (
                        <Polyline
                            positions={activeRoute}
                            pathOptions={{
                                color: routeInfo?.isSafe ? "#3b82f6" : "#ef4444",
                                weight: 6,
                                opacity: 0.85,
                                lineJoin: "round",
                                lineCap: "round"
                            }}
                        />
                    )}
                </MapContainer>
            </div>
        </div>
    );
};

export default PublicMap;
