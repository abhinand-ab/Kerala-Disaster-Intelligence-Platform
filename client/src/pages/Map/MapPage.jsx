import React, { useState, useRef } from "react";
import MainLayout from "../../components/layout/MainLayout";
import MapView from "../../components/map/MapView";
import LayerSwitcher from "../../components/map/LayerSwitcher";
import { useMap } from "../../context/MapContext";
import useShelters from "../../hooks/useShelters";
import useIncidents from "../../features/incidents/hooks/useIncidents";
import { Search, MapPin, Minimize, Maximize, Compass, Map as MapIcon, Layers, Info } from "lucide-react";
import { toast } from "react-hot-toast";

const districtsOfKerala = [
    { name: "Thiruvananthapuram", coords: [8.5241, 76.9366] },
    { name: "Kollam", coords: [8.8932, 76.6141] },
    { name: "Pathanamthitta", coords: [9.2667, 76.7833] },
    { name: "Alappuzha", coords: [9.4981, 76.3388] },
    { name: "Kottayam", coords: [9.5916, 76.5222] },
    { name: "Idukki", coords: [9.9180, 77.1025] },
    { name: "Ernakulam", coords: [9.9816, 76.2999] },
    { name: "Thrissur", coords: [10.5276, 76.2144] },
    { name: "Palakkad", coords: [10.7867, 76.6547] },
    { name: "Malappuram", coords: [11.0720, 76.0740] },
    { name: "Kozhikode", coords: [11.2588, 75.7804] },
    { name: "Wayanad", coords: [11.6854, 76.0825] },
    { name: "Kannur", coords: [11.8745, 75.3704] },
    { name: "Kasaragod", coords: [12.4996, 74.9869] }
];

const MapPage = () => {
    const { locateUser, isLocating, setMapFlyToTarget } = useMap();
    const { shelters } = useShelters();
    const { incidents } = useIncidents();
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const mapContainerRef = useRef(null);

    const handleSearchChange = (e) => {
        const q = e.target.value;
        setSearchQuery(q);
        if (!q.trim()) {
            setSearchResults([]);
            return;
        }
        const term = q.toLowerCase();

        // Search districts
        const matchingDistricts = districtsOfKerala.filter(d =>
            d.name.toLowerCase().includes(term)
        ).map(d => ({
            type: "District",
            name: `${d.name} District`,
            coords: d.coords
        }));

        // Search shelters
        const matchingShelters = (shelters || []).filter(s =>
            s.name.toLowerCase().includes(term) || (s.district && s.district.toLowerCase().includes(term))
        ).map(s => ({
            type: "Shelter",
            name: `${s.name} (${s.district || "Shelter"})`,
            coords: [Number(s.latitude), Number(s.longitude)]
        }));

        // Search incidents
        const matchingIncidents = (incidents || []).filter(i =>
            i.title.toLowerCase().includes(term) || i.category.toLowerCase().includes(term)
        ).map(i => ({
            type: "Incident",
            name: `${i.title} (${i.severity} severity)`,
            coords: [i.location.latitude, i.location.longitude]
        }));

        setSearchResults([...matchingDistricts, ...matchingShelters, ...matchingIncidents].slice(0, 8));
    };

    const handleSelectResult = (result) => {
        if (result.coords && result.coords[0] !== 0) {
            setMapFlyToTarget(result.coords);
            toast.success(`Zooming to ${result.type}: ${result.name}`);
        } else {
            toast.error("Location coordinates not available.");
        }
        setSearchQuery("");
        setSearchResults([]);
    };

    const handleZoomToKerala = () => {
        setMapFlyToTarget([10.8505, 76.2711]);
        toast.success("Zoomed map bounds to Kerala operational region.");
    };

    const toggleFullscreen = () => {
        if (!mapContainerRef.current) return;

        if (!document.fullscreenElement) {
            mapContainerRef.current.requestFullscreen().then(() => {
                setIsFullscreen(true);
            }).catch(err => {
                toast.error("Error attempting to enable fullscreen mode.");
            });
        } else {
            document.exitFullscreen().then(() => {
                setIsFullscreen(false);
            });
        }
    };

    return (
        <MainLayout>
            <div className="flex flex-col h-[calc(100vh-120px)] space-y-4">
                {/* Header toolbar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                            <MapIcon className="w-5 h-5 text-blue-600" />
                            GIS Operations Map
                        </h1>
                        <p className="text-xs text-slate-500 font-medium">
                            Real-time geospatial intelligence, hazard overlay monitoring, and emergency coordinate visualization.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto relative">
                        {/* Search Input bar */}
                        <div className="relative w-full sm:w-80">
                            <input
                                type="text"
                                placeholder="Search districts, shelters, incidents..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                className="w-full text-sm pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all font-medium text-slate-800"
                            />
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />

                            {/* Autocomplete dropdown */}
                            {searchResults.length > 0 && (
                                <div className="absolute right-0 left-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-[2000] overflow-hidden max-h-60 overflow-y-auto">
                                    {searchResults.map((r, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleSelectResult(r)}
                                            className="w-full text-left px-4 py-2.5 text-xs hover:bg-slate-55 flex items-center justify-between border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                                        >
                                            <span className="font-semibold text-slate-800 truncate pr-2">{r.name}</span>
                                            <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md shrink-0">
                                                {r.type}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Quick Actions Control Buttons */}
                        <button
                            onClick={() => locateUser()}
                            disabled={isLocating}
                            title="GPS Locate Me"
                            className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 transition"
                        >
                            <Compass className={`w-5 h-5 ${isLocating ? "animate-spin text-blue-600" : ""}`} />
                        </button>

                        <button
                            onClick={handleZoomToKerala}
                            title="Zoom to Kerala"
                            className="px-3 py-2 text-xs font-semibold border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 transition flex items-center gap-1.5"
                        >
                            <MapPin className="w-4 h-4 text-rose-500" />
                            <span>Kerala</span>
                        </button>

                        <button
                            onClick={toggleFullscreen}
                            title="Toggle Fullscreen"
                            className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 transition"
                        >
                            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Map Panel & Sidebar */}
                <div ref={mapContainerRef} className="flex-1 flex gap-4 min-h-0 bg-slate-50 relative">
                    <div className="flex-1 min-w-0 h-full border border-slate-200 rounded-2xl overflow-hidden shadow-xs relative bg-white">
                        <MapView />
                    </div>

                    {/* Right Floating / Fixed Control Board */}
                    <div className="w-72 hidden lg:flex flex-col gap-4 overflow-y-auto max-h-full shrink-0">
                        {/* Layer visibility list panel */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs select-none">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                                <Layers className="w-4 h-4 text-blue-600" />
                                Active Map Layers
                            </h3>
                            <div className="overflow-y-auto max-h-56 pr-1">
                                <LayerSwitcher />
                            </div>
                        </div>

                        {/* Static Beautiful Legend Panel */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                                <Info className="w-4 h-4 text-blue-600" />
                                Map Icon Legend
                            </h3>
                            <div className="space-y-3 text-xs">
                                <div className="flex items-center gap-2.5">
                                    <span className="w-3 h-3 rounded-full bg-rose-500 ring-2 ring-rose-250 animate-pulse border border-white" />
                                    <span className="font-semibold text-slate-700">Critical / High Incident</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <span className="w-3 h-3 rounded-full bg-orange-400 border border-white" />
                                    <span className="font-semibold text-slate-700">Medium Severity Incident</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <span className="w-3 h-3 rounded-full bg-blue-500 border border-white" />
                                    <span className="font-semibold text-slate-700">Low / SOS Emergency Request</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <span className="w-5 h-5 bg-white border border-emerald-500 rounded-full flex items-center justify-center font-bold text-emerald-600 text-[10px]">
                                        H
                                    </span>
                                    <span className="font-semibold text-slate-700">Active Shelter (Open)</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <span className="w-5 h-5 bg-white border border-slate-400 rounded-full flex items-center justify-center font-bold text-slate-500 text-[10px]">
                                        H
                                    </span>
                                    <span className="font-semibold text-slate-700">Active Shelter (Closed)</span>
                                </div>
                                <div className="flex items-center gap-2.5 text-slate-600">
                                    <div className="w-5 h-5 flex items-center justify-center bg-indigo-50 border border-indigo-200 rounded-md text-[10px] font-bold">
                                        🚚
                                    </div>
                                    <span className="font-semibold text-slate-700">Delivery Vehicles</span>
                                </div>
                                <div className="flex items-center gap-2.5 text-slate-600">
                                    <div className="w-5 h-5 flex items-center justify-center bg-orange-50 border border-orange-200 rounded-md text-[10px] font-bold">
                                        🏢
                                    </div>
                                    <span className="font-semibold text-slate-700">Warehouses</span>
                                </div>
                                <div className="flex items-center gap-2.5 text-slate-600">
                                    <div className="w-5 h-5 flex items-center justify-center bg-indigo-50 border border-indigo-200 rounded-full text-[10px] font-bold text-indigo-600">
                                        🟢
                                    </div>
                                    <span className="font-semibold text-slate-700">IoT Smart Sensors</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default MapPage;
