import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Search,
    Plus,
    ShieldAlert,
    Truck,
    User,
    Phone,
    MapPin,
    Activity,
    Wrench,
    Compass,
    Flame,
    Anchor,
    Shield,
    FileText,
    Download,
    ChevronRight,
    Gauge,
    Map,
    CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";

import MainLayout from "../../components/layout/MainLayout";
import Header from "../../components/layout/Header";
import BackButton from "../../components/common/BackButton";
import useVehicles from "../../hooks/useVehicles";
import VehicleModal from "../../components/vehicles/VehicleModal";
import DeleteVehicleDialog from "../../components/vehicles/DeleteVehicleDialog";
import { useAuth } from "../../context/AuthContext";
import { useMap } from "../../context/MapContext";

const statusStyles = {
    Available: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    Assigned: "bg-blue-105 text-blue-700 ring-blue-200",
    "On Mission": "bg-amber-100 text-amber-700 ring-amber-200",
    Returning: "bg-purple-100 text-purple-700 ring-purple-200",
    Maintenance: "bg-rose-100 text-rose-700 ring-rose-200",
};

const typeIcons = {
    Ambulance: Activity,
    "Rescue Boat": Anchor,
    "Fire Engine": Flame,
    "Police Vehicle": Shield,
    "Supply Truck": Truck,
    "NDRF Vehicle": Compass,
};

const districts = [
    "All Districts",
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

const VehiclePage = () => {
    const { user } = useAuth();
    const isAdmin = user?.role?.toLowerCase() === "admin";

    const {
        vehicles,
        isLoading,
        error,
        addVehicle,
        editVehicle,
        deleteVehicle,
        updateLocation,
        completeMission,
    } = useVehicles();

    const { setMapFlyToTarget, setLayers } = useMap();
    const navigate = useNavigate();

    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");
    const [districtFilter, setDistrictFilter] = useState("All Districts");

    // Modals configuration
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [mode, setMode] = useState("add"); // "add" | "edit"
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Filtering Logic
    const filteredVehicles = useMemo(() => {
        return vehicles.filter((v) => {
            const matchesSearch = [
                v.vehicleNumber,
                v.driverName,
                v.department,
                v.currentMission,
            ]
                .filter(Boolean)
                .some((val) => val.toLowerCase().includes(searchTerm.trim().toLowerCase()));

            const matchesType = typeFilter === "All" || v.vehicleType === typeFilter;
            const matchesStatus = statusFilter === "All" || v.status === statusFilter;
            const matchesDistrict =
                districtFilter === "All Districts" || v.district === districtFilter;

            return matchesSearch && matchesType && matchesStatus && matchesDistrict;
        });
    }, [vehicles, searchTerm, typeFilter, statusFilter, districtFilter]);

    // Stats Computations
    const stats = useMemo(() => {
        const total = vehicles.length;
        const available = vehicles.filter((v) => v.status === "Available").length;
        const onMission = vehicles.filter(
            (v) => v.status === "On Mission" || v.status === "Assigned"
        ).length;
        const inMaintenance = vehicles.filter((v) => v.status === "Maintenance").length;
        const utilization = total > 0 ? Math.round((onMission / total) * 100) : 0;

        return { total, available, onMission, inMaintenance, utilization };
    }, [vehicles]);

    const handleOpenAddModal = () => {
        setSelectedVehicle(null);
        setMode("add");
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (vehicle) => {
        setSelectedVehicle(vehicle);
        setMode("edit");
        setIsModalOpen(true);
    };

    const handleOpenDeleteDialog = (vehicle) => {
        setSelectedVehicle(vehicle);
        setIsDeleteDialogOpen(true);
    };

    const handleModalSubmit = async (formData) => {
        setModalLoading(true);
        try {
            if (mode === "add") {
                await addVehicle(formData);
                toast.success("Rescue vehicle enrolled successfully.");
            } else {
                await editVehicle({ id: selectedVehicle._id, data: formData });
                toast.success("Fleet vehicle updated successfully.");
            }
            setIsModalOpen(false);
        } catch (err) {
            toast.error(err || "Failed to process vehicle request.");
        } finally {
            setModalLoading(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!selectedVehicle) return;
        setDeleteLoading(true);
        try {
            await deleteVehicle(selectedVehicle._id);
            toast.success("Rescue vehicle decommissioned safely.");
            setIsDeleteDialogOpen(false);
        } catch (err) {
            toast.error(err || "Failed to decommission vehicle.");
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleCompleteMission = async (id) => {
        try {
            await completeMission(id);
            toast.success("Rescue mission details flagged complete. Vehicle status reset.");
        } catch (err) {
            toast.error(err || "Failed to complete mission.");
        }
    };

    const handleSimulateGPS = async (vehicle) => {
        const offsetLat = (Math.random() - 0.5) * 0.01;
        const offsetLng = (Math.random() - 0.5) * 0.01;
        const newLat = Number((vehicle.latitude + offsetLat).toFixed(5));
        const newLng = Number((vehicle.longitude + offsetLng).toFixed(5));

        try {
            await updateLocation({
                id: vehicle._id,
                latitude: newLat,
                longitude: newLng,
            });
            toast.success(
                <span>
                    GPS Ping sent for <b>{vehicle.vehicleNumber}</b>: ({newLat}, {newLng})
                </span>
            );
        } catch (err) {
            toast.error("Failed to push GPS tracking updates.");
        }
    };

    const handleViewOnMap = (vehicle) => {
        if (!vehicle.latitude || !vehicle.longitude) {
            toast.error("Telemetry coordinate not available for this vehicle.");
            return;
        }

        setMapFlyToTarget([vehicle.latitude, vehicle.longitude]);
        setLayers((prev) => ({ ...prev, vehicles: true }));
        toast.success(`Positioned map view over vehicle ${vehicle.vehicleNumber}.`);
        navigate("/map");
    };

    const handleExportCSV = () => {
        if (filteredVehicles.length === 0) {
            toast.error("No vehicle fleet records to export.");
            return;
        }

        const headers = ["Vehicle Number", "Vehicle Type", "Department", "Driver Name", "Driver Phone", "District", "Latitude", "Longitude", "Status", "Fuel Level", "Capacity", "Assigned Incident"];
        const rows = filteredVehicles.map(v => [
            v.vehicleNumber,
            v.vehicleType,
            `"${v.department.replace(/"/g, '""')}"`,
            `"${v.driverName.replace(/"/g, '""')}"`,
            v.driverPhone,
            v.district,
            v.latitude,
            v.longitude,
            v.status,
            v.fuelLevel,
            `"${(v.capacity || "N/A").replace(/"/g, '""')}"`,
            `"${(v.assignedIncident?.title || v.assignedIncident || "None").replace(/"/g, '""')}"`
        ]);

        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `fleet_telematics_report_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("CSV log exported.");
    };

    const handleExportPDF = () => {
        if (filteredVehicles.length === 0) {
            toast.error("No vehicle fleet records to export.");
            return;
        }

        const printWindow = window.open("", "_blank");
        const htmlDef = `
            <html>
                <head>
                    <title>Statewide Telematics Report - ${new Date().toLocaleDateString()}</title>
                    <style>
                        body { font-family: sans-serif; padding: 30px; color: #1e293b; }
                        h1 { font-size: 24px; margin-bottom: 4px; color: #0f172a; }
                        p { font-size: 13px; color: #64748b; margin-top: 0; }
                        table { width: 100%; border-collapse: collapse; margin-top: 25px; }
                        th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; font-size: 11px; }
                        th { background-color: #f8fafc; font-weight: 600; color: #475569; }
                        .badge { padding: 3px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; }
                        .badge-Available { background-color: #e0f2fe; color: #0369a1; }
                        .badge-Mission { background-color: #fef2f2; color: #991b1b; }
                    </style>
                </head>
                <body>
                    <h1>Kerala Disaster Intelligence Platform</h1>
                    <p>Emergency Vehicle & Fleet Telematics Log - Generated ${new Date().toLocaleString()}</p>
                    <table>
                        <thead>
                            <tr>
                                <th>Fleet Number</th>
                                <th>Type</th>
                                <th>Department</th>
                                <th>Driver Details</th>
                                <th>District</th>
                                <th>Status</th>
                                <th>Fuel Level</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredVehicles.map(v => `
                                <tr>
                                    <td><strong>${v.vehicleNumber}</strong></td>
                                    <td>${v.vehicleType}</td>
                                    <td>${v.department}</td>
                                    <td>${v.driverName} (${v.driverPhone})</td>
                                    <td>${v.district}</td>
                                    <td>${v.status}</td>
                                    <td>${v.fuelLevel}%</td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                    <script>
                        window.onload = function() {
                            window.print();
                            window.close();
                        };
                    </script>
                </body>
            </html>
        `;
        printWindow.document.write(htmlDef);
        printWindow.document.close();
        toast.success("PDF report generated.");
    };

    return (
        <MainLayout>
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <BackButton />
                <Header
                    title="Rescue Fleet & Vehicle Tracker"
                    subtitle="State-wide live telematics platform. Enroll fleet assets, assign to disaster calls, and track live GPS coordinates."
                />

                {/* Telematics Stats Banner */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5 mb-8 font-semibold">
                    {/* Total */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl shrink-0">
                            <Truck className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Fleet</p>
                            <h3 className="text-3xl font-extrabold text-slate-800">{stats.total}</h3>
                        </div>
                    </div>

                    {/* Available */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0">
                            <CheckCircle className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Available</p>
                            <h3 className="text-3xl font-extrabold text-slate-800">{stats.available}</h3>
                        </div>
                    </div>

                    {/* Active */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl shrink-0">
                            <Activity className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">On Mission</p>
                            <h3 className="text-3xl font-extrabold text-slate-800">{stats.onMission}</h3>
                        </div>
                    </div>

                    {/* Maintenance */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl shrink-0">
                            <Wrench className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Maintenance</p>
                            <h3 className="text-3xl font-extrabold text-slate-800">{stats.inMaintenance}</h3>
                        </div>
                    </div>

                    {/* Fleet utilization */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl shrink-0">
                            <Gauge className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Fleet Util</p>
                            <h3 className="text-3xl font-extrabold text-slate-800">{stats.utilization}%</h3>
                        </div>
                    </div>
                </div>

                {/* Filters panel */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search fleet number, driver name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 border border-slate-250 rounded-2xl text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-xs"
                        />
                    </div>

                    {/* Dropdowns */}
                    <div className="flex flex-wrap gap-3 w-full md:w-auto items-center">
                        <button
                            type="button"
                            onClick={handleExportCSV}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer"
                        >
                            <Download className="h-4 w-4" />
                            CSV
                        </button>

                        <button
                            type="button"
                            onClick={handleExportPDF}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer"
                        >
                            <FileText className="h-4 w-4" />
                            PDF Report
                        </button>

                        {/* Type filter */}
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="px-4 py-2.5 border rounded-xl text-slate-700 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500/10 cursor-pointer"
                        >
                            <option value="All">All Types</option>
                            <option value="Ambulance">Ambulance</option>
                            <option value="Rescue Boat">Rescue Boat</option>
                            <option value="Fire Engine">Fire Engine</option>
                            <option value="Police Vehicle">Police Vehicle</option>
                            <option value="Supply Truck">Supply Truck</option>
                            <option value="NDRF Vehicle">NDRF Vehicle</option>
                        </select>

                        {/* Status filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2.5 border rounded-xl text-slate-700 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500/10 cursor-pointer"
                        >
                            <option value="All">All Statuses</option>
                            <option value="Available">Available</option>
                            <option value="Assigned">Assigned</option>
                            <option value="On Mission">On Mission</option>
                            <option value="Returning">Returning</option>
                            <option value="Maintenance">Maintenance</option>
                        </select>

                        {/* District filter */}
                        <select
                            value={districtFilter}
                            onChange={(e) => setDistrictFilter(e.target.value)}
                            className="px-4 py-2.5 border border-slate-200 rounded-xl text-slate-705 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500/10 cursor-pointer"
                        >
                            {districts.map((d) => (
                                <option key={d} value={d}>
                                    {d}
                                </option>
                            ))}
                        </select>
                    </div>

                    {isAdmin && (
                        <button
                            type="button"
                            onClick={handleOpenAddModal}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-650 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                        >
                            <Plus className="h-4 w-4" />
                            Enroll Rescue Vehicle
                        </button>
                    )}
                </div>

                {/* Vehicles layout grid */}
                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <span className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-indigo-600"></span>
                    </div>
                ) : error ? (
                    <div className="bg-rose-50 text-rose-700 border border-rose-200 rounded-3xl p-6 text-center font-medium">
                        Failed to load vehicle telemetry: {error}
                    </div>
                ) : filteredVehicles.length === 0 ? (
                    <div className="bg-white border rounded-3xl p-16 text-center text-slate-400 font-medium">
                        No fleet vehicles found matching configured filters.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredVehicles.map((vehicle) => {
                            const IconComponent = typeIcons[vehicle.vehicleType] || Truck;
                            const statusBadge =
                                statusStyles[vehicle.status] || "bg-slate-100 text-slate-700";

                            return (
                                <div
                                    key={vehicle._id}
                                    className="bg-white rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-all hover:scale-[1.01]"
                                >
                                    {/* Top metadata */}
                                    <div className="p-6 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className="p-3 bg-slate-50 text-slate-700 rounded-2xl border border-slate-100">
                                                    <IconComponent className="h-6 w-6 stroke-[1.8] text-blue-650" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-800 text-lg">
                                                        {vehicle.vehicleNumber}
                                                    </h3>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                                        {vehicle.vehicleType}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ring-1 ${statusBadge}`}>
                                                {vehicle.status}
                                            </span>
                                        </div>

                                        {/* Fuel Level visualizer */}
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs font-bold text-slate-500">
                                                <span>Telemetry Fuel Level</span>
                                                <span className={vehicle.fuelLevel < 20 ? "text-rose-600 animate-pulse font-extrabold" : "text-slate-700"}>
                                                    {vehicle.fuelLevel}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-300 ${vehicle.fuelLevel < 20
                                                        ? "bg-rose-500"
                                                        : vehicle.fuelLevel < 50
                                                            ? "bg-amber-500"
                                                            : "bg-emerald-500"
                                                        }`}
                                                    style={{ width: `${vehicle.fuelLevel}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Primary specifications */}
                                        <div className="space-y-2 text-xs border-t border-slate-100 pt-4 mt-2">
                                            <div className="flex items-center justify-between text-slate-600">
                                                <span className="font-bold text-slate-400">Department:</span>
                                                <span className="text-slate-850 font-bold text-right truncate max-w-[200px]">
                                                    {vehicle.department}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-slate-600">
                                                <span className="font-bold text-slate-400">Capacity:</span>
                                                <span className="text-slate-850 font-bold">
                                                    {vehicle.capacity || "N/A"}
                                                </span>
                                            </div>
                                            <p className="flex items-center gap-2 text-slate-600">
                                                <MapPin className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                                                <span className="text-slate-850 font-semibold truncate">
                                                    {vehicle.district} ({vehicle.latitude.toFixed(4)},{" "}
                                                    {vehicle.longitude.toFixed(4)})
                                                </span>
                                            </p>
                                            <div className="flex flex-col gap-1.5 bg-slate-50 rounded-2xl p-3 mt-3 border border-slate-100 font-semibold">
                                                <p className="flex items-center gap-2 text-slate-700">
                                                    <User className="h-3.5 w-3.5 text-slate-450" />
                                                    <span>Driver: <b>{vehicle.driverName}</b></span>
                                                </p>
                                                <p className="flex items-center gap-2 text-indigo-600">
                                                    <Phone className="h-3.5 w-3.5 text-indigo-400" />
                                                    <a href={`tel:${vehicle.driverPhone}`} className="hover:underline">
                                                        {vehicle.driverPhone}
                                                    </a>
                                                </p>
                                            </div>
                                        </div>

                                        {/* Assigned Incident / Mission details */}
                                        {vehicle.assignedIncident && (
                                            <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-3.5 mt-2 space-y-1 text-xs">
                                                <p className="font-bold text-indigo-900 flex items-center gap-1.5">
                                                    <ShieldAlert className="h-4 w-4 text-indigo-500 shrink-0" />
                                                    Incident Call Actioned
                                                </p>
                                                <p className="text-indigo-855 font-semibold line-clamp-1">
                                                    Call ID:{" "}
                                                    {typeof vehicle.assignedIncident === "object"
                                                        ? vehicle.assignedIncident.title
                                                        : "Active Call"}
                                                </p>
                                                {vehicle.currentMission && (
                                                    <p className="text-indigo-650 italic leading-relaxed mt-1">
                                                        Task: "{vehicle.currentMission}"
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Bottom Action Footer */}
                                    <div className="border-t border-slate-100 px-6 py-4 bg-slate-55 flex flex-wrap gap-2 justify-between items-center text-xs">
                                        <div className="flex gap-2">
                                            {/* View on Map */}
                                            <button
                                                onClick={() => handleViewOnMap(vehicle)}
                                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold transition shadow-sm cursor-pointer border border-blue-100"
                                            >
                                                <Map className="h-3.5 w-3.5" />
                                                Locate
                                            </button>

                                            {/* Sim GPS location */}
                                            <button
                                                onClick={() => handleSimulateGPS(vehicle)}
                                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold transition shadow-sm cursor-pointer border border-indigo-100"
                                                title="Simulate GPS client device movement"
                                            >
                                                Telemetry GPS Ping
                                            </button>
                                        </div>

                                        <div className="flex gap-2">
                                            {/* Mission completion */}
                                            {(vehicle.status === "On Mission" ||
                                                vehicle.status === "Assigned") && (
                                                    <button
                                                        onClick={() => handleCompleteMission(vehicle._id)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-md cursor-pointer"
                                                    >
                                                        Finish Task
                                                    </button>
                                                )}

                                            {isAdmin && (
                                                <>
                                                    <button
                                                        onClick={() => handleOpenEditModal(vehicle)}
                                                        className="px-2.5 py-2 border border-slate-205 hover:bg-white text-slate-650 rounded-xl font-bold transition cursor-pointer"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenDeleteDialog(vehicle)}
                                                        className="px-2.5 py-2 hover:bg-rose-50 border border-transparent text-rose-600 rounded-xl font-bold transition cursor-pointer"
                                                    >
                                                        Delete
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Modals & Dialogs */}
                <VehicleModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={handleModalSubmit}
                    initialData={selectedVehicle}
                    loading={modalLoading}
                    mode={mode}
                />

                <DeleteVehicleDialog
                    isOpen={isDeleteDialogOpen}
                    onClose={() => setIsDeleteDialogOpen(false)}
                    onConfirm={handleDeleteConfirm}
                    vehicle={selectedVehicle}
                    loading={deleteLoading}
                />
            </div>
        </MainLayout>
    );
};

export default VehiclePage;
