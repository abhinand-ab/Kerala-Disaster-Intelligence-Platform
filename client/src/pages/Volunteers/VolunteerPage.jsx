import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Activity,
    HeartHandshake,
    Mail,
    MapPin,
    PencilLine,
    Plus,
    Phone,
    RefreshCcw,
    Search,
    ShieldAlert,
    ShieldCheck,
    Trash2,
    UserCheck,
    UserX,
    Users,
    Download,
    FileText,
    Map,
} from "lucide-react";
import { toast } from "react-hot-toast";

import MainLayout from "../../components/layout/MainLayout";
import Header from "../../components/layout/Header";
import DeleteVolunteerDialog from "../../components/volunteers/DeleteVolunteerDialog";
import VolunteerModal from "../../components/volunteers/VolunteerModal";
import useVolunteers from "../../hooks/useVolunteers";
import { useMap } from "../../context/MapContext";

const statusStyles = {
    Available: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    Busy: "bg-amber-100 text-amber-700 ring-amber-200",
};

const statConfigs = [
    {
        key: "totalVolunteers",
        label: "Total Volunteers",
        icon: Users,
        iconClassName: "text-cyan-600",
        cardClassName: "from-cyan-50 to-white",
    },
    {
        key: "availableVolunteers",
        label: "Available Now",
        icon: UserCheck,
        iconClassName: "text-emerald-600",
        cardClassName: "from-emerald-50 to-white",
    },
    {
        key: "busyVolunteers",
        label: "Busy / Assigned",
        icon: UserX,
        iconClassName: "text-amber-600",
        cardClassName: "from-amber-50 to-white",
    },
    {
        key: "totalTeams",
        label: "Active Teams",
        icon: HeartHandshake,
        iconClassName: "text-teal-600",
        cardClassName: "from-teal-50 to-white",
    },
];

const filterOptions = ["All", "Available", "Busy"];

const formatNumber = (value) => new Intl.NumberFormat("en-IN").format(Number(value) || 0);

const VolunteerPage = () => {
    const {
        volunteers,
        isLoading,
        error,
        refetch,
        createVolunteer,
        updateVolunteer,
        deleteVolunteer,
        markAvailable,
        markBusy,
    } = useVolunteers();

    const { setMapFlyToTarget, setLayers } = useMap();
    const navigate = useNavigate();

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [mode, setMode] = useState("add");
    const [selectedVolunteer, setSelectedVolunteer] = useState(null);
    const [loading, setLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const filteredVolunteers = useMemo(() => {
        return volunteers.filter((vol) => {
            const matchesSearch = [
                vol?.fullName,
                vol?.team,
                vol?.district,
                ...(vol?.skills || []),
            ]
                .filter(Boolean)
                .some((value) => value.toLowerCase().includes(searchTerm.trim().toLowerCase()));

            const isAvail = vol.status === "Available" || vol.availability;
            const matchesStatus =
                statusFilter === "All" ||
                (statusFilter === "Available" && isAvail) ||
                (statusFilter === "Busy" && !isAvail);

            return matchesSearch && matchesStatus;
        });
    }, [searchTerm, volunteers, statusFilter]);

    // Stats
    const totalVolunteers = volunteers.length;
    const availableVolunteers = volunteers.filter((v) => v.status === "Available" || v.availability).length;
    const busyVolunteers = volunteers.filter((v) => v.status === "Busy" || !v.availability).length;

    const totalTeams = useMemo(() => {
        const teams = volunteers.map((v) => v.team?.trim()).filter(Boolean);
        return new Set(teams).size;
    }, [volunteers]);

    const summaryValues = {
        totalVolunteers,
        availableVolunteers,
        busyVolunteers,
        totalTeams,
    };

    const handleOpenAddModal = () => {
        setSelectedVolunteer(null);
        setMode("add");
        setIsModalOpen(true);
    };

    const handleEditVolunteer = (volunteer) => {
        setSelectedVolunteer(volunteer);
        setMode("edit");
        setIsModalOpen(true);
    };

    const handleDeleteVolunteer = (volunteer) => {
        setSelectedVolunteer(volunteer);
        setIsDeleteDialogOpen(true);
    };

    const toggleStatus = async (volunteer) => {
        try {
            const isAvail = volunteer.status === "Available" || volunteer.availability;
            if (isAvail) {
                await markBusy(volunteer._id);
            } else {
                await markAvailable(volunteer._id);
            }
            await refetch();
        } catch (err) {
            console.error("Failed to toggle status:", err);
        }
    };

    const resetModalState = () => {
        setIsModalOpen(false);
        setMode("add");
        setSelectedVolunteer(null);
    };

    const handleCloseModal = () => {
        if (loading) return;
        resetModalState();
    };

    const handleCloseDeleteDialog = () => {
        if (deleteLoading) return;
        setIsDeleteDialogOpen(false);
        setSelectedVolunteer(null);
    };

    const handleConfirmDelete = async () => {
        if (!selectedVolunteer?._id) return;
        setDeleteLoading(true);
        try {
            await deleteVolunteer(selectedVolunteer._id);
            await refetch();
            setIsDeleteDialogOpen(false);
            setSelectedVolunteer(null);
        } catch (err) {
            console.error(err);
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleSubmitVolunteer = async (formData) => {
        setLoading(true);
        try {
            if (mode === "add") {
                await createVolunteer(formData);
            } else if (selectedVolunteer?._id) {
                await updateVolunteer({ id: selectedVolunteer._id, data: formData });
            }
            await refetch();
            resetModalState();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleViewOnMap = (vol) => {
        if (!vol.latitude || !vol.longitude) {
            toast.error("Live coordinates not found for this volunteer.");
            return;
        }

        setMapFlyToTarget([vol.latitude, vol.longitude]);
        setLayers((prev) => ({ ...prev, volunteers: true }));
        toast.success(`Positioned map view over ${vol.fullName}'s location.`);
        navigate("/map");
    };

    const handleExportCSV = () => {
        if (filteredVolunteers.length === 0) {
            toast.underline("No volunteer data available to export.");
            return;
        }

        const headers = ["Full Name", "District", "Status", "Team", "Email", "Phone", "Skills", "Latitude", "Longitude", "Current Mission"];
        const rows = filteredVolunteers.map(v => [
            `"${v.fullName.replace(/"/g, '""')}"`,
            v.district || "None",
            (v.status === "Available" || v.availability) ? "Available" : "Busy",
            `"${(v.team || "Independent").replace(/"/g, '""')}"`,
            v.email || "None",
            v.phone || "None",
            `"${(v.skills || []).join(", ").replace(/"/g, '""')}"`,
            v.latitude || "--",
            v.longitude || "--",
            `"${(v.currentIncident?.title || "None").replace(/"/g, '""')}"`
        ]);

        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `volunteers_report_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("CSV log exported successfully.");
    };

    const handleExportPDF = () => {
        if (filteredVolunteers.length === 0) {
            toast.error("No volunteer data to export.");
            return;
        }

        const printWindow = window.open("", "_blank");
        const htmlDef = `
            <html>
                <head>
                    <title>Registered Volunteers & Personnel - ${new Date().toLocaleDateString()}</title>
                    <style>
                        body { font-family: sans-serif; padding: 30px; color: #1e293b; }
                        h1 { font-size: 24px; margin-bottom: 4px; color: #0f172a; }
                        p { font-size: 13px; color: #64748b; margin-top: 0; }
                        table { width: 100%; border-collapse: collapse; margin-top: 25px; }
                        th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; font-size: 11px; }
                        th { background-color: #f8fafc; font-weight: 600; color: #475569; }
                        .badge { padding: 3px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; }
                        .badge-Available { background-color: #e0f2fe; color: #0369a1; }
                        .badge-Busy { background-color: #fff7ed; color: #c2410c; }
                    </style>
                </head>
                <body>
                    <h1>Kerala Disaster Intelligence Platform</h1>
                    <p>Emergency Volunteer Force List - Generated ${new Date().toLocaleString()}</p>
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>District</th>
                                <th>Status</th>
                                <th>Team</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Skills</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredVolunteers.map(v => {
            const isAv = v.status === "Available" || v.availability;
            const st = isAv ? "Available" : "Busy";
            return `
                                    <tr>
                                        <td><strong>${v.fullName}</strong></td>
                                        <td>${v.district || "None"}</td>
                                        <td><span class="badge badge-${st}">${st}</span></td>
                                        <td>${v.team || "Independent"}</td>
                                        <td>${v.email || "None"}</td>
                                        <td>${v.phone || "None"}</td>
                                        <td>${(v.skills || []).join(", ") || "General Aid"}</td>
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
        toast.success("PDF report generated.");
    };

    const isFilteredEmpty = !isLoading && !error && volunteers.length > 0 && filteredVolunteers.length === 0;
    const isListEmpty = !isLoading && !error && volunteers.length === 0;
    const errorMessage = typeof error === "string" ? error : error?.message || "Unable to load volunteers.";

    return (
        <MainLayout>
            <Header
                title="Volunteer & Rescue Forces"
                subtitle="Register rescue teams, manage volunteer availability, locate emergency personnel, and dispatch resources."
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
                                {formatNumber(summaryValues[stat.key])}
                            </div>
                            <div className="mt-1 text-sm font-medium text-slate-600">{stat.label}</div>
                        </div>
                    );
                })}
            </div>

            {/* Search and Action Bar */}
            <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_180px_auto_auto_auto] lg:items-center">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                        <input
                            type="search"
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Search by name, team, skills, or district..."
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-400/10 font-bold"
                        />
                    </div>

                    <div className="relative">
                        <select
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value)}
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
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-650 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-shadow hover:bg-blue-700 cursor-pointer"
                    >
                        <Plus className="h-4 w-4" />
                        Register Volunteer
                    </button>
                </div>
            </div>

            {/* Main Grid Content */}
            {isLoading ? (
                <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div
                            key={index}
                            className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-3">
                                    <div className="h-5 w-48 rounded-full bg-slate-100" />
                                    <div className="h-4 w-32 rounded-full bg-slate-100" />
                                </div>
                                <div className="h-8 w-24 rounded-full bg-slate-100" />
                            </div>
                            <div className="mt-6 grid grid-cols-2 gap-4">
                                <div className="h-14 rounded-2xl bg-slate-100" />
                                <div className="h-14 rounded-2xl bg-slate-100" />
                            </div>
                            <div className="mt-6 h-10 rounded-full bg-slate-100" />
                        </div>
                    ))}
                </div>
            ) : error ? (
                <div className="mt-8 rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                        <ShieldAlert className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-slate-900">Unable to load volunteers</h3>
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
                        <Users className="h-7 w-7" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-slate-900">No volunteers registered yet</h3>
                    <p className="mt-2 text-sm text-slate-500">
                        Add rescue teams and first-responder volunteers to start assigning them to flood/landslide incidents.
                    </p>
                    <button
                        type="button"
                        onClick={handleOpenAddModal}
                        className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-600"
                    >
                        <Plus className="h-4 w-4" />
                        Register Volunteer
                    </button>
                </div>
            ) : isFilteredEmpty ? (
                <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
                        <Search className="h-7 w-7" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-slate-900">No matching volunteers</h3>
                    <p className="mt-2 text-sm text-slate-500">Try a different search term or choose a different availability filter.</p>
                </div>
            ) : (
                <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2 font-sans animate-fadeIn">
                    {filteredVolunteers.map((vol) => {
                        const isAvail = vol.status === "Available" || vol.availability;
                        const statusStr = isAvail ? "Available" : "Busy";
                        const badgeClass = isAvail ? statusStyles.Available : statusStyles.Busy;

                        return (
                            <article
                                key={vol?._id}
                                className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between"
                            >
                                <div className="flex flex-col gap-4">
                                    {/* Card Header */}
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <h3 className="text-xl font-bold text-slate-900">{vol?.fullName}</h3>
                                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${badgeClass}`}>
                                                {statusStr}
                                            </span>
                                        </div>
                                        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-slate-500 font-semibold">
                                            <MapPin className="h-4 w-4 text-blue-600" />
                                            <span className="font-bold text-slate-700">{vol?.district || "Unknown District"}</span>
                                            {vol?.team && (
                                                <>
                                                    <span className="text-slate-300">•</span>
                                                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold">
                                                        {vol.team}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold font-mono">
                                            <span>Latitude: {vol?.latitude}</span>
                                            <span>•</span>
                                            <span>Longitude: {vol?.longitude}</span>
                                        </div>
                                    </div>

                                    {/* Contact Info */}
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mt-1">
                                        <div className="flex items-center gap-2.5 rounded-2xl bg-slate-50 p-3 text-xs text-slate-800 border border-slate-100">
                                            <Phone className="h-4 w-4 text-slate-500" />
                                            <span className="font-semibold text-slate-700 truncate">{vol?.phone}</span>
                                        </div>
                                        <div className="flex items-center gap-2.5 rounded-2xl bg-slate-50 p-3 text-xs text-slate-800 border border-slate-100">
                                            <Mail className="h-4 w-4 text-slate-500" />
                                            <span className="font-semibold text-slate-700 truncate">{vol?.email}</span>
                                        </div>
                                    </div>

                                    {/* Skills List */}
                                    {vol?.skills && vol.skills.length > 0 && (
                                        <div className="mt-2">
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Skills</div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {vol.skills.map((skill, i) => (
                                                    <span
                                                        key={i}
                                                        className="inline-block bg-sky-50 text-sky-800 border border-sky-100 rounded-lg px-2.5 py-1 text-xs font-semibold"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Incident Assignment Section */}
                                    {vol?.currentIncident && (
                                        <div className="mt-2 border-t border-slate-100 pt-4 animate-fadeIn">
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5 mb-2">
                                                <Activity className="h-3.5 w-3.5" />
                                                Active Dispatched Mission
                                            </div>
                                            <div className="rounded-2xl border border-amber-205 bg-amber-50/50 p-3 text-xs font-semibold">
                                                <div className="font-bold text-slate-900">{vol.currentIncident.title || vol.currentIncident}</div>
                                                <div className="text-slate-500 text-[10px] mt-1 font-semibold">
                                                    Category: {vol.currentIncident.category || "General"} • Severity: {vol.currentIncident.severity || "Unknown"}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => handleViewOnMap(vol)}
                                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-750"
                                    >
                                        <Map className="h-3.5 w-3.5" />
                                        Locate
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleEditVolunteer(vol)}
                                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-705"
                                    >
                                        <PencilLine className="h-3.5 w-3.5" />
                                        Edit
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => toggleStatus(vol)}
                                        className={`inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition ${isAvail
                                            ? "hover:border-amber-300 hover:bg-amber-50 hover:text-amber-705"
                                            : "hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-705"
                                            }`}
                                    >
                                        <RefreshCcw className="h-3.5 w-3.5" />
                                        Mark {isAvail ? "Busy" : "Available"}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleDeleteVolunteer(vol)}
                                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-705 ml-auto text-rose-600"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Remove
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}

            <VolunteerModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmitVolunteer}
                initialData={selectedVolunteer}
                loading={loading}
                mode={mode}
            />

            <DeleteVolunteerDialog
                isOpen={isDeleteDialogOpen}
                onClose={handleCloseDeleteDialog}
                onConfirm={handleConfirmDelete}
                volunteer={selectedVolunteer}
                loading={deleteLoading}
            />
        </MainLayout>
    );
};

export default VolunteerPage;
