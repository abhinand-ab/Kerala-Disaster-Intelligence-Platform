import { useEffect, useState } from "react";

const districts = [
    "Thiruvananthapuram",
    "Kollam",
    "Pathanamthitta",
    "Alappuzha",
    "Kottayam",
    "Idukki",
    "Ernakulam",
    "Thrissur",
    "Palakkad",
    "Malappuram",
    "Kozhikode",
    "Wayanad",
    "Kannur",
    "Kasaragod",
];

const vehicleTypes = [
    "Ambulance",
    "Rescue Boat",
    "Fire Engine",
    "Police Vehicle",
    "Supply Truck",
    "NDRF Vehicle",
];

const statusOptions = [
    "Available",
    "Assigned",
    "On Mission",
    "Returning",
    "Maintenance",
];

const VehicleForm = ({
    initialData,
    onSubmit,
    loading,
    mode,
    formId,
    firstFocusableRef,
    lastFocusableRef,
}) => {
    const [formData, setFormData] = useState({
        vehicleNumber: "",
        vehicleType: "Ambulance",
        department: "",
        driverName: "",
        driverPhone: "",
        district: "Thiruvananthapuram",
        latitude: 10.0,
        longitude: 76.5,
        status: "Available",
        fuelLevel: 100,
        capacity: "",
        currentMission: "",
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                vehicleNumber: initialData.vehicleNumber || "",
                vehicleType: initialData.vehicleType || "Ambulance",
                department: initialData.department || "",
                driverName: initialData.driverName || "",
                driverPhone: initialData.driverPhone || "",
                district: initialData.district || "Thiruvananthapuram",
                latitude: initialData.latitude ?? 10.0,
                longitude: initialData.longitude ?? 76.5,
                status: initialData.status || "Available",
                fuelLevel: initialData.fuelLevel ?? 100,
                capacity: initialData.capacity || "",
                currentMission: initialData.currentMission || "",
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === "latitude" || name === "longitude" || name === "fuelLevel"
                ? Number(value) || 0
                : value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit?.(formData);
    };

    return (
        <form id={formId} onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {/* Vehicle Plate Number */}
                <div className="space-y-2">
                    <label htmlFor="vehicleNumber" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Vehicle Plate Number *
                    </label>
                    <input
                        ref={firstFocusableRef}
                        type="text"
                        id="vehicleNumber"
                        name="vehicleNumber"
                        required
                        value={formData.vehicleNumber}
                        onChange={handleChange}
                        placeholder="e.g. KL-01-CB-1234"
                        className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 hover:border-slate-350 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                </div>

                {/* Vehicle Type */}
                <div className="space-y-2">
                    <label htmlFor="vehicleType" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Vehicle Type *
                    </label>
                    <select
                        id="vehicleType"
                        name="vehicleType"
                        required
                        value={formData.vehicleType}
                        onChange={handleChange}
                        className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition hover:border-slate-350 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    >
                        {vehicleTypes.map((type) => (
                            <option key={type} value={type}>
                                {type}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Department */}
                <div className="space-y-2">
                    <label htmlFor="department" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Responsible Department *
                    </label>
                    <input
                        type="text"
                        id="department"
                        name="department"
                        required
                        value={formData.department}
                        onChange={handleChange}
                        placeholder="e.g. Kerala Fire & Rescue Services"
                        className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 hover:border-slate-355 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                </div>

                {/* Capacity */}
                <div className="space-y-2">
                    <label htmlFor="capacity" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Capacity (Weight / Passenger Limit)
                    </label>
                    <input
                        type="text"
                        id="capacity"
                        name="capacity"
                        value={formData.capacity}
                        onChange={handleChange}
                        placeholder="e.g. 10 persons, 5 tons"
                        className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 hover:border-slate-350 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                </div>

                {/* Driver Name */}
                <div className="space-y-2">
                    <label htmlFor="driverName" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Driver Name *
                    </label>
                    <input
                        type="text"
                        id="driverName"
                        name="driverName"
                        required
                        value={formData.driverName}
                        onChange={handleChange}
                        placeholder="e.g. Suresh Kumar"
                        className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 hover:border-slate-350 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                </div>

                {/* Driver Phone */}
                <div className="space-y-2">
                    <label htmlFor="driverPhone" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Driver Phone / Hotline *
                    </label>
                    <input
                        type="text"
                        id="driverPhone"
                        name="driverPhone"
                        required
                        value={formData.driverPhone}
                        onChange={handleChange}
                        placeholder="e.g. +91 9447012345"
                        className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 hover:border-slate-350 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                </div>

                {/* District */}
                <div className="space-y-2">
                    <label htmlFor="district" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Assigned District *
                    </label>
                    <select
                        id="district"
                        name="district"
                        required
                        value={formData.district}
                        onChange={handleChange}
                        className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition hover:border-slate-350 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    >
                        {districts.map((dist) => (
                            <option key={dist} value={dist}>
                                {dist}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Status */}
                <div className="space-y-2">
                    <label htmlFor="status" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Vehicle Deploy State *
                    </label>
                    <select
                        id="status"
                        name="status"
                        required
                        value={formData.status}
                        onChange={handleChange}
                        className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition hover:border-slate-350 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    >
                        {statusOptions.map((st) => (
                            <option key={st} value={st}>
                                {st}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Latitude */}
                <div className="space-y-2">
                    <label htmlFor="latitude" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Latitude *
                    </label>
                    <input
                        type="number"
                        step="0.000001"
                        id="latitude"
                        name="latitude"
                        required
                        value={formData.latitude}
                        onChange={handleChange}
                        placeholder="e.g. 10.8505"
                        className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 hover:border-slate-350 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                </div>

                {/* Longitude */}
                <div className="space-y-2">
                    <label htmlFor="longitude" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Longitude *
                    </label>
                    <input
                        type="number"
                        step="0.000001"
                        id="longitude"
                        name="longitude"
                        required
                        value={formData.longitude}
                        onChange={handleChange}
                        placeholder="e.g. 76.2711"
                        className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 hover:border-slate-350 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                </div>

                {/* Fuel Level */}
                <div className="space-y-2">
                    <label htmlFor="fuelLevel" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Fuel Level (%)
                    </label>
                    <input
                        type="number"
                        min="0"
                        max="100"
                        id="fuelLevel"
                        name="fuelLevel"
                        value={formData.fuelLevel}
                        onChange={handleChange}
                        className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 hover:border-slate-350 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                </div>

                {/* Current Mission */}
                <div className="space-y-2">
                    <label htmlFor="currentMission" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Current Mission Details
                    </label>
                    <input
                        ref={lastFocusableRef}
                        type="text"
                        id="currentMission"
                        name="currentMission"
                        value={formData.currentMission}
                        onChange={handleChange}
                        placeholder="e.g. Flood evac or supply dispatch"
                        className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 hover:border-slate-350 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                </div>
            </div>
        </form>
    );
};

export default VehicleForm;
