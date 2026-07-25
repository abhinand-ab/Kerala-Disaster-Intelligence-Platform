import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Building2, Search, MapPin, Compass, Navigation, Phone, CheckCircle, Waves, Info } from "lucide-react";
import { getPublicShelters } from "../../services/publicService";
import { toast } from "react-hot-toast";

const PublicShelters = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [shelters, setShelters] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
    const [selectedDistrict, setSelectedDistrict] = useState("");
    const [foodFilter, setFoodFilter] = useState(false);
    const [waterFilter, setWaterFilter] = useState(false);

    // Geolocation coordinates
    const [userCoords, setUserCoords] = useState(null);
    const [isLocating, setIsLocating] = useState(false);

    const districts = [
        "Thiruvananthapuram", "Kollam", "Pathanamthitta", "Alappuzha", "Kottayam",
        "Idukki", "Ernakulam", "Thrissur", "Palakkad", "Malappuram",
        "Kozhikode", "Wayanad", "Kannur", "Kasaragod"
    ];

    // Distance helper (Haversine Formula)
    const getDistance = (lat1, lon1, lat2, lon2) => {
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

    useEffect(() => {
        const fetchShelters = async () => {
            try {
                const data = await getPublicShelters();
                setShelters(data || []);
            } catch (err) {
                console.error(err);
                toast.error("Failed to load shelters database.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchShelters();
    }, []);

    // Get current GPS coordinates
    const getCoords = () => {
        if (!navigator.geolocation) {
            toast.error("Browser does not support GPS location.");
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setUserCoords([pos.coords.latitude, pos.coords.longitude]);
                setIsLocating(false);
                toast.success("GPS calibrated. Shelters are now ordered by proximity.");
            },
            (err) => {
                console.error(err);
                toast.error("Could not obtain GPS permission.");
                setIsLocating(false);
            },
            { enableHighAccuracy: true, timeout: 8000 }
        );
    };

    // Filtered and sorted shelters list
    const processedShelters = useMemo(() => {
        let result = shelters.filter(s => {
            const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.address.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesDistrict = selectedDistrict ? s.district.toLowerCase() === selectedDistrict.toLowerCase() : true;
            const matchesFood = foodFilter ? s.foodAvailable === true : true;
            const matchesWater = waterFilter ? s.waterAvailable === true : true;

            return matchesSearch && matchesDistrict && matchesFood && matchesWater;
        });

        // If GPS coordinate has been retrieved, sort list by distance
        if (userCoords) {
            result = result.map(s => {
                const dist = getDistance(userCoords[0], userCoords[1], s.latitude, s.longitude);
                return { ...s, distance: dist };
            });
            result.sort((a, b) => a.distance - b.distance);
        }

        return result;
    }, [shelters, searchTerm, selectedDistrict, foodFilter, waterFilter, userCoords]);

    return (
        <div className="space-y-6 pb-12">

            {/* Page Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-2">
                        <Building2 className="text-cyan-400 w-6 h-6" /> Safe Evacuation Camps Directory
                    </h1>
                    <p className="text-xs text-slate-400">Search government approved relief camps, check real-time bed counts, and configure OSRM pathing.</p>
                </div>

                <button
                    onClick={getCoords}
                    disabled={isLocating}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold border transition ${isLocating
                            ? "bg-slate-950 text-slate-500 border-slate-800 animate-pulse"
                            : "bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-200"
                        }`}
                >
                    <Navigation size={14} className={isLocating ? "animate-spin" : ""} />
                    {isLocating ? "Calibrating GPS..." : userCoords ? "GPS Active (Calibrated)" : "Sort by Proximity"}
                </button>
            </div>

            {/* Filter Panel */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Type camp name, city, address details..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-slate-950 border border-slate-800 focus:border-cyan-500 w-full pl-10 pr-3 py-2.5 rounded-xl text-xs outline-none text-white transition"
                        />
                    </div>

                    <div className="flex gap-2">
                        <select
                            value={selectedDistrict}
                            onChange={(e) => setSelectedDistrict(e.target.value)}
                            className="bg-slate-950 border border-slate-800 focus:border-cyan-500 px-4 py-2.5 rounded-xl text-xs outline-none text-white transition"
                        >
                            <option value="">Choose District</option>
                            {districts.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                </div>

                {/* Facilities Toggles */}
                <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 border-t border-slate-850 pt-3">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Relief Amenities:</span>

                    <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
                        <input
                            type="checkbox"
                            checked={foodFilter}
                            onChange={() => setFoodFilter(!foodFilter)}
                            className="accent-cyan-500"
                        />
                        <span>Food Supp. Included</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
                        <input
                            type="checkbox"
                            checked={waterFilter}
                            onChange={() => setWaterFilter(!waterFilter)}
                            className="accent-cyan-500"
                        />
                        <span>Potable Water Available</span>
                    </label>
                </div>
            </div>

            {/* Results Grid */}
            {isLoading ? (
                <div className="py-20 text-center text-xs text-slate-500 animate-pulse">
                    Parsing shelter telemetry indices...
                </div>
            ) : processedShelters.length === 0 ? (
                <div className="py-20 text-center text-xs text-slate-500 border border-slate-850 bg-slate-950/20 rounded-2xl space-y-2">
                    <Info className="mx-auto text-slate-650 w-8 h-8" />
                    <span className="font-bold text-white text-sm block">No Evacuation Camps Found</span>
                    <p className="max-w-xs mx-auto text-slate-450">Adjust your searches or view the interactive state map for active warnings.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {processedShelters.map((s) => {
                        const isFull = s.occupancy >= s.capacity;
                        const beds = s.availableBeds || (s.capacity - s.occupancy);

                        return (
                            <div
                                key={s._id}
                                className={`bg-slate-900 border border-slate-800 rounded-3xl p-5 hover:border-slate-700 transition flex flex-col justify-between gap-5 relative overflow-hidden ${isFull ? "opacity-75" : ""
                                    }`}
                            >
                                {/* Header */}
                                <div className="space-y-1.5">
                                    <div className="flex items-start justify-between gap-2">
                                        <span className="text-[10px] font-bold text-slate-400 bg-slate-950 border border-slate-850 px-2.5 py-0.5 rounded-lg">
                                            {s.district}
                                        </span>

                                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border ${s.status === "Open"
                                                ? "bg-emerald-500/10 text-emerald-450 border-emerald-500/20"
                                                : "bg-red-500/10 text-red-400 border-red-500/20"
                                            }`}>
                                            {s.status}
                                        </span>
                                    </div>

                                    <h3 className="font-bold text-base text-white truncate">{s.name}</h3>
                                    <p className="text-xs text-slate-400 leading-tight flex items-start gap-1 py-1">
                                        <MapPin size={14} className="text-cyan-400 shrink-0 mt-0.5" />
                                        <span className="truncate">{s.address}</span>
                                    </p>
                                </div>

                                {/* capacity block */}
                                <div className="grid grid-cols-2 gap-2 bg-slate-950/80 p-3 rounded-2xl border border-slate-850 text-center font-sans text-xs">
                                    <div>
                                        <span className="text-[9px] text-slate-500 font-bold block uppercase scale-90">Beds Remaining</span>
                                        <span className={`font-black text-sm ${isFull ? "text-red-400" : "text-white"}`}>{beds}</span>
                                    </div>
                                    <div>
                                        <span className="text-[9px] text-slate-500 font-bold block uppercase scale-90">Occupancy</span>
                                        <span className="font-black text-white">{s.occupancy}/{s.capacity}</span>
                                    </div>
                                </div>

                                {/* Amenities list */}
                                <div className="text-[11px] text-slate-400 space-y-1 sm:space-y-1.5 border-t border-slate-855 pt-3">
                                    <div className="flex items-center justify-between">
                                        <span>Potable Drinking Water:</span>
                                        <span className={`font-semibold ${s.waterAvailable ? "text-emerald-450" : "text-slate-500"}`}>
                                            {s.waterAvailable ? "Yes" : "No"}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Catering & Supplies:</span>
                                        <span className={`font-semibold ${s.foodAvailable ? "text-emerald-450" : "text-slate-500"}`}>
                                            {s.foodAvailable ? "Available" : "Unavailable"}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Medical Emergency Support:</span>
                                        <span className={`font-semibold ${s.medicalSupport ? "text-emerald-450" : "text-slate-500"}`}>
                                            {s.medicalSupport ? "On Duty" : "None"}
                                        </span>
                                    </div>
                                </div>

                                {/* Contacts & directions */}
                                <div className="border-t border-slate-850 pt-4 flex flex-col gap-2">
                                    <p className="text-xs text-slate-450 flex items-center justify-between">
                                        <span>Manager: <strong className="text-slate-300 font-semibold">{s.contactPerson}</strong></span>
                                        <a href={`tel:${s.phone}`} className="text-cyan-400 font-bold hover:underline inline-flex items-center gap-0.5">
                                            <Phone size={10} /> Call Manager
                                        </a>
                                    </p>

                                    {s.distance !== undefined && (
                                        <div className="text-[10px] text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 py-1 px-2.5 rounded-lg font-bold text-center">
                                            Proximity: {s.distance.toFixed(1)} km away from your GPS coordinates
                                        </div>
                                    )}

                                    {s.status === "Open" && !isFull && (
                                        <button
                                            onClick={() => navigate(`/public/map`)}
                                            className="w-full bg-gradient-to-r from-blue-650 to-cyan-650 hover:brightness-110 font-bold text-white text-xs py-2.5 rounded-xl transition shadow-md"
                                        >
                                            Get Navigation Directions
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default PublicShelters;
