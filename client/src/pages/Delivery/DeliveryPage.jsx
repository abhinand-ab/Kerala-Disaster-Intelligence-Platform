import { useState, useMemo } from "react";
import useDeliveries from "../../hooks/useDeliveries";
import useWarehouses from "../../hooks/useWarehouses";
import useShelters from "../../hooks/useShelters";
import useVolunteers from "../../hooks/useVolunteers";
import useResources from "../../hooks/useResources";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-hot-toast";
import {
    Truck, Plus, Search, Calendar, MapPin, ClipboardList,
    Edit, CheckCircle, Clock, ChevronRight, XCircle, Trash2, ArrowRightCircle
} from "lucide-react";

const DeliveryPage = () => {
    const { deliveries, isLoading, error, addDelivery, editDelivery, deleteDelivery } = useDeliveries();
    const { warehouses } = useWarehouses();
    const { shelters } = useShelters();
    const { volunteers } = useVolunteers();
    const { resources } = useResources();
    const { user } = useAuth();

    const isAdmin = user?.role?.toLowerCase() === "admin";

    // Filtering and tab
    const [activeTab, setActiveTab] = useState("all"); // all, Pending, In Transit/Dispatched, Completed
    const [searchQuery, setSearchQuery] = useState("");

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDelivery, setEditingDelivery] = useState(null);
    const [formData, setFormData] = useState({
        destinationShelter: "",
        warehouse: "",
        assignedVehicle: "",
        assignedDriver: "",
        assignedVolunteer: "",
        estimatedArrival: "",
        missionStatus: "Pending",
        liveGPS: { latitude: 8.5241, longitude: 76.9366 },
    });

    const [dispatchedItems, setDispatchedItems] = useState([
        { resource: "", quantity: 1 }
    ]);

    // Filter resources depending on chosen warehouse
    const warehouseResources = useMemo(() => {
        if (!formData.warehouse) return [];
        return resources.filter(res => {
            const resWhId = res.warehouse?._id || res.warehouse;
            return resWhId?.toString() === formData.warehouse.toString();
        });
    }, [resources, formData.warehouse]);

    // Filtered deliveries list
    const filteredDeliveries = useMemo(() => {
        return deliveries.filter(del => {
            const matchesSearch =
                (del.assignedDriver && del.assignedDriver.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (del.assignedVehicle && del.assignedVehicle.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (del.destinationShelter?.name && del.destinationShelter.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (del.warehouse?.warehouseName && del.warehouse.warehouseName.toLowerCase().includes(searchQuery.toLowerCase()));

            if (activeTab === "all") return matchesSearch;
            if (activeTab === "Pending") return matchesSearch && del.missionStatus === "Pending";
            if (activeTab === "Active") return matchesSearch && (del.missionStatus === "Dispatched" || del.missionStatus === "In Transit");
            if (activeTab === "Completed") return matchesSearch && del.missionStatus === "Completed";
            return matchesSearch;
        });
    }, [deliveries, activeTab, searchQuery]);

    // Dispatch stats
    const stats = useMemo(() => {
        const total = deliveries.length;
        const pending = deliveries.filter(d => d.missionStatus === "Pending").length;
        const active = deliveries.filter(d => d.missionStatus === "Dispatched" || d.missionStatus === "In Transit").length;
        const completed = deliveries.filter(d => d.missionStatus === "Completed").length;
        return { total, pending, active, completed };
    }, [deliveries]);

    const handleOpenAddModal = () => {
        setEditingDelivery(null);
        setFormData({
            destinationShelter: shelters[0]?._id || "",
            warehouse: warehouses[0]?._id || "",
            assignedVehicle: "",
            assignedDriver: "",
            assignedVolunteer: "",
            estimatedArrival: "1 hour",
            missionStatus: "Pending",
            liveGPS: warehouses[0] ?
                { latitude: warehouses[0].latitude, longitude: warehouses[0].longitude } :
                { latitude: 8.5241, longitude: 76.9366 },
        });
        setDispatchedItems([{ resource: "", quantity: 1 }]);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (del) => {
        setEditingDelivery(del);
        setFormData({
            destinationShelter: del.destinationShelter?._id || del.destinationShelter || "",
            warehouse: del.warehouse?._id || del.warehouse || "",
            assignedVehicle: del.assignedVehicle,
            assignedDriver: del.assignedDriver,
            assignedVolunteer: del.assignedVolunteer?._id || del.assignedVolunteer || "",
            estimatedArrival: del.estimatedArrival,
            missionStatus: del.missionStatus,
            liveGPS: del.liveGPS || { latitude: 8.5241, longitude: 76.9366 },
        });

        const items = (del.dispatchedResources || []).map(item => ({
            resource: item.resource?._id || item.resource || "",
            quantity: item.quantity,
        }));
        setDispatchedItems(items.length > 0 ? items : [{ resource: "", quantity: 1 }]);
        setIsModalOpen(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleWarehouseChange = (e) => {
        const whId = e.target.value;
        const selectedWh = warehouses.find(w => w._id === whId);
        setFormData(prev => ({
            ...prev,
            warehouse: whId,
            liveGPS: selectedWh ?
                { latitude: selectedWh.latitude, longitude: selectedWh.longitude } :
                prev.liveGPS,
        }));
        // Reset selected dispatched items since they belong to a different warehouse
        setDispatchedItems([{ resource: "", quantity: 1 }]);
    };

    // Dispatched items dynamic array modifiers
    const handleItemChange = (index, field, value) => {
        const newItems = [...dispatchedItems];
        newItems[index][field] = value;
        setDispatchedItems(newItems);
    };

    const addRow = () => {
        setDispatchedItems(prev => [...prev, { resource: "", quantity: 1 }]);
    };

    const removeRow = (index) => {
        if (dispatchedItems.length === 1) return;
        setDispatchedItems(prev => prev.filter((_, idx) => idx !== index));
    };

    const updateStatus = async (deliveryId, nextStatus) => {
        try {
            await editDelivery({ id: deliveryId, data: { missionStatus: nextStatus } });
            toast.success(`Mission status updated to: ${nextStatus}`);
        } catch (err) {
            toast.error(err || "Failed to update status.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.destinationShelter || !formData.warehouse || !formData.assignedVehicle || !formData.assignedDriver) {
            toast.error("Please specify destination, warehouse, vehicle, and driver.");
            return;
        }

        // Filter out empty items
        const items = dispatchedItems.filter(item => item.resource && item.quantity > 0);
        if (items.length === 0) {
            toast.error("Please add at least one resource item to dispatch.");
            return;
        }

        // Validate quantities are not exceeding stock limit
        for (const item of items) {
            const resDoc = resources.find(r => r._id === item.resource);
            if (resDoc && resDoc.quantity < item.quantity) {
                toast.error(`Out of stock warning: "${resDoc.resourceName}" only has ${resDoc.quantity} ${resDoc.unit} available.`);
                return;
            }
        }

        const dataToSend = {
            ...formData,
            dispatchedResources: items,
        };

        try {
            if (editingDelivery) {
                await editDelivery({ id: editingDelivery._id, data: dataToSend });
                toast.success("Delivery mission updated successfully!");
            } else {
                await addDelivery(dataToSend);
                toast.success("New delivery mission created!");
            }
            setIsModalOpen(false);
        } catch (err) {
            toast.error(err || "An error occurred.");
        }
    };

    const handleDeleteMission = async (id) => {
        if (window.confirm("Are you sure you want to delete/cancel this delivery mission?")) {
            try {
                await deleteDelivery(id);
                toast.success("Mission deleted successfully.");
            } catch (err) {
                toast.error(err || "Failed to delete.");
            }
        }
    };

    return (
        <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <Truck className="h-8 w-8 text-cyan-600" />
                        Relief Delivery Dashboard
                    </h1>
                    <p className="text-slate-550 mt-1">
                        Coordinate and track active distribution transits from central warehouses to refugee shelters.
                    </p>
                </div>
                {isAdmin && (
                    <button
                        onClick={handleOpenAddModal}
                        className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-705 text-white font-semibold px-4.5 py-2.5 rounded-xl shadow-lg shadow-cyan-600/10 transition-all hover:scale-[1.02] cursor-pointer"
                    >
                        <Plus className="h-5 w-5" />
                        Schedule Delivery Mission
                    </button>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div
                    onClick={() => setActiveTab("all")}
                    className={`rounded-2xl p-5 border cursor-pointer transition-all ${activeTab === "all" ? "bg-cyan-600 text-white border-transparent shadow-md" : "bg-white border-slate-205 text-slate-800 hover:bg-slate-100"
                        }`}
                >
                    <h3 className="text-sm font-semibold uppercase opacity-80">Total Scheduled</h3>
                    <p className="text-2xl font-bold mt-2">{stats.total}</p>
                </div>
                <div
                    onClick={() => setActiveTab("Pending")}
                    className={`rounded-2xl p-5 border cursor-pointer transition-all ${activeTab === "Pending" ? "bg-amber-500 text-white border-transparent shadow-md" : "bg-white border-slate-205 text-slate-800 hover:bg-slate-100"
                        }`}
                >
                    <h3 className="text-sm font-semibold uppercase opacity-80">Awaiting Dispatch</h3>
                    <p className="text-2xl font-bold mt-2">{stats.pending}</p>
                </div>
                <div
                    onClick={() => setActiveTab("Active")}
                    className={`rounded-2xl p-5 border cursor-pointer transition-all ${activeTab === "Active" ? "bg-sky-500 text-white border-transparent shadow-md" : "bg-white border-slate-205 text-slate-800 hover:bg-slate-100"
                        }`}
                >
                    <h3 className="text-sm font-semibold uppercase opacity-80">Active Transits</h3>
                    <p className="text-2xl font-bold mt-2">{stats.active}</p>
                </div>
                <div
                    onClick={() => setActiveTab("Completed")}
                    className={`rounded-2xl p-5 border cursor-pointer transition-all ${activeTab === "Completed" ? "bg-emerald-500 text-white border-transparent shadow-md" : "bg-white border-slate-205 text-slate-850 hover:bg-slate-100"
                        }`}
                >
                    <h3 className="text-sm font-semibold uppercase opacity-80">Completed Arrivals</h3>
                    <p className="text-2xl font-bold mt-2">{stats.completed}</p>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search driver, shelter, vehicle..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-slate-250 rounded-xl text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all font-medium text-sm"
                    />
                </div>
            </div>

            {/* Deliveries display */}
            {isLoading ? (
                <div className="flex justify-center items-center py-20">
                    <span className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-cyan-600"></span>
                </div>
            ) : error ? (
                <div className="bg-red-50 text-red-700 border border-red-200 rounded-2xl p-5 text-center font-medium">
                    Failed to load deliveries: {error}
                </div>
            ) : filteredDeliveries.length === 0 ? (
                <div className="bg-white border rounded-2xl p-12 text-center text-slate-400 font-medium">
                    No deliveries logged matching this status.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredDeliveries.map(del => {
                        const isPending = del.missionStatus === "Pending";
                        const inTransit = del.missionStatus === "Dispatched" || del.missionStatus === "In Transit";
                        const isCompleted = del.missionStatus === "Completed";
                        const isCancelled = del.missionStatus === "Cancelled";

                        return (
                            <div key={del._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition">
                                {/* Top Section */}
                                <div className="p-5 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                                                MISSION #{del._id.slice(-6).toUpperCase()}
                                            </span>
                                            <h3 className="font-bold text-slate-805 text-lg leading-snug flex items-center gap-1.5 mt-1">
                                                <span>{del.warehouse?.warehouseName || "Warehouse"}</span>
                                                <ChevronRight className="h-4 w-4 text-slate-400" />
                                                <span className="text-cyan-650">{del.destinationShelter?.name || "Shelter"}</span>
                                            </h3>
                                        </div>
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${isCompleted ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                                                isCancelled ? "bg-red-50 text-red-700 border border-red-100" :
                                                    inTransit ? "bg-sky-50 text-sky-700 border border-sky-100 animate-pulse" :
                                                        "bg-amber-50 text-amber-700 border border-amber-100"
                                            }`}>
                                            {del.missionStatus}
                                        </span>
                                    </div>

                                    {/* Progress step visual indicators */}
                                    <div className="flex items-center gap-2 text-xs text-slate-500 py-1">
                                        <span className={`font-bold ${isPending ? "text-amber-600" : "text-slate-400"}`}>Scheduled</span>
                                        <div className="flex-1 h-0.5 bg-slate-200 relative">
                                            <div className={`absolute top-0 left-0 h-full ${!isPending ? "bg-cyan-600 w-full" : "w-0"}`}></div>
                                        </div>
                                        <span className={`font-bold ${inTransit ? "text-sky-600 animate-pulse" : "text-slate-400"}`}>En Route</span>
                                        <div className="flex-1 h-0.5 bg-slate-200 relative">
                                            <div className={`absolute top-0 left-0 h-full ${isCompleted ? "bg-cyan-600 w-full" : "w-0"}`}></div>
                                        </div>
                                        <span className={`font-bold ${isCompleted ? "text-emerald-600" : "text-slate-400"}`}>Arrived</span>
                                    </div>

                                    {/* Cargo detail */}
                                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Dispatched Cargo</h4>
                                        <ul className="space-y-1">
                                            {(del.dispatchedResources || []).map((item, idx) => (
                                                <li key={idx} className="flex justify-between items-center text-xs font-medium text-slate-700">
                                                    <span>{item.resource?.resourceName || "Resource"}</span>
                                                    <span className="font-bold text-slate-900 bg-white px-2 py-0.5 border border-slate-150 rounded">
                                                        {item.quantity} {item.resource?.unit || "units"}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Route details */}
                                    <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                                        <div>
                                            <p className="text-slate-400 font-semibold mb-0.5">Assigned Transit</p>
                                            <p className="font-bold text-slate-800">{del.assignedDriver} ({del.assignedVehicle})</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 font-semibold mb-0.5">Est. Arrival</p>
                                            <p className="font-bold text-slate-800 flex items-center gap-1">
                                                <Clock className="h-3.5 w-3.5 text-cyan-600" />
                                                {del.estimatedArrival || "N/A"}
                                            </p>
                                        </div>
                                        {del.assignedVolunteer && (
                                            <div className="col-span-full">
                                                <p className="text-slate-400 font-semibold mb-0.5">Escort Volunteer</p>
                                                <p className="font-bold text-slate-800">{del.assignedVolunteer?.fullName || "Assigned"}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Control Actions footer */}
                                <div className="border-t border-slate-100 px-5 py-3.5 bg-slate-50/50 flex justify-between items-center">
                                    {isAdmin && !isCompleted && !isCancelled ? (
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-bold text-slate-400 uppercase">Status Action:</span>
                                            {isPending && (
                                                <button
                                                    onClick={() => updateStatus(del._id, "Dispatched")}
                                                    className="inline-flex items-center gap-1 bg-cyan-650 hover:bg-cyan-700 text-white px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer"
                                                >
                                                    <Clock className="h-3 w-3" />
                                                    Dispatch
                                                </button>
                                            )}
                                            {inTransit && (
                                                <button
                                                    onClick={() => updateStatus(del._id, "Completed")}
                                                    className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer"
                                                >
                                                    <CheckCircle className="h-3 w-3" />
                                                    Mark Delivered
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-xs text-slate-400 font-medium">No actions remaining</span>
                                    )}

                                    {isAdmin && (
                                        <div className="flex gap-2">
                                            {!isCompleted && !isCancelled && (
                                                <button
                                                    onClick={() => handleOpenEditModal(del)}
                                                    className="text-slate-400 hover:text-slate-650 p-1 border rounded hover:bg-white"
                                                >
                                                    <Edit className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDeleteMission(del._id)}
                                                className="text-rose-600 hover:text-rose-800 p-1 border rounded hover:bg-rose-50 border-transparent"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal scheduler */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col overflow-hidden max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-900">
                                {editingDelivery ? "Update Delivery Mission" : "Schedule Delivery Mission"}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-650 font-bold text-xl leading-none">×</button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Departing Warehouse *</label>
                                    <select
                                        name="warehouse"
                                        required
                                        value={formData.warehouse}
                                        onChange={handleWarehouseChange}
                                        className="w-full px-3 py-2 border rounded-xl"
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
                                    <label className="text-xs font-bold text-slate-500 uppercase">Destination Shelter *</label>
                                    <select
                                        name="destinationShelter"
                                        required
                                        value={formData.destinationShelter}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border rounded-xl"
                                    >
                                        <option value="">Select Destination Shelter</option>
                                        {shelters.map(s => (
                                            <option key={s._id} value={s._id}>
                                                {s.name} ({s.district})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Assigned Driver *</label>
                                    <input
                                        type="text"
                                        name="assignedDriver"
                                        required
                                        value={formData.assignedDriver}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Anand Kumar"
                                        className="w-full px-3 py-2 border rounded-xl"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Assigned Location Vehicle *</label>
                                    <input
                                        type="text"
                                        name="assignedVehicle"
                                        required
                                        value={formData.assignedVehicle}
                                        onChange={handleInputChange}
                                        placeholder="e.g. KL-01-AB-1234 (KSDMA SUV)"
                                        className="w-full px-3 py-2 border rounded-xl"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Escorted Volunteer (Optional)</label>
                                    <select
                                        name="assignedVolunteer"
                                        value={formData.assignedVolunteer}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border rounded-xl"
                                    >
                                        <option value="">None Assigned</option>
                                        {volunteers.map(v => (
                                            <option key={v._id} value={v._id}>
                                                {v.fullName} ({v.team})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">ETA / Arrival Duration</label>
                                    <input
                                        type="text"
                                        name="estimatedArrival"
                                        value={formData.estimatedArrival}
                                        onChange={handleInputChange}
                                        placeholder="e.g. 45 minutes / 2 hours"
                                        className="w-full px-3 py-2 border rounded-xl"
                                    />
                                </div>

                                <div className="space-y-1 col-span-full">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Mission Startup Status *</label>
                                    <select
                                        name="missionStatus"
                                        value={formData.missionStatus}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border rounded-xl"
                                    >
                                        <option value="Pending">Pending (Logistics Preparation)</option>
                                        <option value="Dispatched">Dispatched (Reduce stock from Warehouse now)</option>
                                    </select>
                                </div>

                                {/* Dispatched item rows */}
                                <div className="col-span-full border-t border-slate-100 pt-4 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-extrabold text-slate-450 uppercase tracking-widest">
                                            Dispatched Cargo Items
                                        </label>
                                        <button
                                            type="button"
                                            onClick={addRow}
                                            className="inline-flex items-center gap-1 text-cyan-600 hover:text-cyan-800 text-xs font-bold cursor-pointer"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                            Add Cargo Type
                                        </button>
                                    </div>

                                    {dispatchedItems.map((item, idx) => {
                                        const currentRes = warehouseResources.find(wr => wr._id === item.resource);

                                        return (
                                            <div key={idx} className="flex gap-2 items-end">
                                                <div className="flex-1 space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Resource Name</label>
                                                    <select
                                                        value={item.resource}
                                                        onChange={(e) => handleItemChange(idx, "resource", e.target.value)}
                                                        className="w-full px-3 py-1.5 border rounded-lg text-sm"
                                                        required
                                                    >
                                                        <option value="">Select Resource</option>
                                                        {warehouseResources.map(r => (
                                                            <option key={r._id} value={r._id}>
                                                                {r.resourceName} (Cat: {r.category} | Avail: {r.quantity} {r.unit})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="w-28 space-y-1 animate-fadeIn">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Quantity</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max={currentRes ? currentRes.quantity : 9999}
                                                        value={item.quantity}
                                                        onChange={(e) => handleItemChange(idx, "quantity", Number(e.target.value))}
                                                        className="w-full px-3 py-1.5 border rounded-lg text-sm text-slate-700"
                                                        required
                                                    />
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => removeRow(idx)}
                                                    disabled={dispatchedItems.length === 1}
                                                    className="px-2 py-2 text-rose-500 hover:bg-rose-50 border rounded-lg border-slate-200 transition disabled:opacity-50 cursor-pointer"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        );
                                    })}
                                    {warehouseResources.length === 0 && formData.warehouse && (
                                        <p className="text-xs text-rose-600 font-medium">
                                            No resources registered in this warehouse yet. Register resources first.
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 border-t flex justify-end gap-3 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 border rounded-xl font-semibold text-slate-650 hover:bg-slate-50 transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-705 text-white font-semibold rounded-xl shadow-md transition cursor-pointer"
                                >
                                    {editingDelivery ? "Update Mission" : "Schedule Mission"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeliveryPage;
