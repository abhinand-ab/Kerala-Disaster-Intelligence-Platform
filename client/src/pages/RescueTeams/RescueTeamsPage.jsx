import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    Shield,
    Plus,
    Search,
    Users,
    Truck,
    TriangleAlert,
    Trash2,
    PencilLine,
    Activity,
    MapPin,
    HeartHandshake,
    UserCheck,
    Wrench,
    RefreshCcw,
    ShieldAlert,
    Download,
    FileText,
    Map,
    Navigation,
} from "lucide-react";
import { toast } from "react-hot-toast";
import MainLayout from "../../components/layout/MainLayout";
import Header from "../../components/layout/Header";
import useRescueTeams from "../../hooks/useRescueTeams";
import useVolunteers from "../../hooks/useVolunteers";
import useVehicles from "../../hooks/useVehicles";
import useIncidents from "../../features/incidents/hooks/useIncidents";
import RescueTeamModal from "../../components/rescueTeams/RescueTeamModal";
import DeleteRescueTeamDialog from "../../components/rescueTeams/DeleteRescueTeamDialog";
import { useMap } from "../../context/MapContext";

const statusStyles = {
    Available: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    "On Mission": "bg-amber-100 text-amber-700 ring-amber-200",
    Returning: "bg-blue-100 text-blue-700 ring-blue-200",
    Maintenance: "bg-slate-100 text-slate-700 ring-slate-200",
    Inactive: "bg-rose-100 text-rose-700 ring-rose-200",
};

const districtCoords = {
    Thiruvananthapuram: [8.5241, 76.9366],
    Kollam: [8.8932, 76.6141],
    Pathanamthitta: [9.2667, 76.7833],
    Alappuzha: [9.4981, 76.3388],
    Kottayam: [9.5916, 76.5222],
    Idukki: [9.9189, 77.1025],
    Ernakulam: [9.9816, 76.2999],
    Thrissur: [10.5276, 76.2144],
    Palakkad: [10.7867, 76.6548],
    Malappuram: [11.0735, 76.0740],
    Kozhikode: [11.2588, 75.7804],
    Wayanad: [11.6854, 76.1320],
    Kannur: [11.8745, 75.3704],
    Kasaragod: [12.5103, 74.9852]
};

const filterOptions = ["All", "Available", "On Mission", "Returning", "Maintenance", "Inactive"];

const RescueTeamsPage = () => {
    const {
        teams,
        isLoading,
        error,
        refetch,
        createTeam,
        updateTeam,
        deleteTeam,
    } = useRescueTeams();

    const { volunteers } = useVolunteers();
    const { vehicles } = useVehicles();
    const { incidents } = useIncidents();

    const { setMapFlyToTarget, setLayers } = useMap();
    const navigate = useNavigate();

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [mode, setMode] = useState("add");
    const [loading, setLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const filteredTeams = useMemo(() => {
        return teams.filter((t) => {
            const matchesSearch = [
                t?.teamName,
                t?.district,
                t?.specialization,
                t?.leader?.fullName,
            ]
                .filter(Boolean)
                .some((v) => v.toLowerCase().includes(searchTerm.trim().toLowerCase()));

            const matchesStatus = statusFilter === "All" || t?.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [searchTerm, teams, statusFilter]);

    // Stats
    const totalTeamsCount = teams.length;
    const availableTeamsCount = teams.filter((t) => t.status === "Available").length;
    const onMissionCount = teams.filter((t) => t.status === "On Mission").length;
    const activeStaffCount = useMemo(() => {
        return teams.reduce((acc, t) => acc + (t.members?.length || 0), 0);
    }, [teams]);

    const statConfigs = [
        {
            key: "totalTeams",
            value: totalTeamsCount,
            label: "Total Teams",
            icon: Shield,
            iconClassName: "text-indigo-600",
            cardClassName: "from-indigo-50 to-white",
        },
        {
            key: "availableTeams",
            value: availableTeamsCount,
            label: "Available Teams",
            icon: UserCheck,
            iconClassName: "text-emerald-600",
            cardClassName: "from-emerald-50 to-white",
        },
        {
            key: "onMissionTeams",
            value: onMissionCount,
            label: "Deployed on Mission",
            icon: Activity,
            iconClassName: "text-amber-600",
            cardClassName: "from-amber-50 to-white",
        },
        {
            key: "totalStaffed",
            value: activeStaffCount,
            label: "Staff Force",
            icon: Users,
            iconClassName: "text-teal-600",
            cardClassName: "from-teal-50 to-white",
        },
    ];

    const handleOpenAddModal = () => {
        setSelectedTeam(null);
        setMode("add");
        setIsModalOpen(true);
    };

    const handleEditTeam = (team) => {
        setSelectedTeam(team);
        setMode("edit");
        setIsModalOpen(true);
    };

    const handleDeleteTeam = (team) => {
        setSelectedTeam(team);
        setIsDeleteDialogOpen(true);
    };

    const handleCloseModal = () => {
        if (loading) return;
        setIsModalOpen(false);
        setSelectedTeam(null);
    };

    const handleCloseDeleteDialog = () => {
        if (deleteLoading) return;
        setIsDeleteDialogOpen(false);
        setSelectedTeam(null);
    };

    const handleSubmitTeam = async (formData) => {
        setLoading(true);
        try {
            if (mode === "add") {
                await createTeam(formData);
            } else if (selectedTeam?._id) {
                await updateTeam({ id: selectedTeam._id, data: formData });
            }
            await refetch();
            setIsModalOpen(false);
            setSelectedTeam(null);
        } catch (err) {
            console.error("Team submission failed:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!selectedTeam?._id) return;
        setDeleteLoading(true);
        try {
            await deleteTeam(selectedTeam._id);
            await refetch();
            setIsDeleteDialogOpen(false);
            setSelectedTeam(null);
        } catch (err) {
            console.error("Failed to disband team:", err);
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleViewOnMap = (team) => {
        let lat = null;
        let lng = null;

        // Try getting assigned incident center
        if (team.assignedIncident?.location?.latitude && team.assignedIncident?.location?.longitude) {
            lat = team.assignedIncident.location.latitude;
            lng = team.assignedIncident.location.longitude;
        }
        // Try getting assigned vehicle center
        else if (team.assignedVehicle?.latitude && team.assignedVehicle?.longitude) {
            lat = team.assignedVehicle.latitude;
            lng = team.assignedVehicle.longitude;
        }
        // fallback to district headquarters coords
        else if (team.district && districtCoords[team.district]) {
            [lat, lng] = districtCoords[team.district];
        }

        if (!lat || !lng) {
            toast.error("Coordinates not found for this squad.");
            return;
        }

        setMapFlyToTarget([lat, lng]);
        setLayers((prev) => ({ ...prev, rescueTeams: true }));
        toast.success(`Positioned map view over ${team.teamName}'s operational area.`);
        navigate("/map");
    };

    const handleExportCSV = () => {
        if (filteredTeams.length === 0) {
            toast.error("No rescue teams found to export.");
            return;
        }

        const headers = ["Team Name", "Specialization", "District", "Status", "Leader", "Members Count", "Assigned Incident", "Assigned Vehicle"];
        const rows = filteredTeams.map(t => [
            `"${t.teamName.replace(/"/g, '""')}"`,
            `"${(t.specialization || "General").replace(/"/g, '""')}"`,
            t.district,
            t.status,
            `"${(t.leader?.fullName || "None").replace(/"/g, '""')}"`,
            t.members?.length || 0,
            `"${(t.assignedIncident?.title || "None").replace(/"/g, '""')}"`,
            `"${(t.assignedVehicle?.vehicleNumber || "None").replace(/"/g, '""')}"`
        ]);

        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `rescue_teams_report_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("CSV report downloaded.");
    };

    const handleExportPDF = () => {
        if (filteredTeams.length === 0) {
            toast.error("No rescue teams found to export.");
            return;
        }

        const printWindow = window.open("", "_blank");
        const htmlDef = `
            <html>
                <head>
                    <title>Kerala operational rescue teams - ${new Date().toLocaleDateString()}</title>
                    <style>
                        body { font-family: sans-serif; padding: 30px; color: #1e293b; }
                        h1 { font-size: 24px; margin-bottom: 4px; color: #0f172a; }
                        p { font-size: 13px; color: #64748b; margin-top: 0; }
                        table { width: 100%; border-collapse: collapse; margin-top: 25px; }
                        th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; font-size: 11px; }
                        th { background-color: #f8fafc; font-weight: 600; color: #475569; }
                        .badge { padding: 3px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; text-transform: uppercase; }
                        .badge-Available { background-color: #f0fdf4; color: #166534; }
                        .badge-Mission { background-color: #fff7ed; color: #9a3412; }
                        .badge-Inactive { background-color: #fef2f2; color: #991b1b; }
                    </style>
                </head>
                <body>
                    <h1>Kerala Disaster Intelligence Platform</h1>
                    <p>Operational Rapid Dispatch Teams Log - Generated ${new Date().toLocaleString()}</p>
                    <table>
                        <thead>
							<tr>
								<th>Team Name</th>
								<th>Specialization</th>
								<th>District</th>
								<th>Status</th>
								<th>Leader</th>
								<th>Members</th>
								<th>Assigned Vehicle</th>
							</tr>
                        </thead>
                        <tbody>
                            ${filteredTeams.map(t => `
                                <tr>
									<td><strong>${t.teamName}</strong></td>
									<td>${t.specialization || "General"}</td>
									<td>${t.district}</td>
									<td><span class="badge ${t.status === "Available" ? "badge-Available" : "badge-Mission"}">${t.status}</span></td>
									<td>${t.leader?.fullName || "None"}</td>
									<td>${t.members?.length || 0}</td>
									<td>${t.assignedVehicle?.vehicleNumber || "None"}</td>
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
        toast.success("PDF generated.");
    };

    const isFilteredEmpty = !isLoading && !error && teams.length > 0 && filteredTeams.length === 0;
    const isListEmpty = !isLoading && !error && teams.length === 0;
    const errorMessage = typeof error === "string" ? error : error?.message || "Unable to load rescue teams.";

    return (
        <MainLayout>
            <Header
                title="Rescue Teams & Operational Dispatch"
                subtitle="Configure rapid rescue teams, organize skilled first responders, attach emergency vehicles, and deploy force packages."
            />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 font-semibold">
                {statConfigs.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={stat.key}
                            className={`group rounded-3xl border border-slate-200 bg-gradient-to-br ${stat.cardClassName} p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}
                        >
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                                    <Icon className={`h-6 w-6 ${stat.iconClassName}`} />
                                </div>
                                <div className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-slate-500 ring-1 ring-white/80">
                                    Active
                                </div>
                            </div>

                            <div className="text-3xl font-bold tracking-tight text-slate-900">
                                {stat.value}
                            </div>
                            <div className="mt-1 text-sm font-medium text-slate-600">{stat.label}</div>
                        </div>
                    );
                })}
            </div>

            {/* Filters panel */}
            <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_180px_auto_auto_auto] lg:items-center">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                        <input
                            type="search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by team name, district, specialization, or leader..."
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-400/10 font-bold"
                        />
                    </div>

                    <div className="relative">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-xs font-semibold text-slate-700 outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-400/10 cursor-pointer"
                        >
                            {filterOptions.map((option) => (
                                <option key={option} value={option}>
                                    {option === "All" ? "All Statuses" : option}
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                            ▼
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleExportCSV}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-55"
                    >
                        <Download className="h-4 w-4" />
                        CSV
                    </button>

                    <button
                        type="button"
                        onClick={handleExportPDF}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-55"
                    >
                        <FileText className="h-4 w-4" />
                        PDF Report
                    </button>

                    <button
                        type="button"
                        onClick={handleOpenAddModal}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-650 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                    >
                        <Plus className="h-4 w-4" />
                        Assemble Team
                    </button>
                </div>
            </div>

            {/* List Layout */}
            {isLoading ? (
                <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div
                            key={index}
                            className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-3">
                                    <div className="h-5 w-48 rounded-full bg-slate-105" />
                                    <div className="h-4 w-32 rounded-full bg-slate-105" />
                                </div>
                                <div className="h-8 w-24 rounded-full bg-slate-105" />
                            </div>
                            <div className="mt-6 grid grid-cols-2 gap-4">
                                <div className="h-14 rounded-2xl bg-slate-105" />
                                <div className="h-14 rounded-2xl bg-slate-105" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : error ? (
                <div className="mt-8 rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                        <ShieldAlert className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-slate-900">Unable to load teams</h3>
                    <p className="mt-2 text-sm text-slate-500">{errorMessage}</p>
                    <button
                        type="button"
                        onClick={() => refetch()}
                        className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-600"
                    >
                        <RefreshCcw className="h-4 w-4" />
                        Retry
                    </button>
                </div>
            ) : isListEmpty ? (
                <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-50 text-cyan-600">
                        <Shield className="h-7 w-7" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-slate-900">No rescue teams assembled yet</h3>
                    <p className="mt-2 text-sm text-slate-500">
                        Create first responder squads, assign leaders, attach emergency rescue vehicles, and coordinate assignments.
                    </p>
                    <button
                        type="button"
                        onClick={handleOpenAddModal}
                        className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-600"
                    >
                        <Plus className="h-4 w-4" />
                        Create Rescue Team
                    </button>
                </div>
            ) : isFilteredEmpty ? (
                <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
                        <Search className="h-7 w-7" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-slate-900">No matching teams</h3>
                    <p className="mt-2 text-sm text-slate-500">Try a different search term or choose a different status filter.</p>
                </div>
            ) : (
                <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2 font-sans animate-fadeIn">
                    {filteredTeams.map((team) => {
                        const badgeClass = statusStyles[team.status] || "bg-blue-105 text-blue-700 ring-blue-200";

                        return (
                            <article
                                key={team._id}
                                className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between"
                            >
                                <div className="flex flex-col gap-4">
                                    {/* Card Title & Status banner */}
                                    <div className="flex justify-between items-start gap-3">
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900">{team.teamName}</h3>
                                            <p className="text-sm font-bold text-blue-600 mt-0.5">{team.specialization || "General Rescue Ops"}</p>
                                        </div>
                                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${badgeClass}`}>
                                            {team.status}
                                        </span>
                                    </div>

                                    {/* District & Creator info */}
                                    <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
                                        <MapPin className="h-4 w-4 text-blue-600" />
                                        <span className="font-bold text-slate-700">{team.district}</span>
                                        <span className="text-slate-350">•</span>
                                        <span className="text-slate-400">Created by: {team.createdBy?.name || "Admin"}</span>
                                    </div>

                                    {/* Vehicle and Incident assignments */}
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mt-2">
                                        <div className="flex items-center gap-2.5 rounded-2xl bg-slate-50 p-3 text-xs text-slate-800 border border-slate-100">
                                            <Truck className="h-4.5 w-4.5 text-slate-500" />
                                            <div className="min-w-0">
                                                <div className="text-[10px] font-bold text-slate-450 uppercase tracking-wide">Vehicle Assigned</div>
                                                <div className="font-bold text-slate-900 truncate">
                                                    {team.assignedVehicle ? team.assignedVehicle.vehicleNumber : "None"}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2.5 rounded-2xl bg-slate-50 p-3 text-xs text-slate-800 border border-slate-100">
                                            <TriangleAlert className="h-4.5 w-4.5 text-amber-500" />
                                            <div className="min-w-0">
                                                <div className="text-[10px] font-bold text-slate-450 uppercase tracking-wide">Active Incident</div>
                                                <div className="font-bold text-slate-900 truncate">
                                                    {team.assignedIncident ? team.assignedIncident.title : "None"}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Leaders & Members list */}
                                    <div className="space-y-3 border-t border-slate-100 pt-4 mt-2">
                                        {team.leader && (
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Squad Leader</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-7 w-7 rounded-lg bg-indigo-50 border border-indigo-150 flex items-center justify-center font-bold text-xs text-indigo-700">
                                                        {team.leader.fullName?.charAt(0)}
                                                    </div>
                                                    <div className="text-xs">
                                                        <span className="font-bold text-slate-900">{team.leader.fullName}</span>
                                                        <span className="text-slate-400 font-mono ml-2">{team.leader.phone}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Team Members ({team.members?.length || 0})</span>
                                            {team.members && team.members.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {team.members.map((member) => (
                                                        <div key={member._id} className="flex items-center gap-1 bg-slate-50 hover:bg-slate-100 transition border border-slate-150 rounded-xl py-1 px-2.5 text-xs text-slate-700">
                                                            <div className="h-4.5 w-4.5 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-black text-slate-600">
                                                                {member.fullName?.charAt(0)}
                                                            </div>
                                                            <span className="font-semibold">{member.fullName}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-slate-400 italic font-semibold">No team members assigned.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Action Footers */}
                                <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => handleViewOnMap(team)}
                                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-750"
                                    >
                                        <Map className="h-3.5 w-3.5" />
                                        View on Map
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleEditTeam(team)}
                                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-705"
                                    >
                                        <PencilLine className="h-3.5 w-3.5" />
                                        Edit Squad
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleDeleteTeam(team)}
                                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-705 ml-auto text-rose-600"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Disband
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}

            {/* Modals & Dialogs */}
            <RescueTeamModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmitTeam}
                initialData={selectedTeam}
                loading={loading}
                mode={mode}
                volunteers={volunteers}
                vehicles={vehicles}
                incidents={incidents}
            />

            <DeleteRescueTeamDialog
                isOpen={isDeleteDialogOpen}
                onClose={handleCloseDeleteDialog}
                onConfirm={handleConfirmDelete}
                team={selectedTeam}
                loading={deleteLoading}
            />
        </MainLayout>
    );
};

export default RescueTeamsPage;
