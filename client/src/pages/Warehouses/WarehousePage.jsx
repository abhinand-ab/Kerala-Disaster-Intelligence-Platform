import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useWarehouses from "../../hooks/useWarehouses";
import { useAuth } from "../../context/AuthContext";
import { useMap } from "../../context/MapContext";
import { toast } from "react-hot-toast";
import BackButton from "../../components/common/BackButton";
import MainLayout from "../../components/layout/MainLayout";
import Header from "../../components/layout/Header";
import {
    Plus, Search, Building2, MapPin, Phone, User,
    Edit, Trash2, ShieldAlert, Cpu, Download, FileText, Map
} from "lucide-react";

const WarehousePage = () => {
    const { warehouses, isLoading, error, addWarehouse, editWarehouse, deleteWarehouse } = useWarehouses();
    const { user } = useAuth();
    const { setMapFlyToTarget, setLayers } = useMap();
    const navigate = useNavigate();
    const isAdmin = user?.role?.toLowerCase() === "admin";

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDistrict, setSelectedDistrict] = useState("All Districts");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingWarehouse, setEditingWarehouse] = useState(null);
    const [formData, setFormData] = useState({
        warehouseName: "",
        address: "",
        district: "Thiruvananthapuram",
        latitude: "",
        longitude: "",
        manager: "",
        phone: "",
        storageCapacity: "",
    });

    const districts = [
        "Thiruvananthapuram", "Kollam", "Pathanamthitta", "Alappuzha",
        "Kottayam", "Idukki", "Ernakulam", "Thrissur", "Palakkad",
        "Malappuram", "Kozhikode", "Wayanad", "Kannur", "Kasaragod"
    ];

    // Filter warehouses
    const filteredWarehouses = useMemo(() => {
        return warehouses.filter(wh => {
            const matchesSearch = wh.warehouseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                wh.manager.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesDistrict = selectedDistrict === "All Districts" || wh.district === selectedDistrict;
            return matchesSearch && matchesDistrict;
        });
    }, [warehouses, searchQuery, selectedDistrict]);

    // Stats
    const stats = useMemo(() => {
        const count = warehouses.length;
        const totalCapacity = warehouses.reduce((sum, w) => sum + w.storageCapacity, 0);
        const totalResources = warehouses.reduce((sum, w) => sum + (w.totalQuantity || 0), 0);
        const avgUtilization = count > 0
            ? Math.round(warehouses.reduce((sum, w) => sum + (w.currentUtilization || 0), 0) / count)
            : 0;

        return { count, totalCapacity, totalResources, avgUtilization };
    }, [warehouses]);

    const handleOpenAddModal = () => {
        setEditingWarehouse(null);
        setFormData({
            warehouseName: "",
            address: "",
            district: "Thiruvananthapuram",
            latitude: "8.5241",
            longitude: "76.9366",
            manager: "",
            phone: "",
            storageCapacity: "10000",
        });
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (wh) => {
        setEditingWarehouse(wh);
        setFormData({
            warehouseName: wh.warehouseName,
            address: wh.address,
            district: wh.district,
            latitude: wh.latitude.toString(),
            longitude: wh.longitude.toString(),
            manager: wh.manager,
            phone: wh.phone,
            storageCapacity: wh.storageCapacity.toString(),
        });
        setIsModalOpen(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.warehouseName || !formData.manager || !formData.phone || !formData.storageCapacity) {
            toast.error("Please fill in all required fields.");
            return;
        }

        const parsedData = {
            ...formData,
            storageCapacity: Number(formData.storageCapacity) || 0,
            latitude: Number(formData.latitude) || 0,
            longitude: Number(formData.longitude) || 0,
        };

        try {
            if (editingWarehouse) {
                await editWarehouse({ id: editingWarehouse._id, data: parsedData });
                toast.success("Warehouse updated successfully!");
            } else {
                await addWarehouse(parsedData);
                toast.success("Warehouse created successfully!");
            }
            setIsModalOpen(false);
        } catch (err) {
            toast.error(err || "An error occurred.");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this warehouse? All resources inside this warehouse should be relocated first!")) {
            try {
                await deleteWarehouse(id);
                toast.success("Warehouse deleted successfully!");
            } catch (err) {
                toast.error(err || "Failed to delete warehouse.");
            }
        }
    };

    const handleViewOnMap = (wh) => {
        if (!wh.latitude || !wh.longitude) {
            toast.underline("Warehouse position coords not loaded.");
            return;
        }
        setMapFlyToTarget([wh.latitude, wh.longitude]);
        setLayers((prev) => ({ ...prev, warehouses: true }));
        toast.success(`Positioned map view over ${wh.warehouseName}.`);
        navigate("/map");
    };

    const handleExportCSV = () => {
        if (filteredWarehouses.length === 0) {
            toast.error("No store depots found to export.");
            return;
        }

        const headers = ["Warehouse Name", "District", "Address", "Manager", "Hotline Phone", "Capacity (Units)", "Current Utilization %", "Latitude", "Longitude"];
        const rows = filteredWarehouses.map(w => [
            `"${w.warehouseName.replace(/"/g, '""')}"`,
            w.district,
            `"${w.address.replace(/"/g, '""')}"`,
            `"${w.manager.replace(/"/g, '""')}"`,
            w.phone,
            w.storageCapacity,
            w.currentUtilization || 0,
            w.latitude,
            w.longitude
        ]);

        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `warehouses_distribution_report_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("CSV record exported.");
    };

    const handleExportPDF = () => {
        if (filteredWarehouses.length === 0) {
            toast.error("No store depots found to export.");
            return;
        }

        const printWindow = window.open("", "_blank");
        const htmlDef = `
            <html>
                <head>
                    <title>Relief Supplies Warehouses Directory - ${new Date().toLocaleDateString()}</title>
                    <style>
                        body { font-family: sans-serif; padding: 30px; color: #1e293b; }
                        h1 { font-size: 24px; margin-bottom: 4px; color: #0f172a; }
                        p { font-size: 13px; color: #64748b; margin-top: 0; }
                        table { width: 100%; border-collapse: collapse; margin-top: 25px; }
                        th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; font-size: 11px; }
                        th { background-color: #f8fafc; font-weight: 600; color: #475569; }
                        .badge { padding: 3px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <h1>Kerala Disaster Intelligence Platform</h1>
                    <p>Relief Materials & Storage Depot Catalog - Generated ${new Date().toLocaleString()}</p>
                    <table>
                        <thead>
                            <tr>
                                <th>Warehouse Hub Name</th>
                                <th>District</th>
                                <th>Address</th>
                                <th>Hub Manager</th>
                                <th>Hotline</th>
                                <th>Max Capacity</th>
                                <th>Utilization</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredWarehouses.map(w => `
                                <tr>
                                    <td><strong>${w.warehouseName}</strong></td>
                                    <td>${w.district}</td>
                                    <td>${w.address}</td>
                                    <td>${w.manager}</td>
                                    <td>${w.phone}</td>
                                    <td>${w.storageCapacity} units</td>
                                    <td>${w.currentUtilization || 0}%</td>
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
        toast.success("PDF catalog generated.");
    };

    return (
        <MainLayout>
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <BackButton />
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                            <Building2 className="h-8 w-8 text-blue-650" />
                            Warehouse & Storage Hubs
                        </h1>
                        <p className="text-slate-500 mt-1">
                            Monitor storage capacities, utilization rates, resource counts and contact hubs.
                        </p>
                    </div>
                    {isAdmin && (
                        <button
                            onClick={handleOpenAddModal}
                            className="inline-flex items-center gap-2 bg-blue-650 hover:bg-indigo-700 text-white font-semibold px-4.5 py-2.5 rounded-xl shadow-lg transition-all hover:scale-[1.02] cursor-pointer"
                        >
                            <Plus className="h-5 w-5" />
                            Establish Storage Hub
                        </button>
                    )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8 font-semibold">
                    <div className="bg-white rounded-3xl p-5 border border-slate-205 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                            <Building2 className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Hubs</p>
                            <h3 className="text-2xl font-bold text-slate-800">{stats.count}</h3>
                        </div>
                    </div>
                    <div className="bg-white rounded-3xl p-5 border border-slate-205 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-cyan-50 text-cyan-600 rounded-2xl">
                            <Cpu className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Items Stored</p>
                            <h3 className="text-2xl font-bold text-slate-800">{stats.totalResources.toLocaleString()}</h3>
                        </div>
                    </div>
                    <div className="bg-white rounded-3xl p-5 border border-slate-205 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                            <Building2 className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Capacity</p>
                            <h3 className="text-2xl font-bold text-slate-800">{stats.totalCapacity.toLocaleString()}</h3>
                        </div>
                    </div>
                    <div className="bg-white rounded-3xl p-5 border border-slate-205 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                            <Cpu className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Avg Occupied Space</p>
                            <h3 className="text-2xl font-bold text-slate-800">{stats.avgUtilization}%</h3>
                        </div>
                    </div>
                </div>

                {/* Filters Panel */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search Hub name, manager..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 border border-slate-250 rounded-2xl text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-xs"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
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
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-205 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer"
                        >
                            <FileText className="h-4 w-4" />
                            PDF Directory
                        </button>

                        <select
                            value={selectedDistrict}
                            onChange={(e) => setSelectedDistrict(e.target.value)}
                            className="px-4 py-2.5 border border-slate-205 rounded-xl text-slate-705 text-xs font-semibold focus:outline-none cursor-pointer"
                        >
                            <option value="All Districts">All Districts</option>
                            {districts.map(dst => <option key={dst} value={dst}>{dst}</option>)}
                        </select>
                    </div>
                </div>

                {/* Grid Table */}
                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <span className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-indigo-650"></span>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 text-red-700 border border-red-200 rounded-3xl p-5 text-center font-medium">
                        Failed to load warehouses: {error}
                    </div>
                ) : filteredWarehouses.length === 0 ? (
                    <div className="bg-white border rounded-3xl p-12 text-center text-slate-400 font-medium">
                        No storage warehouses located.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
                        {filteredWarehouses.map(wh => {
                            const util = wh.currentUtilization || 0;
                            let utilColor = "bg-emerald-500";
                            if (util > 80) utilColor = "bg-rose-500";
                            else if (util > 50) utilColor = "bg-amber-500";

                            return (
                                <div key={wh._id} className="bg-white rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between hover:shadow-md hover:border-slate-350 transition-all hover:scale-[1.01]">
                                    <div className="p-6 space-y-4">
                                        <div>
                                            <h3 className="font-extrabold text-slate-800 text-lg leading-tight truncate">{wh.warehouseName}</h3>
                                            <span className="inline-block bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded text-[10px] uppercase font-bold mt-1.5 tracking-wide">
                                                District: {wh.district}
                                            </span>
                                        </div>

                                        {/* utilization block */}
                                        <div className="space-y-1.5 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div className="flex justify-between text-xs font-bold text-slate-550">
                                                <span>Space Occupied</span>
                                                <span className="font-bold text-slate-705">{util}%</span>
                                            </div>
                                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full transition-all duration-300 ${utilColor}`} style={{ width: `${util}%` }}></div>
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-450 leading-tight pt-1">
                                                Capacity Limit: <span className="font-bold text-slate-700">{wh.storageCapacity} units</span> ({wh.resourceCount || 0} resource types)
                                            </p>
                                        </div>

                                        {/* contact options */}
                                        <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                                            <p className="flex items-center gap-2 text-slate-600">
                                                <MapPin className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                                                <span className="truncate text-slate-800 font-semibold">{wh.address}</span>
                                            </p>
                                            <p className="flex items-center gap-2 text-slate-600 font-semibold">
                                                <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                <span className="text-slate-400 w-16">Manager:</span>
                                                <span className="text-slate-800 font-bold">{wh.manager}</span>
                                            </p>
                                            <p className="flex items-center gap-2 text-indigo-600 font-semibold">
                                                <Phone className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                                                <span className="text-slate-400 w-16">Call Hotline:</span>
                                                <a href={`tel:${wh.phone}`} className="hover:underline">{wh.phone}</a>
                                            </p>
                                        </div>
                                    </div>

                                    {/* actions */}
                                    <div className="border-t border-slate-100 px-6 py-4 bg-slate-55 flex justify-between items-center text-xs">
                                        <button
                                            onClick={() => handleViewOnMap(wh)}
                                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold transition shadow-sm cursor-pointer border border-blue-100"
                                        >
                                            <Map className="h-3.5 w-3.5" />
                                            Locate Hub
                                        </button>

                                        {isAdmin && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleOpenEditModal(wh)}
                                                    className="px-2.5 py-2 border border-slate-205 hover:bg-white text-slate-650 rounded-xl font-bold transition cursor-pointer"
                                                >
                                                    Update
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(wh._id)}
                                                    className="px-2.5 py-2 hover:bg-rose-50 border border-transparent text-rose-600 rounded-xl font-bold transition cursor-pointer"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Add/Edit Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl flex flex-col overflow-hidden max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
                            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                                <h3 className="font-bold text-lg text-slate-900">
                                    {editingWarehouse ? "Edit Storage Hub" : "Establish Storage Hub"}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xl leading-none">×</button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="col-span-full space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Warehouse Name *</label>
                                        <input
                                            type="text"
                                            name="warehouseName"
                                            required
                                            value={formData.warehouseName}
                                            onChange={handleInputChange}
                                            placeholder="e.g. Kozhikode Central Depot"
                                            className="w-full px-3 py-2 border rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                        />
                                    </div>

                                    <div className="col-span-full space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Address *</label>
                                        <input
                                            type="text"
                                            name="address"
                                            required
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            placeholder="e.g. Bypass Road, Near Fire Station"
                                            className="w-full px-3 py-2 border rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">District *</label>
                                        <select
                                            name="district"
                                            value={formData.district}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border rounded-xl text-sm font-semibold focus:outline-none cursor-pointer"
                                        >
                                            {districts.map(dst => <option key={dst} value={dst}>{dst}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Capacity (Limit Units) *</label>
                                        <input
                                            type="number"
                                            name="storageCapacity"
                                            required
                                            min="1"
                                            value={formData.storageCapacity}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border rounded-xl text-sm font-semibold"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Manager Name *</label>
                                        <input
                                            type="text"
                                            name="manager"
                                            required
                                            value={formData.manager}
                                            onChange={handleInputChange}
                                            placeholder="e.g. Officer Joseph"
                                            className="w-full px-3 py-2 border rounded-xl text-sm font-semibold"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Phone / Hotline *</label>
                                        <input
                                            type="text"
                                            name="phone"
                                            required
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            placeholder="e.g. +91 9447012345"
                                            className="w-full px-3 py-2 border rounded-xl text-sm font-semibold"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Latitude</label>
                                        <input
                                            type="text"
                                            name="latitude"
                                            value={formData.latitude}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border rounded-xl text-sm font-semibold"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Longitude</label>
                                        <input
                                            type="text"
                                            name="longitude"
                                            value={formData.longitude}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border rounded-xl text-sm font-semibold"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t flex justify-end gap-3 mt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 border rounded-xl font-bold text-slate-655 hover:bg-slate-50 transition cursor-pointer text-xs"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-705 text-white font-bold rounded-xl shadow-md transition cursor-pointer text-xs"
                                    >
                                        {editingWarehouse ? "Save Changes" : "Create Hub"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
};

export default WarehousePage;
