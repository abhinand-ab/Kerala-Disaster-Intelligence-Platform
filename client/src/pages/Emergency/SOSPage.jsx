import { useState, useEffect } from "react";
import { useSubmitSOS, useTrackSOS } from "../../hooks/useEmergencyRequests";
import BackButton from "../../components/common/BackButton";
import Card from "../../components/common/Card";
import { toast } from "react-hot-toast";
import {
    ShieldAlert,
    MapPin,
    Phone,
    User,
    Mail,
    AlertOctagon,
    Image,
    Video,
    CheckCircle,
    Truck,
    Building,
    UserCheck,
    Search,
    Navigation,
    Compass
} from "lucide-react";

const KERALA_DISTRICTS = [
    "Thiruvananthapuram", "Kollam", "Pathanamthitta", "Alappuzha", "Kottayam",
    "Idukki", "Ernakulam", "Thrissur", "Palakkad", "Malappuram", "Kozhikode",
    "Wayanad", "Kannur", "Kasaragod"
];

const SOSPage = () => {
    const submitSOSMutation = useSubmitSOS();

    // Form State
    const [formData, setFormData] = useState({
        citizenName: "",
        phone: "",
        email: "",
        emergencyType: "Flood",
        severity: "High",
        description: "",
        latitude: 10.8505,
        longitude: 76.2711,
        district: "Idukki",
        address: "",
        photos: [],
        videos: [],
    });

    const [photoInput, setPhotoInput] = useState("");
    const [videoInput, setVideoInput] = useState("");
    const [isLocating, setIsLocating] = useState(false);
    const [trackingPhone, setTrackingPhone] = useState("");
    const [activeTrackingNumber, setActiveTrackingNumber] = useState("");

    const { data: trackedRequests = [], refetch: refetchTracked, isLoading: isTrackingLoading } = useTrackSOS(activeTrackingNumber);

    // Trigger geolocation fetch
    const handleGeolocate = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser.");
            return;
        }
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setFormData((prev) => ({
                    ...prev,
                    latitude: parseFloat(latitude.toFixed(6)),
                    longitude: parseFloat(longitude.toFixed(6)),
                }));
                setIsLocating(false);
                toast.success("Successfully fetched current GPS coordinates!");
            },
            (error) => {
                console.error("GPS error:", error);
                toast.error("Failed to fetch GPS coordinates. Please grant permissions.");
                setIsLocating(false);
            },
            { enableHighAccuracy: true, timeout: 8000 }
        );
    };

    const handleAddPhoto = () => {
        if (!photoInput) return;
        setFormData((prev) => ({ ...prev, photos: [...prev.photos, photoInput] }));
        setPhotoInput("");
        toast.success("Mock photo attachment registered.");
    };

    const handleAddVideo = () => {
        if (!videoInput) return;
        setFormData((prev) => ({ ...prev, videos: [...prev.videos, videoInput] }));
        setVideoInput("");
        toast.success("Mock video attachment registered.");
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!formData.citizenName || !formData.phone || !formData.description) {
            toast.error("Please fill in all mandatory fields.");
            return;
        }

        try {
            await submitSOSMutation.mutateAsync(formData);
            // Reset form save contact for auto tracking
            setTrackingPhone(formData.phone);
            setActiveTrackingNumber(formData.phone);
            setFormData({
                citizenName: "",
                phone: "",
                email: "",
                emergencyType: "Flood",
                severity: "High",
                description: "",
                latitude: 10.8505,
                longitude: 76.2711,
                district: "Idukki",
                address: "",
                photos: [],
                videos: [],
            });
        } catch (err) {
            // toast is triggered inside Mutation
        }
    };

    const handleSearchTracking = (e) => {
        e.preventDefault();
        if (!trackingPhone) {
            toast.error("Enter a phone number to track.");
            return;
        }
        setActiveTrackingNumber(trackingPhone);
    };

    return (
        <div className="bg-slate-900 min-h-screen text-slate-100 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <BackButton className="text-white hover:bg-slate-800" />

                {/* SOS Alert Banner */}
                <div className="bg-gradient-to-r from-red-650 to-orange-600 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                    <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-y-[-10px] translate-x-[20px]">
                        <ShieldAlert className="h-64 w-64 text-white" />
                    </div>
                    <div className="space-y-2 relative z-10">
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-3">
                            <span className="bg-white text-red-650 px-3 py-1 rounded-2xl text-lg font-black animate-pulse">
                                SOS
                            </span>
                            Citizen Emergency Portal
                        </h1>
                        <p className="text-red-50 text-sm md:text-base max-w-xl">
                            Report active disasters, request emergency rescue, pin your coordinates, and trace responder statuses in real-time.
                        </p>
                    </div>
                    <div className="flex gap-2 shrink-0 relative z-10 w-full md:w-auto">
                        <a
                            href="#sos-form"
                            className="bg-white text-red-650 hover:bg-red-50 font-bold px-6 py-3 rounded-xl transition text-center flex-1"
                        >
                            Report Emergency
                        </a>
                        <a
                            href="#track-status"
                            className="bg-slate-950/40 border border-white/20 text-white hover:bg-slate-950/60 font-bold px-6 py-3 rounded-xl transition text-center flex-1"
                        >
                            Track Status
                        </a>
                    </div>
                </div>

                {/* Grid forms */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Form: SOS Report Form */}
                    <div id="sos-form" className="lg:col-span-7 space-y-6">
                        <Card className="bg-slate-850 border-slate-750 p-6 md:p-8 shadow-2xl relative">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <AlertOctagon className="text-red-500 w-6 h-6 animate-pulse" />
                                Submit Emergency SOS
                            </h2>

                            <form onSubmit={handleFormSubmit} className="space-y-6">
                                {/* Contact information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-slate-450 uppercase block">Name *</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-3.5 text-slate-500 w-4.5 h-4.5" />
                                            <input
                                                type="text"
                                                placeholder="John Doe"
                                                required
                                                value={formData.citizenName}
                                                onChange={(e) => setFormData({ ...formData, citizenName: e.target.value })}
                                                className="w-full bg-slate-900/60 border border-slate-700/80 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-red-520 transition"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-slate-450 uppercase block">Mobile Phone *</label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-3.5 text-slate-500 w-4.5 h-4.5" />
                                            <input
                                                type="tel"
                                                placeholder="+91 9876543210"
                                                required
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                className="w-full bg-slate-900/60 border border-slate-700/80 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-red-520 transition"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-450 uppercase block">Email Address (Optional)</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3.5 text-slate-500 w-4.5 h-4.5" />
                                        <input
                                            type="email"
                                            placeholder="john@example.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full bg-slate-900/60 border border-slate-700/80 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-red-520 transition"
                                        />
                                    </div>
                                </div>

                                {/* Emergency Details Selector */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-slate-450 uppercase block">Emergency Type *</label>
                                        <select
                                            value={formData.emergencyType}
                                            onChange={(e) => setFormData({ ...formData, emergencyType: e.target.value })}
                                            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-red-520 transition cursor-pointer"
                                        >
                                            <option value="Flood">Flood / Water Inflow</option>
                                            <option value="Landslide">Landslide / Soil Erosion</option>
                                            <option value="Medical">Medical Emergency</option>
                                            <option value="Trapped">Trapped / Stranded Hilly Area</option>
                                            <option value="Other">Other Hazard Incident</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-slate-450 uppercase block">Priority Severity *</label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {["Low", "Medium", "High", "Critical"].map((sev) => {
                                                const isSelected = formData.severity === sev;
                                                return (
                                                    <button
                                                        key={sev}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, severity: sev })}
                                                        className={`py-2 rounded-xl text-xs font-bold transition-all border ${isSelected
                                                                ? sev === "Critical"
                                                                    ? "bg-red-600 text-white border-red-600 shadow-md shadow-red-650/40"
                                                                    : sev === "High"
                                                                        ? "bg-orange-500 text-white border-orange-500 shadow-md"
                                                                        : sev === "Medium"
                                                                            ? "bg-yellow-500 text-white border-yellow-500 shadow-md"
                                                                            : "bg-emerald-500 text-white border-emerald-500 shadow-md"
                                                                : "bg-slate-900/60 border-slate-700 hover:border-slate-600 text-slate-450"
                                                            }`}
                                                    >
                                                        {sev}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-450 uppercase block">Description of Emergency *</label>
                                    <textarea
                                        placeholder="Describe your situation in detail. If stranded, specify the floor/exact environment layout, number of persons needing evacuation, medical conditions, etc."
                                        required
                                        rows={4}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-slate-900/60 border border-slate-700/80 rounded-xl p-4 text-white focus:outline-none focus:border-red-520 transition"
                                    />
                                </div>

                                {/* Location Coordinates & District */}
                                <div className="space-y-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-750">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
                                            <MapPin className="text-red-500 w-4 h-4 animate-bounce" /> Location Coordinates
                                        </span>
                                        <button
                                            type="button"
                                            disabled={isLocating}
                                            onClick={handleGeolocate}
                                            className="bg-red-600 hover:bg-red-750 disabled:bg-red-800 text-white text-[10px] font-extrabold px-3 py-1.5 rounded-xl transition flex items-center gap-1 cursor-pointer"
                                        >
                                            <MapPin className="w-3.5 h-3.5" />
                                            {isLocating ? "Locating..." : "Pin Current GPS"}
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-450">Latitude</label>
                                            <input
                                                type="number"
                                                step="any"
                                                required
                                                value={formData.latitude}
                                                onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-450">Longitude</label>
                                            <input
                                                type="number"
                                                step="any"
                                                required
                                                value={formData.longitude}
                                                onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                                            />
                                        </div>
                                        <div className="space-y-1 col-span-2 md:col-span-1">
                                            <label className="text-[10px] font-bold text-slate-450">District</label>
                                            <select
                                                value={formData.district}
                                                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white cursor-pointer"
                                            >
                                                {KERALA_DISTRICTS.map((dst) => (
                                                    <option key={dst} value={dst}>
                                                        {dst}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-slate-450 uppercase block">Landmark / Local Address</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Near Junction, House No. 4, Idukki"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-red-520 transition"
                                        />
                                    </div>
                                </div>

                                {/* Media Attachments */}
                                <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-750 space-y-4">
                                    <span className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
                                        <Image className="text-slate-400 w-4 h-4" /> Upload Mock Media Links
                                    </span>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-450 block">Photo URL</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="https://images.unsplash.com/..."
                                                    value={photoInput}
                                                    onChange={(e) => setPhotoInput(e.target.value)}
                                                    className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white flex-1"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleAddPhoto}
                                                    className="bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold px-3 rounded-lg border border-slate-700"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {formData.photos.map((p, i) => (
                                                    <span key={i} className="text-[10px] bg-slate-800 text-slate-350 px-2 py-0.5 rounded border border-slate-700 truncate w-32">
                                                        Photo {i + 1}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-450 block">Video URL</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="https://videos.domain.com/..."
                                                    value={videoInput}
                                                    onChange={(e) => setVideoInput(e.target.value)}
                                                    className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white flex-1"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleAddVideo}
                                                    className="bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold px-3 rounded-lg border border-slate-700"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {formData.videos.map((v, i) => (
                                                    <span key={i} className="text-[10px] bg-slate-800 text-slate-350 px-2 py-0.5 rounded border border-slate-700 truncate w-32">
                                                        Video {i + 1}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Submit Trigger */}
                                <button
                                    type="submit"
                                    disabled={submitSOSMutation.isPending}
                                    className="w-full bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-650 hover:to-orange-550 disabled:bg-red-400 text-white font-extrabold py-4 rounded-xl shadow-xl shadow-red-700/20 hover:scale-[1.01] transition-all cursor-pointer flex justify-center items-center gap-2 text-sm"
                                >
                                    {submitSOSMutation.isPending ? (
                                        <>
                                            <span className="animate-spin rounded-full h-4 w-4 border-2 border-slate-200 border-t-red-600"></span>
                                            Transmitting SOS coordinates...
                                        </>
                                    ) : (
                                        <>
                                            <ShieldAlert className="w-5 h-5 animate-pulse" />
                                            TRANSMIT IMMEDIATE EMERGENCY SOS
                                        </>
                                    )}
                                </button>
                            </form>
                        </Card>
                    </div>

                    {/* Right Panel: Track request status */}
                    <div id="track-status" className="lg:col-span-5 space-y-6">
                        <Card className="bg-slate-850 border-slate-750 p-6 shadow-2xl">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <Compass className="text-orange-500 w-6 h-6 animate-spin-slow" />
                                Live Dispatch Tracking
                            </h2>

                            <form onSubmit={handleSearchTracking} className="space-y-3 mb-6">
                                <label className="text-[10px] font-bold text-slate-450 uppercase block">Registered Phone Number</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Phone className="absolute left-3 top-3.5 text-slate-500 w-4 h-4" />
                                        <input
                                            type="tel"
                                            placeholder="Enter mobile phone to trace"
                                            value={trackingPhone}
                                            onChange={(e) => setTrackingPhone(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-orange-500"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="bg-orange-500 hover:bg-orange-650 text-white text-xs font-bold px-4 py-3 rounded-xl transition flex items-center gap-1 shadow cursor-pointer"
                                    >
                                        <Search className="w-4 h-4" /> Trace
                                    </button>
                                </div>
                            </form>

                            {isTrackingLoading ? (
                                <div className="flex justify-center items-center py-20">
                                    <span className="animate-spin rounded-full h-8 w-8 border-4 border-slate-700 border-t-orange-500"></span>
                                </div>
                            ) : activeTrackingNumber && trackedRequests.length === 0 ? (
                                <div className="bg-slate-900/60 rounded-2xl border border-slate-750 p-8 text-center text-slate-450 text-xs">
                                    No active emergency requests found connected to this contact number.
                                </div>
                            ) : activeTrackingNumber ? (
                                <div className="space-y-6 max-h-[600px] overflow-y-auto pr-1">
                                    {trackedRequests.map((req) => (
                                        <div
                                            key={req._id}
                                            className="p-5 bg-slate-900/80 rounded-2xl border border-slate-750 space-y-4 shadow-xl"
                                        >
                                            <div className="flex justify-between items-start border-b border-slate-700/60 pb-3">
                                                <div>
                                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${req.severity === "Critical" ? "bg-red-500 text-white animate-pulse" :
                                                            req.severity === "High" ? "bg-orange-500 text-white" :
                                                                req.severity === "Medium" ? "bg-yellow-500 text-slate-900" :
                                                                    "bg-emerald-500 text-white"
                                                        }`}>
                                                        {req.severity} priority - {req.emergencyType}
                                                    </span>
                                                    <span className="text-[10px] font-medium text-slate-400 block mt-1">
                                                        Reported: {new Date(req.createdAt).toLocaleString("en-IN")}
                                                    </span>
                                                </div>
                                                <span className={`text-xs font-black uppercase px-3 py-1 rounded-xl border ${req.requestStatus === "Resolved" ? "bg-emerald-950 text-emerald-450 border-emerald-800" :
                                                        req.requestStatus === "Assigned" ? "bg-blue-950 text-blue-400 border-blue-800 animate-pulse" :
                                                            req.requestStatus === "Reviewed" ? "bg-yellow-950 text-yellow-450 border-yellow-800" :
                                                                req.requestStatus === "Cancelled" ? "bg-slate-800 text-slate-400 border-slate-700" :
                                                                    "bg-red-950 text-red-400 border-red-800"
                                                    }`}>
                                                    {req.requestStatus}
                                                </span>
                                            </div>

                                            <p className="text-xs text-slate-350 leading-relaxed italic">
                                                "{req.description}"
                                            </p>

                                            {/* Tracker Timeline Progress */}
                                            <div className="space-y-3 pt-2">
                                                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Rescue Timeline</h4>

                                                <div className="relative pl-6 space-y-4 border-l-2 border-slate-805">
                                                    {/* Step 1: Logged */}
                                                    <div className="relative">
                                                        <span className="absolute left-[-29px] top-0 bg-emerald-600 rounded-full w-4 h-4 flex items-center justify-center border-2 border-slate-900 shadow">
                                                            <CheckCircle className="w-2.5 h-2.5 text-white" />
                                                        </span>
                                                        <div className="text-xs">
                                                            <p className="font-bold text-slate-200">SOS Logged successfully</p>
                                                            <p className="text-[10px] text-slate-400">Position keyed onto live map layers</p>
                                                        </div>
                                                    </div>

                                                    {/* Step 2: Assigned */}
                                                    <div className="relative">
                                                        <span className={`absolute left-[-29px] top-0 rounded-full w-4 h-4 flex items-center justify-center border-2 border-slate-900 shadow ${req.assignedTeam || req.assignedVehicle ? "bg-emerald-600" : "bg-slate-700"
                                                            }`}>
                                                            {(req.assignedTeam || req.assignedVehicle) ? (
                                                                <CheckCircle className="w-2.5 h-2.5 text-white" />
                                                            ) : (
                                                                <span className="w-1.5 h-1.5 bg-slate-900 rounded-full" />
                                                            )}
                                                        </span>
                                                        <div className="text-xs">
                                                            <p className={`font-bold ${req.assignedTeam || req.assignedVehicle ? "text-slate-200" : "text-slate-500"}`}>
                                                                Responders assigned
                                                            </p>
                                                            {req.assignedTeam && (
                                                                <div className="mt-1 bg-slate-950 p-2 rounded border border-slate-750 flex items-center gap-2">
                                                                    <UserCheck className="w-4 h-4 text-emerald-400" />
                                                                    <div>
                                                                        <p className="font-extrabold text-[11px] text-white">Team: {req.assignedTeam.teamName}</p>
                                                                        <p className="text-[9px] text-slate-400">Specialization: {req.assignedTeam.specialization || "General"}</p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {req.assignedVehicle && (
                                                                <div className="mt-1.5 bg-slate-950 p-2 rounded border border-slate-750 flex items-center gap-2">
                                                                    <Truck className="w-4 h-4 text-blue-450" />
                                                                    <div>
                                                                        <p className="font-extrabold text-[11px] text-white">Vehicle: {req.assignedVehicle.vehicleNumber}</p>
                                                                        <p className="text-[9px] text-slate-450">Type: {req.assignedVehicle.vehicleType} | Driver: {req.assignedVehicle.driverName}</p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Step 3: Evacuation Shelter */}
                                                    <div className="relative">
                                                        <span className={`absolute left-[-29px] top-0 rounded-full w-4 h-4 flex items-center justify-center border-2 border-slate-900 shadow ${req.assignedShelter ? "bg-emerald-600" : "bg-slate-700"
                                                            }`}>
                                                            {req.assignedShelter ? (
                                                                <CheckCircle className="w-2.5 h-2.5 text-white" />
                                                            ) : (
                                                                <span className="w-1.5 h-1.5 bg-slate-900 rounded-full" />
                                                            )}
                                                        </span>
                                                        <div className="text-xs">
                                                            <p className={`font-bold ${req.assignedShelter ? "text-slate-200" : "text-slate-500"}`}>
                                                                Destination Shelter Assigned
                                                            </p>
                                                            {req.assignedShelter && (
                                                                <div className="mt-1 bg-slate-950 p-2 rounded border border-slate-750 flex items-center gap-2">
                                                                    <Building className="w-4 h-4 text-indigo-400" />
                                                                    <div>
                                                                        <p className="font-bold text-[11px] text-white">{req.assignedShelter.name}</p>
                                                                        <p className="text-[9px] text-slate-450">Address: {req.assignedShelter.address || req.assignedShelter.district}</p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Step 4: Resolved */}
                                                    <div className="relative">
                                                        <span className={`absolute left-[-29px] top-0 rounded-full w-4 h-4 flex items-center justify-center border-2 border-slate-900 shadow ${req.requestStatus === "Resolved" ? "bg-emerald-600" : "bg-slate-700"
                                                            }`}>
                                                            {req.requestStatus === "Resolved" ? (
                                                                <CheckCircle className="w-2.5 h-2.5 text-white" />
                                                            ) : (
                                                                <span className="w-1.5 h-1.5 bg-slate-900 rounded-full" />
                                                            )}
                                                        </span>
                                                        <div className="text-xs">
                                                            <p className={`font-bold ${req.requestStatus === "Resolved" ? "text-slate-200" : "text-slate-500"}`}>
                                                                Situation Resolved
                                                            </p>
                                                            {req.requestStatus === "Resolved" && (
                                                                <p className="text-[10px] text-emerald-450 leading-relaxed font-semibold mt-1">
                                                                    Responders have successfully completed rescue operations. Stay safe!
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-slate-900/60 rounded-2xl border border-slate-755 p-12 text-center text-slate-500 text-xs">
                                    Enter your SOS mobile phone number above to track response timelines in real-time.
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SOSPage;
