import React, { useState, useMemo } from "react";
import MainLayout from "../../components/layout/MainLayout";
import useIncidents from "../../features/incidents/hooks/useIncidents";
import useRescueTeams from "../../hooks/useRescueTeams";
import useVehicles from "../../hooks/useVehicles";
import IncidentDetailsDrawer from "../../components/dashboard/IncidentDetailsDrawer";
import IncidentModal from "../../features/incidents/components/IncidentModal";
import { useMap } from "../../context/MapContext";
import {
    Search,
    Filter,
    Grid,
    List,
    Download,
    FileText,
    AlertOctagon,
    CheckCircle,
    Activity,
    Plus,
    Calendar,
    Truck,
    Shield,
    MapPin,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { toast } from "react-hot-toast";

const districtsOfKerala = [
    "Thiruvananthapuram", "Kollam", "Pathanamthitta", "Alappuzha", "Kottayam",
    "Idukki", "Ernakulam", "Thrissur", "Palakkad", "Malappuram",
    "Kozhikode", "Wayanad", "Kannur", "Kasaragod"
];

const severityColors = {
    Low: "bg-green-50 text-green-700 border-green-200",
    Medium: "bg-amber-50 text-amber-700 border-amber-200",
    High: "bg-orange-50 text-orange-700 border-orange-200",
    Critical: "bg-red-50 text-red-700 border-red-200 animate-pulse"
};

const statusColors = {
    Reported: "bg-blue-50 text-blue-700 border-blue-200",
    Verified: "bg-emerald-50 text-emerald-700 border-emerald-250",
    Assigned: "bg-purple-50 text-purple-700 border-purple-200",
    "In Progress": "bg-yellow-50 text-yellow-700 border-yellow-200",
    Resolved: "bg-slate-100 text-slate-700 border-slate-200",
    Rejected: "bg-rose-50 text-rose-700 border-rose-200"
};

const IncidentsPage = () => {
    const { incidents = [], loading, refresh } = useIncidents();
    const { teams = [] } = useRescueTeams();
    const { vehicles = [] } = useVehicles();
    const { openIncidentModal } = useMap();

    // Selected incident for detail drawer view
    const [selectedIncident, setSelectedIncident] = useState(null);

    // States
    const [viewType, setViewType] = useState("table"); // 'table' or 'grid'
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDistrict, setSelectedDistrict] = useState("");
    const [selectedSeverity, setSelectedSeverity] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedAssignedTeam, setSelectedAssignedTeam] = useState("");
    const [selectedAssignedVehicle, setSelectedAssignedVehicle] = useState("");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // Filtered incidents logic
    const filteredIncidents = useMemo(() => {
        // Start with all incidents sorted by newest
        let results = [...incidents].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Apply Search Query
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            results = results.filter(i =>
                i.title.toLowerCase().includes(q) ||
                i.description.toLowerCase().includes(q) ||
                i.category.toLowerCase().includes(q) ||
                (i.location?.district && i.location.district.toLowerCase().includes(q))
            );
        }

        // Apply District Filter
        if (selectedDistrict) {
            results = results.filter(i => i.location?.district === selectedDistrict);
        }

        // Apply Severity Filter
        if (selectedSeverity) {
            results = results.filter(i => i.severity === selectedSeverity);
        }

        // Apply Status Filter
        if (selectedStatus) {
            results = results.filter(i => i.status === selectedStatus);
        }

        // Apply Date Filter
        if (selectedDate) {
            results = results.filter(i => {
                const itemDate = new Date(i.createdAt).toISOString().split("T")[0];
                return itemDate === selectedDate;
            });
        }

        // Apply Assigned Rescue Team Filter
        if (selectedAssignedTeam) {
            results = results.filter(i =>
                teams.some(t => (t.assignedIncident?._id === i._id || t.assignedIncident === i._id) && t._id === selectedAssignedTeam)
            );
        }

        // Apply Assigned Vehicle Filter
        if (selectedAssignedVehicle) {
            results = results.filter(i =>
                vehicles.some(v => (v.assignedIncident?._id === i._id || v.assignedIncident === i._id) && v._id === selectedAssignedVehicle)
            );
        }

        return results;
    }, [incidents, searchQuery, selectedDistrict, selectedSeverity, selectedStatus, selectedDate, selectedAssignedTeam, selectedAssignedVehicle, teams, vehicles]);

    // Paginated Results
    const totalPages = Math.ceil(filteredIncidents.length / itemsPerPage) || 1;
    const paginatedIncidents = useMemo(() => {
        const startIdx = (currentPage - 1) * itemsPerPage;
        return filteredIncidents.slice(startIdx, startIdx + itemsPerPage);
    }, [filteredIncidents, currentPage]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    // KPIs
    const stats = useMemo(() => {
        const total = incidents.length;
        const active = incidents.filter(i => ["Reported", "Verified", "Assigned", "In Progress"].includes(i.status)).length;
        const resolved = incidents.filter(i => i.status === "Resolved").length;
        const critical = incidents.filter(i => i.severity === "Critical").length;

        return { total, active, resolved, critical };
    }, [incidents]);

    // Export CSV
    const handleExportCSV = () => {
        if (filteredIncidents.length === 0) {
            toast.error("No incidents found to export.");
            return;
        }

        const headers = ["Title", "Description", "Category", "Severity", "District", "Latitude", "Longitude", "Status", "Created At"];
        const rows = filteredIncidents.map(i => [
            `"${i.title.replace(/"/g, '""')}"`,
            `"${i.description.replace(/"/g, '""')}"`,
            i.category,
            i.severity,
            i.location?.district || "Unknown",
            i.location?.latitude || 0,
            i.location?.longitude || 0,
            i.status,
            new Date(i.createdAt).toLocaleString()
        ]);

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `operational_incidents_report_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("CSV Report downloaded successfully.");
    };

    // Export PDF Report print-out
    const handleExportPDF = () => {
        if (filteredIncidents.length === 0) {
            toast.error("No incidents found to export.");
            return;
        }

        const printWindow = window.open("", "_blank");
        const htmlDef = `
      <html>
        <head>
          <title>Kerala operational incidents - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: sans-serif; padding: 30px; color: #1e293b; }
            h1 { font-size: 24px; margin-bottom: 4px; color: #0f172a; }
            p { font-size: 13px; color: #64748b; margin-top: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 25px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; font-size: 11px; }
            th { background-color: #f8fafc; font-weight: 600; color: #475569; }
            .badge { padding: 3px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; text-transform: uppercase; }
            .badge-Critical { background-color: #fef2f2; color: #991b1b; }
            .badge-High { background-color: #fff7ed; color: #9a3412; }
            .badge-Medium { background-color: #fef3c7; color: #92400e; }
            .badge-Low { background-color: #f0fdf4; color: #166534; }
          </style>
        </head>
        <body>
          <h1>Kerala Disaster Intelligence Platform</h1>
          <p>Active Incident Control Log - Generated ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Severity</th>
                <th>District</th>
                <th>Status</th>
                <th>Log Date</th>
              </tr>
            </thead>
            <tbody>
              ${filteredIncidents.map(i => `
                <tr>
                   <td><strong>${i.title}</strong></td>
                   <td>${i.category}</td>
                   <td><span class="badge badge-${i.severity}">${i.severity}</span></td>
                   <td>${i.location?.district || "Unknown"}</td>
                   <td>${i.status}</td>
                   <td>${new Date(i.createdAt).toLocaleString()}</td>
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
        toast.success("PDF Report generated.");
    };

    const handleReportIncident = () => {
        // Open reporting modal centered dynamically
        openIncidentModal({ lat: 10.8505, lng: 76.2711 });
    };

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Title toolbar */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                            <AlertOctagon className="w-6 h-6 text-blue-600" />
                            Incident Management Center
                        </h1>
                        <p className="text-sm text-slate-500 font-medium">
                            Control dashboard to log, verify, assign triage personnel, request heavy equipment/vehicles, and monitor disaster incidents.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                        <button
                            onClick={handleReportIncident}
                            className="px-4 py-2 bg-blue-600 border border-blue-750 text-white font-semibold rounded-xl text-sm hover:bg-blue-700 transition flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Report Incident
                        </button>

                        <button
                            onClick={handleExportCSV}
                            className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 text-sm font-semibold transition flex items-center gap-1.5"
                        >
                            <Download className="w-4 h-4" />
                            CSV
                        </button>

                        <button
                            onClick={handleExportPDF}
                            className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 text-sm font-semibold transition flex items-center gap-1.5"
                        >
                            <FileText className="w-4 h-4" />
                            PDF Report
                        </button>
                    </div>
                </div>

                {/* KPIs row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                        <div className="flex justify-between items-center text-slate-400">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Logged</span>
                            <Activity className="w-4 h-4 text-blue-600" />
                        </div>
                        <p className="text-2xl font-bold text-slate-900 mt-2">{stats.total}</p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                        <div className="flex justify-between items-center text-slate-400">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Incidents</span>
                            <AlertOctagon className="w-4 h-4 text-orange-500" />
                        </div>
                        <p className="text-2xl font-bold text-slate-900 mt-2">{stats.active}</p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                        <div className="flex justify-between items-center text-slate-400">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Resolved Control</span>
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                        </div>
                        <p className="text-2xl font-bold text-slate-900 mt-2">{stats.resolved}</p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                        <div className="flex justify-between items-center text-slate-400">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Critical Severity</span>
                            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                        </div>
                        <p className="text-2xl font-bold text-red-600 mt-2">{stats.critical}</p>
                    </div>
                </div>

                {/* Filters setup */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                            <Filter className="w-4 h-4 text-blue-650" />
                            Advanced Control Filters
                        </span>

                        <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg p-0.5 bg-slate-50">
                            <button
                                onClick={() => setViewType("table")}
                                className={`p-1.5 rounded-md ${viewType === "table" ? "bg-white text-blue-600 shadow-xs" : "text-slate-500 hover:bg-slate-150"}`}
                            >
                                <Grid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewType("grid")}
                                className={`p-1.5 rounded-md ${viewType === "grid" ? "bg-white text-blue-600 shadow-xs" : "text-slate-500 hover:bg-slate-150"}`}
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* Search query input */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search by keywords..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 text-slate-800 font-semibold"
                            />
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        </div>

                        {/* District filter */}
                        <select
                            value={selectedDistrict}
                            onChange={(e) => { setSelectedDistrict(e.target.value); setCurrentPage(1); }}
                            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-600 text-slate-700 font-semibold"
                        >
                            <option value="">All Districts</option>
                            {districtsOfKerala.map((d, index) => (
                                <option key={index} value={d}>{d}</option>
                            ))}
                        </select>

                        {/* Severity filter */}
                        <select
                            value={selectedSeverity}
                            onChange={(e) => { setSelectedSeverity(e.target.value); setCurrentPage(1); }}
                            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-600 text-slate-700 font-semibold"
                        >
                            <option value="">All Severities</option>
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                        </select>

                        {/* Status filter */}
                        <select
                            value={selectedStatus}
                            onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
                            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-600 text-slate-700 font-semibold"
                        >
                            <option value="">All Statuses</option>
                            <option value="Reported">Reported</option>
                            <option value="Verified">Verified</option>
                            <option value="Assigned">Assigned</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-slate-100 pt-3">
                        {/* Date filter */}
                        <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => { setSelectedDate(e.target.value); setCurrentPage(1); }}
                                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-600 text-slate-705 font-semibold"
                            />
                        </div>

                        {/* Assigned Rescue Team filter */}
                        <div className="flex items-center gap-2">
                            <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <select
                                value={selectedAssignedTeam}
                                onChange={(e) => { setSelectedAssignedTeam(e.target.value); setCurrentPage(1); }}
                                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-600 text-slate-700 font-semibold"
                            >
                                <option value="">All Assigned Teams</option>
                                {teams.map((t) => (
                                    <option key={t._id} value={t._id}>{t.teamName}</option>
                                ))}
                            </select>
                        </div>

                        {/* Assigned Vehicle filter */}
                        <div className="flex items-center gap-2">
                            <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <select
                                value={selectedAssignedVehicle}
                                onChange={(e) => { setSelectedAssignedVehicle(e.target.value); setCurrentPage(1); }}
                                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-600 text-slate-700 font-semibold"
                            >
                                <option value="">All Assigned Vehicles</option>
                                {vehicles.map((v) => (
                                    <option key={v._id} value={v._id}>{v.vehicleNumber} ({v.vehicleType})</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Incidents listing */}
                {loading ? (
                    <div className="flex justify-center items-center h-48">
                        <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                ) : filteredIncidents.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
                        <p className="text-slate-450 font-semibold">No operational incidents matched the selected filters.</p>
                    </div>
                ) : viewType === "table" ? (
                    /* Table View */
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 shrink-0 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                                        <th className="px-6 py-4">Title</th>
                                        <th className="px-6 py-4">Category</th>
                                        <th className="px-6 py-4">Severity</th>
                                        <th className="px-6 py-4">District</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Log Timestamp</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-800">
                                    {paginatedIncidents.map((i) => (
                                        <tr key={i._id} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="px-6 py-4 font-bold text-slate-900">{i.title}</td>
                                            <td className="px-6 py-4">{i.category}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${severityColors[i.severity] || "bg-slate-50 text-slate-700 border-slate-200"}`}>
                                                    {i.severity}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 flex items-center gap-1 mt-1">
                                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                                {i.location?.district || "Unknown"}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${statusColors[i.status] || "bg-slate-100 text-slate-700"}`}>
                                                    {i.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 font-medium">
                                                {new Date(i.createdAt).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => setSelectedIncident(i)}
                                                    className="px-3.5 py-1.5 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 rounded-lg transition"
                                                >
                                                    Control Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    /* Card View */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {paginatedIncidents.map((i) => (
                            <div
                                key={i._id}
                                className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 shadow-xs transition duration-300 flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex justify-between items-start gap-2 mb-3">
                                        <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${severityColors[i.severity] || ""}`}>
                                            {i.severity}
                                        </span>
                                        <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${statusColors[i.status] || ""}`}>
                                            {i.status}
                                        </span>
                                    </div>

                                    <h3 className="text-sm font-bold text-slate-900 leading-snug">{i.title}</h3>
                                    <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed font-medium">
                                        {i.description}
                                    </p>

                                    <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-500">
                                        <div className="flex items-center gap-1.5">
                                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                            <span className="truncate">{i.location?.district || "Unknown"}</span>
                                        </div>

                                        <div className="flex items-center gap-1.5 text-right justify-end font-medium">
                                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                            <span>{new Date(i.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-5">
                                    <button
                                        onClick={() => setSelectedIncident(i)}
                                        className="w-full text-center py-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition"
                                    >
                                        Assess & Assign
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination controls */}
                {filteredIncidents.length > 0 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs select-none">
                        <span className="text-xs font-semibold text-slate-500">
                            Showing <span className="font-bold text-slate-700">{Math.min(filteredIncidents.length, (currentPage - 1) * itemsPerPage + 1)}</span> to{" "}
                            <span className="font-bold text-slate-700">{Math.min(filteredIncidents.length, currentPage * itemsPerPage)}</span> of{" "}
                            <span className="font-bold text-slate-700">{filteredIncidents.length}</span> operational records
                        </span>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-650 transition disabled:opacity-50"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>

                            <span className="text-xs font-bold text-slate-700 px-2">
                                Page {currentPage} of {totalPages}
                            </span>

                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-650 transition disabled:opacity-50"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Incident Details drawer side panel overlay */}
            <IncidentDetailsDrawer
                isOpen={Boolean(selectedIncident)}
                onClose={() => { setSelectedIncident(null); refresh(); }}
                incident={selectedIncident}
            />

            {/* Map based Incident reporting modal */}
            <IncidentModal />
        </MainLayout>
    );
};

export default IncidentsPage;
