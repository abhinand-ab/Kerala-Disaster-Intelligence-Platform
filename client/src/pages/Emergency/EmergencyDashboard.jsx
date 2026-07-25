import { useState, useMemo } from "react";
import MainLayout from "../../components/layout/MainLayout";
import Header from "../../components/layout/Header";
import Card from "../../components/common/Card";
import StatCard from "../../components/common/StatCard";
import {
    useEmergencyRequests,
    useEmergencyDetail,
    useEmergencyAnalytics,
    useAssignSOS,
    useChangeSOSStatus
} from "../../hooks/useEmergencyRequests";
import {
    ShieldAlert,
    AlertTriangle,
    CheckCircle,
    Clock,
    MapPin,
    Search,
    Filter,
    Truck,
    Building,
    Shield,
    Activity,
    User,
    Phone,
    BookOpen,
    XCircle,
    HelpCircle,
    FileSpreadsheet
} from "lucide-react";
import { toast } from "react-hot-toast";

const EmergencyDashboard = () => {
    // Queries state
    const [searchTerm, setSearchTerm] = useState("");
    const [severityFilter, setSeverityFilter] = useState("");
    const [districtFilter, setDistrictFilter] = useState("");
    const [statusTab, setStatusTab] = useState("Pending");

    // Selected Request for Assignment panel (Suggestions)
    const [selectedRequestId, setSelectedRequestId] = useState(null);

    const filters = useMemo(() => {
        const f = {};
        if (statusTab) f.status = statusTab;
        if (severityFilter) f.severity = severityFilter;
        if (districtFilter) f.district = districtFilter;
        if (searchTerm) f.search = searchTerm;
        return f;
    }, [statusTab, severityFilter, districtFilter, searchTerm]);

    // Fetch Requests & Analytics queries
    const { data: requests = [], isLoading: isListLoading } = useEmergencyRequests(filters, { refetchInterval: 10000 });
    const { data: analyticsData, isLoading: isAnalyticsLoading, refetch: refetchAnalytics } = useEmergencyAnalytics();
    const { data: detailData, isLoading: isDetailLoading } = useEmergencyDetail(selectedRequestId);

    const assignSOSMutation = useAssignSOS();
    const changeStatusMutation = useChangeSOSStatus();

    const handleStatusChange = async (reqId, newStatus) => {
        try {
            await changeStatusMutation.mutateAsync({ id: reqId, status: newStatus });
            refetchAnalytics();
        } catch (e) {
            // Handled in hook
        }
    };

    const handleAssignAsset = async (type, assetId) => {
        if (!selectedRequestId) return;
        try {
            const assignments = {};
            if (type === "team") assignments.teamId = assetId;
            if (type === "vehicle") assignments.vehicleId = assetId;
            if (type === "shelter") assignments.shelterId = assetId;

            await assignSOSMutation.mutateAsync({ id: selectedRequestId, assignments });
            refetchAnalytics();
        } catch (e) {
            // Handled in hook
        }
    };

    // Extract analytics stats (Step 12 & 13)
    const widgets = analyticsData?.widgets || {
        activeRequests: 0,
        highPriority: 0,
        resolvedToday: 0,
        averageResponseTime: 0,
    };

    const reports = analyticsData?.reports || {
        districtVolume: {},
        typeDistribution: {},
        resourceUtilization: { engagedTeams: 0, totalTeams: 0, utilizationRate: 0 }
    };

    return (
        <MainLayout>
            <div className="space-y-6 bg-slate-50 min-h-screen p-1">
                {/* Dynamic Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                            <ShieldAlert className="h-8 w-8 text-red-600 animate-pulse" />
                            SOS & Emergency Requests Control Center
                        </h1>
                        <p className="text-slate-500 mt-1">
                            Monitor live citizen alerts, approve automatic smart-dispatch suggestions, and track evacuation safety.
                        </p>
                    </div>
                </div>

                {/* Analytics Widgets (Step 12) */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    <StatCard
                        title="Active SOS Requests"
                        value={`${widgets.activeRequests}`}
                        subtitle="Pending/Assigned"
                        color="bg-red-50 text-red-700 font-bold border-red-200"
                        icon={<AlertTriangle className="animate-bounce" />}
                    />
                    <StatCard
                        title="Critical Priorities"
                        value={`${widgets.highPriority}`}
                        subtitle="Immediate action required"
                        color="bg-orange-50 text-orange-700 font-bold"
                        icon={<ShieldAlert />}
                    />
                    <StatCard
                        title="Resolved Today"
                        value={`${widgets.resolvedToday}`}
                        subtitle="Completed evacuations"
                        color="bg-emerald-50 text-emerald-600 font-bold"
                        icon={<CheckCircle />}
                    />
                    <StatCard
                        title="Avg Response Speed"
                        value={`${widgets.averageResponseTime} mins`}
                        subtitle="Log-to-dispatch latency"
                        color="bg-indigo-50 text-indigo-700 font-bold"
                        icon={<Clock />}
                    />
                </div>

                {/* Master Control Layout */}
                <div className="grid grid-cols-12 gap-6">

                    {/* Requests Live List (Column Span 8) */}
                    <div className="col-span-12 xl:col-span-8 space-y-6">
                        <Card className="p-6 bg-white border border-slate-200 shadow-sm">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                {/* Search & Filters */}
                                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                                    <div className="relative flex-1 md:flex-initial">
                                        <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                                        <input
                                            type="text"
                                            placeholder="Search citizen or key details..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-9 pr-4 py-2 border border-slate-205 rounded-xl text-xs focus:outline-none focus:border-red-500 bg-white w-full md:w-60"
                                        />
                                    </div>
                                    <select
                                        value={severityFilter}
                                        onChange={(e) => setSeverityFilter(e.target.value)}
                                        className="border border-slate-205 rounded-xl px-3 py-2 text-xs focus:outline-none bg-white font-medium text-slate-650 cursor-pointer"
                                    >
                                        <option value="">All Severities</option>
                                        <option value="Critical">Critical Only</option>
                                        <option value="High">High Only</option>
                                        <option value="Medium">Medium Only</option>
                                        <option value="Low">Low Only</option>
                                    </select>
                                    <select
                                        value={districtFilter}
                                        onChange={(e) => setDistrictFilter(e.target.value)}
                                        className="border border-slate-205 rounded-xl px-3 py-2 text-xs focus:outline-none bg-white font-medium text-slate-650 cursor-pointer"
                                    >
                                        <option value="">All Districts</option>
                                        {[
                                            "Thiruvananthapuram", "Kollam", "Pathanamthitta", "Alappuzha", "Kottayam",
                                            "Idukki", "Ernakulam", "Thrissur", "Palakkad", "Malappuram", "Kozhikode",
                                            "Wayanad", "Kannur", "Kasaragod"
                                        ].map(d => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Status Tabs */}
                                <div className="flex bg-slate-100 p-1 rounded-xl">
                                    {["Pending", "Reviewed", "Assigned", "Resolved", "Cancelled"].map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setStatusTab(tab)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${statusTab === tab
                                                    ? "bg-white text-slate-900 shadow-sm"
                                                    : "text-slate-500 hover:text-slate-800"
                                                }`}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Requests Table */}
                            {isListLoading ? (
                                <div className="flex justify-center items-center py-20">
                                    <span className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-red-650"></span>
                                </div>
                            ) : requests.length === 0 ? (
                                <div className="py-20 text-center text-slate-400 text-xs italic">
                                    No SOS requests matching active filters found.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-150 text-slate-450 font-bold uppercase">
                                                <th className="pb-3">Citizen</th>
                                                <th className="pb-3">Type</th>
                                                <th className="pb-3">District</th>
                                                <th className="pb-3">Priority</th>
                                                <th className="pb-3">Dispatched Rescue</th>
                                                <th className="pb-3 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {requests.map((r) => {
                                                const isSelected = selectedRequestId === r._id;
                                                return (
                                                    <tr
                                                        key={r._id}
                                                        onClick={() => setSelectedRequestId(r._id)}
                                                        className={`border-b border-slate-100 cursor-pointer hover:bg-slate-50/80 transition-all ${isSelected ? "bg-red-50/40 border-l-4 border-l-red-650 pl-3" : ""
                                                            }`}
                                                    >
                                                        <td className="py-4">
                                                            <div className="font-bold text-slate-850 flex items-center gap-1.5">
                                                                <User className="w-3.5 h-3.5 text-slate-400" /> {r.citizenName}
                                                            </div>
                                                            <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                                                                <Phone className="w-3 h-3" /> {r.phone}
                                                            </div>
                                                        </td>
                                                        <td className="py-4 font-bold text-slate-650">{r.emergencyType}</td>
                                                        <td className="py-4 text-slate-600 font-semibold">{r.district}</td>
                                                        <td className="py-4">
                                                            <span
                                                                className={`px-2 py-0.5 rounded font-extrabold text-[10px] uppercase ${r.severity === "Critical"
                                                                        ? "bg-red-100 text-red-600 animate-pulse"
                                                                        : r.severity === "High"
                                                                            ? "bg-orange-100 text-orange-700"
                                                                            : r.severity === "Medium"
                                                                                ? "bg-yellow-108 text-yellow-700 bg-yellow-50"
                                                                                : "bg-emerald-50 text-emerald-600"
                                                                    }`}
                                                            >
                                                                {r.severity}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 text-slate-600 space-y-1">
                                                            {r.assignedTeam && (
                                                                <div className="text-[10px] font-bold text-slate-800 flex items-center gap-1">
                                                                    <Shield className="w-3.5 h-3.5 text-orange-500" /> Team: {r.assignedTeam.teamName}
                                                                </div>
                                                            )}
                                                            {r.assignedVehicle && (
                                                                <div className="text-[10px] font-bold text-slate-850 flex items-center gap-1">
                                                                    <Truck className="w-3.5 h-3.5 text-blue-500" /> Vehicle: {r.assignedVehicle.vehicleNumber}
                                                                </div>
                                                            )}
                                                            {!r.assignedTeam && !r.assignedVehicle && (
                                                                <span className="text-[10px] text-slate-400 italic font-medium">Unassigned</span>
                                                            )}
                                                        </td>
                                                        <td className="py-4 text-right pr-2">
                                                            <div className="inline-flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                                                                {r.requestStatus === "Pending" && (
                                                                    <button
                                                                        onClick={() => handleStatusChange(r._id, "Reviewed")}
                                                                        className="bg-yellow-500 hover:bg-yellow-600 text-white text-[10px] font-extrabold px-2.5 py-1.5 rounded-lg transition"
                                                                    >
                                                                        Review
                                                                    </button>
                                                                )}
                                                                {r.requestStatus !== "Resolved" && r.requestStatus !== "Cancelled" && (
                                                                    <button
                                                                        onClick={() => handleStatusChange(r._id, "Resolved")}
                                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold px-2.5 py-1.5 rounded-lg transition"
                                                                    >
                                                                        Resolve
                                                                    </button>
                                                                )}
                                                                {r.requestStatus !== "Cancelled" && r.requestStatus !== "Resolved" && (
                                                                    <button
                                                                        onClick={() => handleStatusChange(r._id, "Cancelled")}
                                                                        className="bg-slate-300 hover:bg-slate-400 text-slate-700 text-[10px] font-bold px-2 py-1.5 rounded-lg transition"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Card>

                        {/* District volume & Type Distribution Charts (Step 13 Analytics) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Type Distribution */}
                            <Card className="p-5 bg-white border border-slate-205">
                                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-4">Emergency Category Distribution</h3>
                                <div className="space-y-4">
                                    {Object.entries(reports.typeDistribution).map(([type, val]) => {
                                        const max = Math.max(...Object.values(reports.typeDistribution), 1);
                                        const pct = Math.round((val / max) * 100);
                                        return (
                                            <div key={type} className="text-xs space-y-1">
                                                <div className="flex justify-between font-bold text-slate-650">
                                                    <span>{type}</span>
                                                    <span>{val} alerts</span>
                                                </div>
                                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                                    <div className="bg-red-650 h-full rounded-full transition-all" style={{ width: `${pct}%` }}></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {Object.entries(reports.typeDistribution).length === 0 && (
                                        <p className="text-xs text-slate-400 italic">No distribution logs indexed.</p>
                                    )}
                                </div>
                            </Card>

                            {/* Resource Utilization */}
                            <Card className="p-5 bg-white border border-slate-205">
                                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-4 animate-pulse">
                                    Emergency Resource Engagement
                                </h3>
                                <div className="flex flex-col items-center justify-center space-y-3 py-4">
                                    <div className="relative w-28 h-28 flex items-center justify-center rounded-full bg-slate-50 border-4 border-slate-100 shadow">
                                        <span className="text-xl font-black text-rose-650">
                                            {reports.resourceUtilization?.utilizationRate}%
                                        </span>
                                    </div>
                                    <p className="text-xs font-bold text-slate-800 text-center">Engagement Efficiency Index</p>
                                    <p className="text-[11px] text-slate-450 text-center">
                                        Engaged Teams: {reports.resourceUtilization?.engagedTeams} / Total Teams: {reports.resourceUtilization?.totalTeams}
                                    </p>
                                </div>
                            </Card>
                        </div>
                    </div>

                    {/* Right Side: Proximity-Based Resource Suggestions Panel (Column Span 4) */}
                    <div className="col-span-12 xl:col-span-4 space-y-6">
                        <Card className="p-6 bg-slate-900 border border-slate-800 text-white shadow-2xl relative min-h-[500px]">
                            <div className="flex justify-between items-start mb-6 border-b border-slate-850 pb-3">
                                <h3 className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-1.5">
                                    <Activity className="text-orange-500 w-5 h-5 animate-pulse" /> Dispatch suggestions
                                </h3>
                                {selectedRequestId && (
                                    <span className="text-[9px] font-bold bg-red-650 text-white px-2 py-0.5 rounded uppercase">
                                        Evaluation Active
                                    </span>
                                )}
                            </div>

                            {!selectedRequestId ? (
                                <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500 h-[400px]">
                                    <HelpCircle className="w-12 h-12 text-slate-600 mb-3" />
                                    <p className="text-xs font-bold">No SOS Request Selected</p>
                                    <p className="text-[10px] mt-1">Select an active emergency card from the list on the left to pull proximity smart dispatch suggest lists.</p>
                                </div>
                            ) : isDetailLoading ? (
                                <div className="flex justify-center items-center h-[350px]">
                                    <span className="animate-spin rounded-full h-8 w-8 border-4 border-slate-800 border-t-red-650"></span>
                                </div>
                            ) : !detailData ? (
                                <p className="text-xs text-slate-500 italic">Failed to query suggestions.</p>
                            ) : (
                                <div className="space-y-6">
                                    {/* Selected SOS info snapshot */}
                                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
                                        <p className="text-xs font-black text-white">{detailData.data.citizenName}</p>
                                        <p className="text-[10px] text-slate-450 italic">"{detailData.data.description}"</p>
                                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                            <MapPin className="w-3 h-3 text-red-500" /> District: {detailData.data.district} | Coordinates: {detailData.data.latitude}, {detailData.data.longitude}
                                        </div>
                                    </div>

                                    {/* Suggestion Section 1: Near shelters */}
                                    <div className="space-y-2.5">
                                        <h4 className="text-[11px] font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5">
                                            <Building className="w-4 h-4 text-blue-450" /> Suggested Closest Shelters
                                        </h4>
                                        <div className="space-y-2">
                                            {detailData.suggestions?.shelters?.map((s) => (
                                                <div key={s._id} className="bg-slate-950 p-3 rounded-lg border border-slate-850 flex justify-between items-center text-xs">
                                                    <div>
                                                        <p className="font-extrabold text-white">{s.name}</p>
                                                        <p className="text-[9px] text-slate-400 mt-0.5">Capacity: {s.occupancy}/{s.capacity} | Dist: {s.distance.toFixed(1)} km</p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleAssignAsset("shelter", s._id)}
                                                        className="bg-blue-650 hover:bg-blue-750 text-white text-[10px] font-extrabold px-3 py-1.5 rounded transition cursor-pointer"
                                                    >
                                                        Assign
                                                    </button>
                                                </div>
                                            ))}
                                            {detailData.suggestions?.shelters?.length === 0 && (
                                                <p className="text-[10px] text-slate-650 italic">No open shelters registered.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Suggestion Section 2: Nearest Vehicles */}
                                    <div className="space-y-2.5 pt-2">
                                        <h4 className="text-[11px] font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5">
                                            <Truck className="w-4 h-4 text-emerald-500" /> Suggested Rescue Vehicles
                                        </h4>
                                        <div className="space-y-2">
                                            {detailData.suggestions?.vehicles?.map((v) => (
                                                <div key={v._id} className="bg-slate-950 p-3 rounded-lg border border-slate-850 flex justify-between items-center text-xs">
                                                    <div>
                                                        <p className="font-extrabold text-white">{v.vehicleNumber} ({v.vehicleType})</p>
                                                        <p className="text-[9px] text-slate-400 mt-0.5">Driver: {v.driverName} | Dist: {v.distance.toFixed(1)} km</p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleAssignAsset("vehicle", v._id)}
                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold px-3 py-1.5 rounded transition cursor-pointer"
                                                    >
                                                        Assign
                                                    </button>
                                                </div>
                                            ))}
                                            {detailData.suggestions?.vehicles?.length === 0 && (
                                                <p className="text-[10px] text-slate-650 italic">No available emergency vehicles in vicinity.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Suggestion Section 3: Nearest Rescue Teams */}
                                    <div className="space-y-2.5 pt-2">
                                        <h4 className="text-[11px] font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5">
                                            <Shield className="w-4 h-4 text-orange-500 animate-pulse" /> Suggested Rescue Teams
                                        </h4>
                                        <div className="space-y-2">
                                            {detailData.suggestions?.teams?.map((t) => (
                                                <div key={t._id} className="bg-slate-950 p-3 rounded-lg border border-slate-850 flex justify-between items-center text-xs">
                                                    <div>
                                                        <p className="font-extrabold text-white">{t.teamName}</p>
                                                        <p className="text-[9px] text-slate-400 mt-0.5">District: {t.district} | Speciality: {t.specialization || "General"}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleAssignAsset("team", t._id)}
                                                        className="bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-extrabold px-3 py-1.5 rounded transition cursor-pointer"
                                                    >
                                                        Deploy
                                                    </button>
                                                </div>
                                            ))}
                                            {detailData.suggestions?.teams?.length === 0 && (
                                                <p className="text-[10px] text-slate-650 italic">No available rescue teams.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default EmergencyDashboard;
