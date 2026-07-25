import React, { useState, useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap as useLeafletMap } from "react-leaflet";
import L from "leaflet";
import { toast } from "react-hot-toast";
import { useMap } from "../../context/MapContext";
import useShelters from "../../hooks/useShelters";
import { Search, MapPin, Navigation, Phone, ShieldAlert, X, Compass, Info } from "lucide-react";

// Distance helper (Haversine Formula in km)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
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

// Custom blue pulsing marker icon for user position
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

// Map subcomponent to handle fly-to movements and manual coordinate selection
function MapController({ center, userLoc, manualLoc, shelters, setManualLoc }) {
    const map = useLeafletMap();

    useEffect(() => {
        if (userLoc) {
            map.setView(userLoc, 11);
        } else if (manualLoc) {
            map.setView(manualLoc, 11);
        } else if (center) {
            map.setView(center, 9);
        }
    }, [userLoc, manualLoc, center, map]);

    useMapEvents({
        click(e) {
            if (!userLoc) {
                setManualLoc([e.latlng.lat, e.latlng.lng]);
                toast.success(`Position set manually at: ${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`);
            }
        }
    });

    return null;
}

const ShelterLocatorModal = ({ isOpen, onClose }) => {
    const { shelters = [], loading: sheltersLoading } = useShelters();
    const {
        setUserLocation,
        setNavigationDest,
        setLayers,
    } = useMap();

    // Coordinates
    const [userLoc, setUserLoc] = useState(null);
    const [manualLoc, setManualLoc] = useState(null);
    const [isSearchingGPS, setIsSearchingGPS] = useState(false);

    // Filters State
    const [districtFilter, setDistrictFilter] = useState("");
    const [minBedsFilter, setMinBedsFilter] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");

    // Detailed Modal view for specific shelter
    const [detailedShelter, setDetailedShelter] = useState(null);

    // Detect GPS Location on mount / open
    const detectLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by this browser.");
            return;
        }
        setIsSearchingGPS(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coords = [position.coords.latitude, position.coords.longitude];
                setUserLoc(coords);
                setUserLocation(coords); // Update global MapContext user location
                setManualLoc(null);
                setIsSearchingGPS(false);
                toast.success("Successfully calculated current GPS coordinates.");
            },
            (error) => {
                console.warn("Geolocation permission error:", error);
                toast.error("GPS access denied. Please click on the map to set location or filter manually.");
                setIsSearchingGPS(false);
            },
            { enableHighAccuracy: true, timeout: 8000 }
        );
    };

    useEffect(() => {
        if (isOpen) {
            detectLocation();
        }
    }, [isOpen]);

    const activeReferenceLocation = useMemo(() => {
        return userLoc || manualLoc || null;
    }, [userLoc, manualLoc]);

    // Handle navigate button click
    const handleStartNavigation = (shelter) => {
        if (!activeReferenceLocation) {
            toast.error("Please enable GPS or click on the map to set your location first.");
            return;
        }
        setNavigationDest(shelter);
        // Force turn on shelters and routes layers
        setLayers(prev => ({ ...prev, shelters: true }));
        toast.success(`Routing set to ${shelter.name}. Close locator modal to view evacuation path.`);
        onClose();
    };

    // Filtered and sorted shelters list
    const filteredShelters = useMemo(() => {
        let result = (shelters || []).map((s) => {
            // Calculate capacity metrics safely
            const totalCapacity = Number(s.capacity) || 0;
            const occupied = Number(s.occupancy) || 0;
            const availableBeds = Math.max(0, totalCapacity - occupied);

            let distance = null;
            if (activeReferenceLocation && Number(s.latitude) !== 0 && Number(s.longitude) !== 0) {
                distance = calculateDistance(
                    activeReferenceLocation[0],
                    activeReferenceLocation[1],
                    Number(s.latitude),
                    Number(s.longitude)
                );
            }

            return {
                ...s,
                availableBeds,
                distance,
            };
        });

        // Apply district filter
        if (districtFilter) {
            result = result.filter((s) => s.district === districtFilter);
        }

        // Apply minimum beds filter
        if (minBedsFilter > 0) {
            result = result.filter((s) => s.availableBeds >= minBedsFilter);
        }

        // Apply search query match
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (s) =>
                    s.name.toLowerCase().includes(q) ||
                    (s.district && s.district.toLowerCase().includes(q)) ||
                    (s.address && s.address.toLowerCase().includes(q))
            );
        }

        // Sort by distance (if available) or status
        result.sort((a, b) => {
            if (a.distance !== null && b.distance !== null) {
                return a.distance - b.distance;
            }
            return b.availableBeds - a.availableBeds;
        });

        return result;
    }, [shelters, districtFilter, minBedsFilter, searchQuery, activeReferenceLocation]);

    if (!isOpen) return null;

    const userIcon = createUserIcon();

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-5xl h-[85vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-blue-600" />
                            Emergency Safe Shelter Locator
                        </h2>
                        <p className="text-xs text-slate-500 font-medium">
                            Locate nearby evacuation shelters with active beds, calculate distance, and plan safe routing paths.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 px-2.5 rounded-lg border border-slate-200 hover:bg-slate-105 hover:text-red-500 font-bold transition text-slate-500"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Workspace Body */}
                <div className="flex-1 flex flex-col md:flex-row min-h-0">
                    {/* Left: Map Preview */}
                    <div className="flex-1 relative border-r border-slate-100 min-h-[30vh] md:min-h-0 bg-slate-50">
                        <MapContainer
                            center={[10.8505, 76.2711]}
                            zoom={9}
                            scrollWheelZoom={true}
                            className="h-full w-full"
                        >
                            <TileLayer
                                attribution='&copy; OpenStreetMap'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <MapController
                                center={[10.8505, 76.2711]}
                                userLoc={userLoc}
                                manualLoc={manualLoc}
                                shelters={filteredShelters}
                                setManualLoc={setManualLoc}
                            />

                            {/* Render detected User GPS Pin */}
                            {userLoc && (
                                <Marker position={userLoc} icon={userIcon}>
                                    <Popup>
                                        <span className="font-bold text-xs">Your Live Location</span>
                                    </Popup>
                                </Marker>
                            )}

                            {/* Render manual coordinates selection pin */}
                            {manualLoc && (
                                <Marker position={manualLoc}>
                                    <Popup>
                                        <span className="font-bold text-xs text-blue-600">Selected Checkpoint Location</span>
                                    </Popup>
                                </Marker>
                            )}

                            {/* Render shelter markers */}
                            {filteredShelters.map((s) => {
                                if (Number(s.latitude) === 0 || Number(s.longitude) === 0) return null;
                                return (
                                    <Marker key={s._id} position={[Number(s.latitude), Number(s.longitude)]}>
                                        <Popup>
                                            <div className="p-1.5 text-xs text-slate-800 font-sans">
                                                <strong className="block text-sm text-blue-650 font-bold mb-1">{s.name}</strong>
                                                <span className="block mb-1">Available Beds: <strong>{s.availableBeds}</strong></span>
                                                <span className="block mb-1">Contact: <strong>{s.phone || "N/A"}</strong></span>
                                                <button
                                                    onClick={() => handleStartNavigation(s)}
                                                    className="mt-2 w-full inline-flex items-center justify-center gap-1 rounded bg-blue-600 hover:bg-blue-700 py-1 font-semibold text-white transition text-[10px]"
                                                >
                                                    <Navigation className="w-3 h-3" /> Route evac path
                                                </button>
                                            </div>
                                        </Popup>
                                    </Marker>
                                );
                            })}
                        </MapContainer>

                        {/* GPS override control status widget overlay */}
                        <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
                            <button
                                onClick={detectLocation}
                                disabled={isSearchingGPS}
                                className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 hover:shadow-md transition text-xs font-bold text-slate-750 flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                            >
                                <Compass className={`w-4 h-4 text-blue-650 ${isSearchingGPS ? "animate-spin" : ""}`} />
                                <span>{userLoc ? "Recalibrate GPS" : "Locate Me"}</span>
                            </button>

                            {!userLoc && (
                                <div className="max-w-xs bg-amber-50 border border-amber-200 rounded-xl p-2.5 shadow-sm">
                                    <p className="text-[10px] text-amber-800 leading-normal font-semibold">
                                        🔑 GPS location missing. Click anywhere on the map to set a custom reference location point, or filter by district below.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel: Controls & List */}
                    <div className="w-full md:w-96 flex flex-col min-h-0 bg-white">
                        {/* Filters panel */}
                        <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/50">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search shelter matches..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full text-xs pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-600 font-semibold"
                                />
                                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <select
                                    value={districtFilter}
                                    onChange={(e) => setDistrictFilter(e.target.value)}
                                    className="text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-600 font-semibold text-slate-750"
                                >
                                    <option value="">All Districts</option>
                                    {[
                                        "Thiruvananthapuram", "Kollam", "Pathanamthitta", "Alappuzha", "Kottayam",
                                        "Idukki", "Ernakulam", "Thrissur", "Palakkad", "Malappuram",
                                        "Kozhikode", "Wayanad", "Kannur", "Kasaragod"
                                    ].map(district => (
                                        <option key={district} value={district}>{district}</option>
                                    ))}
                                </select>

                                <select
                                    value={minBedsFilter}
                                    onChange={(e) => setMinBedsFilter(Number(e.target.value))}
                                    className="text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-600 font-semibold text-slate-750"
                                >
                                    <option value={0}>Min Beds: Any</option>
                                    <option value={10}>Min Beds: 10+</option>
                                    <option value={50}>Min Beds: 50+</option>
                                    <option value={100}>Min Beds: 100+</option>
                                </select>
                            </div>
                        </div>

                        {/* Shelters List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                            {sheltersLoading ? (
                                <div className="flex justify-center py-12">
                                    <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                </div>
                            ) : filteredShelters.length === 0 ? (
                                <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl">
                                    <p className="text-xs text-slate-500 font-semibold">No shelters match filters.</p>
                                </div>
                            ) : (
                                filteredShelters.map((s) => (
                                    <div
                                        key={s._id}
                                        className="border border-slate-200 hover:border-slate-350 hover:bg-slate-50/50 rounded-2xl p-3.5 transition flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="flex justify-between items-start gap-1 pb-1">
                                                <h4 className="text-xs font-bold text-slate-900 leading-snug">{s.name}</h4>
                                                <span className={`text-[9px] uppercase px-2 py-0.5 rounded-full font-bold border shrink-0 ${s.status === "Open" ? "bg-green-50 text-green-700 border-green-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}>
                                                    {s.status}
                                                </span>
                                            </div>

                                            <p className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 mt-1">
                                                <MapPin className="w-3 h-3 shrink-0" />
                                                <span>{s.district || "Unknown District"}</span>
                                            </p>

                                            <div className="grid grid-cols-2 mt-2 pt-2 border-t border-slate-100 text-[10px] font-semibold text-slate-650">
                                                <div>
                                                    Avail beds: <strong className="text-blue-650">{s.availableBeds}</strong> / {s.capacity}
                                                </div>
                                                {s.distance !== null && (
                                                    <div className="text-right text-emerald-650">
                                                        Distance: <strong>{s.distance.toFixed(1)} km</strong>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex gap-1.5 mt-3 pt-1">
                                            <button
                                                onClick={() => setDetailedShelter(s)}
                                                className="flex-1 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 rounded-xl text-[10px] font-bold text-slate-700 transition"
                                            >
                                                Details
                                            </button>

                                            <button
                                                onClick={() => handleStartNavigation(s)}
                                                disabled={s.status !== "Open" || s.availableBeds === 0}
                                                className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-750 text-white rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Navigation className="w-3 h-3" />
                                                <span>Route</span>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Shelter Details Modal overlay */}
            {detailedShelter && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
                    <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 relative">
                        <button
                            onClick={() => setDetailedShelter(null)}
                            className="absolute top-4 right-4 p-1 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
                        >
                            <X className="w-4 h-4 text-slate-500" />
                        </button>

                        <h3 className="text-base font-bold text-slate-900 pr-6">{detailedShelter.name}</h3>
                        <span className={`inline-block text-[9px] uppercase px-2 py-0.5 rounded-full font-bold border mt-2 ${detailedShelter.status === "Open" ? "bg-green-50 text-green-700 border-green-200" : "bg-slate-100 text-slate-650"}`}>
                            {detailedShelter.status}
                        </span>

                        <div className="mt-4 space-y-2 text-xs">
                            <div className="grid grid-cols-3 text-slate-500 font-semibold">
                                <span>District:</span>
                                <span className="col-span-2 text-slate-900">{detailedShelter.district || "--"}</span>
                            </div>
                            <div className="grid grid-cols-3 text-slate-500 font-semibold">
                                <span>Address:</span>
                                <span className="col-span-2 text-slate-900 leading-normal">{detailedShelter.address || "--"}</span>
                            </div>
                            <div className="grid grid-cols-3 text-slate-500 font-semibold">
                                <span>Capacity:</span>
                                <span className="col-span-2 text-slate-900">{detailedShelter.capacity} max</span>
                            </div>
                            <div className="grid grid-cols-3 text-slate-500 font-semibold">
                                <span>Occupancy:</span>
                                <span className="col-span-2 text-slate-900">{detailedShelter.occupancy} admitted</span>
                            </div>
                            <div className="grid grid-cols-3 text-slate-500 font-semibold">
                                <span>Available Beds:</span>
                                <span className="col-span-2 text-blue-600 font-bold">{detailedShelter.availableBeds} free</span>
                            </div>
                            <div className="grid grid-cols-3 text-slate-500 font-semibold">
                                <span>Contact Phone:</span>
                                <span className="col-span-2 text-slate-900 flex items-center gap-1">
                                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                                    {detailedShelter.phone || "N/A"}
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setDetailedShelter(null)}
                                className="px-5 py-2 text-xs font-bold bg-slate-905 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShelterLocatorModal;
