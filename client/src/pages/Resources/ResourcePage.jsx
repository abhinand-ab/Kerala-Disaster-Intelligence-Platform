import { useState, useMemo } from "react";
import useResources from "../../hooks/useResources";
import useWarehouses from "../../hooks/useWarehouses";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-hot-toast";
import BackButton from "../../components/common/BackButton";
import MainLayout from "../../components/layout/MainLayout";
import Header from "../../components/layout/Header";
import {
    Plus, Search, Filter, AlertTriangle, Package, MapPin,
    Layers, Edit, Trash2, CheckCircle, HelpCircle, ArrowUpDown,
    Download, FileText, Minus
} from "lucide-react";

const ResourcePage = () => {
    const { resources, isLoading, error, addResource, editResource, deleteResource } = useResources();
    const { warehouses } = useWarehouses();
    const { user } = useAuth();
    const isAdmin = user?.role?.toLowerCase() === "admin";

    // Search & Filtering states
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("");
    const [selectedDistrict, setSelectedDistrict] = useState("");

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingResource, setEditingResource] = useState(null);
    const [formData, setFormData] = useState({
        resourceName: "",
        category: "Food",
        quantity: "",
        unit: "",
        warehouse: "",
        district: "",
        latitude: "",
        longitude: "",
        minimumStock: "10",
        expiryDate: "",
        supplier: "",
    });

    // Get unique districts for filter
    const districts = useMemo(() => {
        const unique = new Set(resources.map(r => r.district).filter(Boolean));
        return Array.from(unique).sort();
    }, [resources]);

    // Filtered resources
    const filteredResources = useMemo(() => {
        return resources.filter(res => {
            const matchesSearch = res.resourceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (res.supplier && res.supplier.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesCategory = selectedCategory ? res.category === selectedCategory : true;
            const matchesStatus = selectedStatus ? res.status === selectedStatus : true;
            const matchesDistrict = selectedDistrict ? res.district === selectedDistrict : true;
            return matchesSearch && matchesCategory && matchesStatus && matchesDistrict;
        });
    }, [resources, searchQuery, selectedCategory, selectedStatus, selectedDistrict]);

    // Stats calculations
    const stats = useMemo(() => {
        const totalCount = resources.length;
        const totalQuantity = resources.reduce((sum, r) => sum + r.quantity, 0);
        const lowStockCount = resources.filter(r => r.status === "Low Stock").length;
        const outOfStockCount = resources.filter(r => r.status === "Out of Stock").length;
        return { totalCount, totalQuantity, lowStockCount, outOfStockCount };
    }, [resources]);

    const categories = ["Food", "Water", "Medical", "Clothing", "Bedding", "Tools", "Other"];

    const handleOpenAddModal = () => {
        setEditingResource(null);
        setFormData({
            resourceName: "",
            category: "Food",
            quantity: "0",
            unit: "units",
            warehouse: warehouses[0]?._id || "",
            district: "Thiruvananthapuram",
            latitude: "8.5241",
            longitude: "76.9366",
            minimumStock: "10",
            expiryDate: "",
            supplier: "",
        });
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (resource) => {
        setEditingResource(resource);
        setFormData({
            resourceName: resource.resourceName,
            category: resource.category,
            quantity: resource.quantity.toString(),
            unit: resource.unit,
            warehouse: resource.warehouse?._id || resource.warehouse || "",
            district: resource.district,
            latitude: resource.latitude.toString(),
            longitude: resource.longitude.toString(),
            minimumStock: resource.minimumStock ? resource.minimumStock.toString() : "10",
            expiryDate: resource.expiryDate ? new Date(resource.expiryDate).toISOString().split('T')[0] : "",
            supplier: resource.supplier || "",
        });
        setIsModalOpen(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleWarehouseChange = (e) => {
        const warehouseId = e.target.value;
        const selectedWh = warehouses.find(w => w._id === warehouseId);
        setFormData(prev => ({
            ...prev,
            warehouse: warehouseId,
            district: selectedWh ? selectedWh.district : prev.district,
            latitude: selectedWh ? selectedWh.latitude.toString() : prev.latitude,
            longitude: selectedWh ? selectedWh.longitude.toString() : prev.longitude,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.resourceName || !formData.warehouse || !formData.quantity || !formData.unit) {
            toast.error("Please fill in all required fields.");
            return;
        }

        const parsedData = {
            ...formData,
            quantity: Number(formData.quantity) || 0,
            latitude: Number(formData.latitude) || 0,
            longitude: Number(formData.longitude) || 0,
            minimumStock: Number(formData.minimumStock) || 0,
            expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : null,
        };

        try {
            if (editingResource) {
                await editResource({ id: editingResource._id, data: parsedData });
                toast.success("Resource updated successfully!");
            } else {
                await addResource(parsedData);
                toast.success("Resource added successfully!");
            }
            setIsModalOpen(false);
        } catch (err) {
            toast.error(err || "An error occurred.");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this resource?")) {
            try {
                await deleteResource(id);
                toast.success("Resource deleted successfully!");
            } catch (err) {
                toast.error(err || "Failed to delete resource.");
            }
        }
    };

    const handleAdjustQuantity = async (res, amount) => {
        const newQty = Math.max(0, res.quantity + amount);
        try {
            await editResource({
                id: res._id,
                data: {
                    ...res,
                    warehouse: res.warehouse?._id || res.warehouse,
                    quantity: newQty
                }
            });
            toast.success(`Updated ${res.resourceName} quantity to ${newQty}.`);
        } catch (err) {
            toast.error("Failed to adjust inventory: " + (err || "Unknown error"));
        }
    };

    const handleExportCSV = () => {
        if (filteredResources.length === 0) {
            toast.error("No relief resources found to export.");
            return;
        }

        const headers = ["Resource Name", "Category", "Quantity", "Unit", "Warehouse", "District", "Status", "Min Stock Alert", "Supplier", "Expiry Date"];
        const rows = filteredResources.map(r => [
            `"${r.resourceName.replace(/"/g, '""')}"`,
            r.category,
            r.quantity,
            r.unit,
            `"${(r.warehouse?.warehouseName || "N/A").replace(/"/g, '""')}"`,
            r.district,
            r.status,
            r.minimumStock,
            `"${(r.supplier || "--").replace(/"/g, '""')}"`,
            r.expiryDate ? new Date(r.expiryDate).toLocaleDateString() : "N/A"
        ]);

        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `resources_inventory_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("CSV stock log exported.");
    };

    const handleExportPDF = () => {
        if (filteredResources.length === 0) {
            toast.error("No relief resources found to export.");
            return;
        }

        const printWindow = window.open("", "_blank");
        const htmlDef = `
            <html>
                <head>
                    <title>Relief Supplies Inventory Report - ${new Date().toLocaleDateString()}</title>
                    <style>
                        body { font-family: sans-serif; padding: 30px; color: #1e293b; }
                        h1 { font-size: 24px; margin-bottom: 4px; color: #0f172a; }
                        p { font-size: 13px; color: #64748b; margin-top: 0; }
                        table { width: 100%; border-collapse: collapse; margin-top: 25px; }
                        th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; font-size: 11px; }
                        th { background-color: #f8fafc; font-weight: 600; color: #475569; }
                        .badge { padding: 3px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; }
                        .badge-Available { background-color: #d1fae5; color: #065f46; }
                        .badge-LowStock { background-color: #fef3c7; color: #92400e; }
                        .badge-OutOfStock { background-color: #fee2e2; color: #991b1b; }
                    </style>
                </head>
                <body>
                    <h1>Kerala Disaster Intelligence Platform</h1>
                    <p>Relief Materials & Resource Inventory Log - Generated ${new Date().toLocaleString()}</p>
                    <table>
                        <thead>
                            <tr>
                                <th>Item Name</th>
                                <th>Category</th>
                                <th>Quantity</th>
                                <th>Unit</th>
                                <th>Warehouse</th>
                                <th>District</th>
                                <th>Status</th>
                                <th>Supplier</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredResources.map(r => {
            const stK = r.status.replace(/\s+/g, '');
            return `
                                    <tr>
                                        <td><strong>${r.resourceName}</strong></td>
                                        <td>${r.category}</td>
                                        <td>${r.quantity}</td>
                                        <td>${r.unit}</td>
                                        <td>${r.warehouse?.warehouseName || "N/A"}</td>
                                        <td>${r.district}</td>
                                        <td><span class="badge badge-${stK}">${r.status}</span></td>
                                        <td>${r.supplier || "--"}</td>
                                    </tr>
                                `;
        }).join("")}
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
        toast.success("PDF inventory report generated.");
    };

    return (
        <MainLayout>
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <BackButton />
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                            <Package className="h-8 w-8 text-blue-650" />
                            Relief Resource Depot
                        </h1>
                        <p className="text-slate-500 mt-1">
                            Monitor inventory stock levels, categories, and warehouses across districts.
                        </p>
                    </div>
                    {isAdmin && (
                        <button
                            onClick={handleOpenAddModal}
                            className="inline-flex items-center gap-2 bg-blue-650 hover:bg-blue-700 text-white font-semibold px-4.5 py-2.5 rounded-xl shadow-lg transition-all hover:scale-[1.02] cursor-pointer"
                        >
                            <Plus className="h-5 w-5" />
                            Register Supply Resource
                        </button>
                    )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8 font-semibold">
                    <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-cyan-50 text-cyan-600 rounded-2xl">
                            <Package className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-405 font-bold uppercase tracking-wider">Resource Types</p>
                            <h3 className="text-2xl font-bold text-slate-800">{stats.totalCount}</h3>
                        </div>
                    </div>
                    <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl">
                            <Layers className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-405 font-bold uppercase tracking-wider">Total Quantity</p>
                            <h3 className="text-2xl font-bold text-slate-800">{stats.totalQuantity.toLocaleString()}</h3>
                        </div>
                    </div>
                    <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                            <AlertTriangle className="h-6 w-6 animate-pulse" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-405 font-bold uppercase tracking-wider">Low Stock Warnings</p>
                            <h3 className="text-2xl font-bold text-slate-805">{stats.lowStockCount}</h3>
                        </div>
                    </div>
                    <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-405 font-bold uppercase tracking-wider">Out of Stock</p>
                            <h3 className="text-2xl font-bold text-slate-805">{stats.outOfStockCount}</h3>
                        </div>
                    </div>
                </div>

                {/* Filters Panel */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search resources, suppliers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 border border-slate-250 rounded-2xl text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-550/25 focus:border-cyan-500 transition-all font-bold text-xs"
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
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-55 cursor-pointer"
                        >
                            <FileText className="h-4 w-4" />
                            PDF Report
                        </button>

                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs font-semibold text-slate-705 focus:outline-none cursor-pointer"
                        >
                            <option value="">All Categories</option>
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>

                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="px-3 py-2 border border-slate-205 bg-slate-50 rounded-xl text-xs font-semibold text-slate-705 focus:outline-none cursor-pointer"
                        >
                            <option value="">All Statuses</option>
                            <option value="Available">Available</option>
                            <option value="Low Stock">Low Stock</option>
                            <option value="Out of Stock">Out of Stock</option>
                        </select>

                        <select
                            value={selectedDistrict}
                            onChange={(e) => setSelectedDistrict(e.target.value)}
                            className="px-3 py-2 border border-slate-205 bg-slate-50 rounded-xl text-xs font-semibold text-slate-705 focus:outline-none cursor-pointer"
                        >
                            <option value="">All Districts</option>
                            {districts.map(dst => <option key={dst} value={dst}>{dst}</option>)}
                        </select>
                    </div>
                </div>

                {/* Resource Cards/Grid */}
                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <span className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-cyan-600"></span>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 text-red-700 border border-red-200 rounded-3xl p-5 text-center font-medium">
                        Failed to load resources: {error.toString()}
                    </div>
                ) : filteredResources.length === 0 ? (
                    <div className="bg-white border rounded-3xl p-12 text-center text-slate-400 font-medium">
                        No resources matched your search filter criteria.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
                        {filteredResources.map((res) => {
                            const isLow = res.status === "Low Stock";
                            const isOut = res.status === "Out of Stock";

                            return (
                                <div
                                    key={res._id}
                                    className={`bg-white rounded-3xl border transition-all duration-300 shadow-sm relative overflow-hidden flex flex-col justify-between hover:shadow-md hover:border-slate-300 ${isOut ? "border-rose-200" : isLow ? "border-amber-250" : "border-slate-200"
                                        }`}
                                >
                                    {/* Top Badge Glow */}
                                    {isOut && <div className="absolute top-0 inset-x-0 h-1.5 bg-rose-500"></div>}
                                    {isLow && <div className="absolute top-0 inset-x-0 h-1.5 bg-amber-500"></div>}

                                    <div className="p-6 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-slate-800 text-lg leading-tight">{res.resourceName}</h3>
                                                <span className="inline-block bg-slate-105 text-slate-600 px-2.5 py-0.5 rounded text-[10px] uppercase font-bold mt-1.5 tracking-wide">
                                                    {res.category}
                                                </span>
                                            </div>
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-bold ${isOut ? "bg-rose-50 text-rose-700 border border-rose-100" :
                                                isLow ? "bg-amber-50 text-amber-700 border border-amber-100" :
                                                    "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                                }`}>
                                                {res.status}
                                            </span>
                                        </div>

                                        {/* Stock Gauge */}
                                        <div className="space-y-1.5 bg-slate-50 border border-slate-100 rounded-2xl p-4">
                                            <div className="flex justify-between text-xs font-bold text-slate-500">
                                                <span>Live Quantity Stock</span>
                                                <span className="font-semibold text-slate-400">Alert Min: {res.minimumStock} {res.unit}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-3xl font-extrabold text-slate-900">{res.quantity}</span>
                                                    <span className="text-slate-500 text-xs font-bold">{res.unit}</span>
                                                </div>

                                                {/* Inventory Quick Adjust Button Controllers */}
                                                {isAdmin && (
                                                    <div className="flex items-center border border-slate-200 rounded-xl bg-white p-0.5 shadow-sm">
                                                        <button
                                                            onClick={() => handleAdjustQuantity(res, -5)}
                                                            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg text-xs font-bold"
                                                            title="Subtract 5 units"
                                                        >
                                                            -5
                                                        </button>
                                                        <span className="w-px h-4 bg-slate-200 mx-1"></span>
                                                        <button
                                                            onClick={() => handleAdjustQuantity(res, 5)}
                                                            className="p-1.5 text-blue-650 hover:bg-blue-50 rounded-lg text-xs font-bold"
                                                            title="Add 5 units"
                                                        >
                                                            +5
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            {/* Simple progress bar bar */}
                                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-300 ${isOut ? "w-0" :
                                                        isLow ? "bg-amber-500" : "bg-emerald-500"
                                                        }`}
                                                    style={{
                                                        width: `${Math.min(100, Math.round((res.quantity / (res.minimumStock * 2 || 20)) * 100))}%`
                                                    }}
                                                ></div>
                                            </div>
                                        </div>

                                        {/* Details */}
                                        <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                                            <p className="flex items-center gap-1.5 text-slate-600">
                                                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                <span className="text-slate-400 font-semibold w-20">Warehouse:</span>
                                                <span className="font-bold text-slate-800 truncate">{res.warehouse?.warehouseName || "N/A"}</span>
                                            </p>
                                            <p className="flex items-center gap-1.5 text-slate-600">
                                                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                <span className="text-slate-400 font-semibold w-20">District:</span>
                                                <span className="font-bold text-slate-800">{res.district}</span>
                                            </p>
                                            {res.supplier && (
                                                <p className="flex items-center gap-1.5 text-slate-600">
                                                    <HelpCircle className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                    <span className="text-slate-400 font-semibold w-20">Supplier:</span>
                                                    <span className="font-bold text-slate-800 truncate">{res.supplier}</span>
                                                </p>
                                            )}
                                            {res.expiryDate && (
                                                <p className="flex items-center gap-1.5 text-slate-605">
                                                    <HelpCircle className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                    <span className="text-slate-400 font-semibold w-20">Expires:</span>
                                                    <span className="font-bold text-slate-805">
                                                        {new Date(res.expiryDate).toLocaleDateString()}
                                                    </span>
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    {isAdmin && (
                                        <div className="border-t border-slate-100 px-5 py-3.5 bg-slate-55 flex justify-end gap-2.5">
                                            <button
                                                onClick={() => handleOpenEditModal(res)}
                                                className="inline-flex items-center gap-1.5 py-1.5 px-3 border border-slate-205 hover:border-slate-350 hover:bg-white text-slate-600 hover:text-slate-805 rounded-xl text-xs font-bold transition cursor-pointer"
                                            >
                                                <Edit className="h-3.5 w-3.5" />
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(res._id)}
                                                className="inline-flex items-center gap-1.5 py-1.5 px-3 border border-transparent hover:bg-rose-50 text-rose-600 hover:text-rose-750 rounded-xl text-xs font-bold transition cursor-pointer"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                                Delete
                                            </button>
                                        </div>
                                    )}
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
                                    {editingResource ? "Edit Resource" : "Register Resource"}
                                </h3>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="text-slate-400 hover:text-slate-600 font-bold text-xl leading-none"
                                >
                                    ×
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Resource Name *</label>
                                        <input
                                            type="text"
                                            name="resourceName"
                                            required
                                            value={formData.resourceName}
                                            onChange={handleInputChange}
                                            placeholder="e.g. Drinking Water Bottle"
                                            className="w-full px-3 py-2 border rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Category *</label>
                                        <select
                                            name="category"
                                            value={formData.category}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 cursor-pointer"
                                        >
                                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Stock Quantity *</label>
                                        <input
                                            type="number"
                                            name="quantity"
                                            required
                                            min="0"
                                            value={formData.quantity}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-405 uppercase">Unit *</label>
                                        <input
                                            type="text"
                                            name="unit"
                                            required
                                            value={formData.unit}
                                            onChange={handleInputChange}
                                            placeholder="e.g. Liters, kg, boxes, cases"
                                            className="w-full px-3 py-2 border rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                                        />
                                    </div>

                                    <div className="col-span-full space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Storage Warehouse *</label>
                                        <select
                                            name="warehouse"
                                            required
                                            value={formData.warehouse}
                                            onChange={handleWarehouseChange}
                                            className="w-full px-3 py-2 border rounded-xl text-sm font-semibold focus:outline-none cursor-pointer"
                                        >
                                            <option value="">Select Warehouse</option>
                                            {warehouses.map(w => (
                                                <option key={w._id} value={w._id}>
                                                    {w.warehouseName} ({w.district})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">District *</label>
                                        <input
                                            type="text"
                                            name="district"
                                            required
                                            disabled
                                            value={formData.district}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border rounded-xl bg-slate-50 text-sm font-semibold"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Alert Threshold (Minimum Stock)</label>
                                        <input
                                            type="number"
                                            name="minimumStock"
                                            min="0"
                                            value={formData.minimumStock}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border rounded-xl text-sm font-semibold"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Latitude</label>
                                        <input
                                            type="text"
                                            name="latitude"
                                            disabled
                                            value={formData.latitude}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border rounded-xl bg-slate-50 text-sm font-semibold"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Longitude</label>
                                        <input
                                            type="text"
                                            name="longitude"
                                            disabled
                                            value={formData.longitude}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border rounded-xl bg-slate-50 text-sm font-semibold"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Expiration Date (Optional)</label>
                                        <input
                                            type="date"
                                            name="expiryDate"
                                            value={formData.expiryDate}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border rounded-xl text-sm font-semibold cursor-pointer"
                                        />
                                    </div>

                                    <div className="space-y-1 col-span-full">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Supplier / Vendor</label>
                                        <input
                                            type="text"
                                            name="supplier"
                                            value={formData.supplier}
                                            onChange={handleInputChange}
                                            placeholder="e.g. KSDMA Central Depot"
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
                                        className="px-4 py-2 bg-blue-650 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition cursor-pointer text-xs"
                                    >
                                        {editingResource ? "Save Changes" : "Create Resource"}
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

export default ResourcePage;
