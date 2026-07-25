import { useState, useMemo } from "react";
import MainLayout from "../../components/layout/MainLayout";
import Header from "../../components/layout/Header";
import Card from "../../components/common/Card";
import AvailabilityWidget from "./AvailabilityWidget";
import ActiveRoomDashboard from "./ActiveRoomDashboard";

import {
    useCommandCenters,
    useCommandCenterById,
    useCommandCenterAvailability,
    useCommandCenterAgencies,
    useCreateCommandCenter
} from "../../hooks/useCommandCenter";
import useIncidents from "../../features/incidents/hooks/useIncidents";
import useRescueTeams from "../../hooks/useRescueTeams";
import useVehicles from "../../hooks/useVehicles";

import {
    Building2, Activity, LayoutGrid, Target, Plus, ChevronRight, Users, Truck, AlertTriangle, HelpCircle, Sparkles, PlusCircle
} from "lucide-react";

const CommandCenterPage = () => {
    // Selection state
    const [selectedCenterId, setSelectedCenterId] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Form state for new CommandCenter
    const [newCenterForm, setNewCenterForm] = useState({
        incidentId: "",
        commander: "",
        objectivesText: "",
        participatingAgencyIds: []
    });

    // Queries
    const { data: centers = [], isLoading: centersLoading } = useCommandCenters();
    const { data: centerDetail, isLoading: detailLoading } = useCommandCenterById(selectedCenterId);
    const { data: availabilityData, isLoading: availabilityLoading } = useCommandCenterAvailability();
    const { data: agencies = [] } = useCommandCenterAgencies();
    const { incidents = [], loading: incidentsLoading } = useIncidents();
    const { teams = [] } = useRescueTeams();
    const { vehicles = [] } = useVehicles();

    // Establish Mutation
    const createCenterMut = useCreateCommandCenter();

    // Objectives formatter
    const handleCreateCenter = (e) => {
        e.preventDefault();
        if (!newCenterForm.incidentId || !newCenterForm.commander) return;

        const objectives = newCenterForm.objectivesText
            ? newCenterForm.objectivesText.split("\n").filter(o => o.trim() !== "")
            : ["Search and Rescue Operations", "Establish Communication Link", "Distribute critical supplies"];

        createCenterMut.mutate({
            incidentId: newCenterForm.incidentId,
            commander: newCenterForm.commander,
            objectives,
            participatingAgencyIds: newCenterForm.participatingAgencyIds
        }, {
            onSuccess: (data) => {
                setShowCreateModal(false);
                setSelectedCenterId(data._id);
                setNewCenterForm({ incidentId: "", commander: "", objectivesText: "", participatingAgencyIds: [] });
            }
        });
    };

    // Filter out incidents that are already coordinated to make UI clean
    const coordinatedIncidentIds = useMemo(() => {
        return centers.map(c => c.incident?._id || c.incident);
    }, [centers]);

    const uncoordinatedIncidents = useMemo(() => {
        return incidents.filter(inc => !coordinatedIncidentIds.includes(inc._id));
    }, [incidents, coordinatedIncidentIds]);

    // Active room reference
    const activeCenter = centerDetail || null;

    // SVG statistics calculations
    const stats = useMemo(() => {
        if (!activeCenter) return null;
        const missions = activeCenter.activeMissions || [];
        const completed = missions.filter(m => m.status === "Completed").length;
        const ongoing = missions.filter(m => m.status === "Ongoing").length;
        const dispatched = missions.filter(m => m.status === "Dispatched").length;
        const aborted = missions.filter(m => m.status === "Aborted").length;
        const total = missions.length;

        const resources = activeCenter.sharedResources || [];
        const resourceTypes = resources.reduce((acc, item) => {
            acc[item.resourceType] = (acc[item.resourceType] || 0) + item.quantity;
            return acc;
        }, { Supplies: 0, Vehicles: 0, Personnel: 0, "Evacuation Spaces": 0 });

        return {
            totalMissions: total,
            completed,
            ongoing,
            dispatched,
            aborted,
            successRate: total > 0 ? Math.round((completed / total) * 100) : 0,
            resourceSum: resourceTypes
        };
    }, [activeCenter]);

    return (
        <MainLayout>
            <Header title="Crisis Command" />
            <div className="bg-slate-50 min-h-screen pb-12 font-sans transition-colors duration-150">
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

                    {/* TOP SECTION: Title and Establishment buttons */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                                <Building2 className="w-7 h-7 text-indigo-600 animate-pulse" />
                                Multi-Agency Command & Control Centers
                            </h2>
                            <p className="text-slate-500 text-sm">
                                Establish centralized joint coordinates to synchronize civil commands, rescue teams, resources and live communications in real-time.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 text-sm rounded-xl border border-indigo-700 shadow-md transform hover:-translate-y-0.5 transition-all duration-150"
                        >
                            <Plus className="w-4 h-4" />
                            Establish Command Room
                        </button>
                    </div>

                    {/* RESOURCE POOL OVERVIEW */}
                    <AvailabilityWidget availability={availabilityData} isLoading={availabilityLoading} />

                    {/* COMMAND CENTER DETAILS CONTAINER */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                        {/* LEFT COLUMN: ACTIVE SESSIONS */}
                        <div className="lg:col-span-1 space-y-4">
                            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-3">
                                <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Active Command Sessions</h3>

                                <div className="space-y-2">
                                    {centersLoading ? (
                                        <div className="space-y-1.5 py-4">
                                            <div className="h-10 bg-slate-100 rounded animate-pulse"></div>
                                            <div className="h-10 bg-slate-100 rounded animate-pulse"></div>
                                        </div>
                                    ) : centers.length === 0 ? (
                                        <div className="text-center py-6 text-slate-400 text-xs italic">
                                            No command rooms established yet. Click below or above to initialize command.
                                        </div>
                                    ) : (
                                        centers.map(center => {
                                            const isSelected = selectedCenterId === center._id;
                                            return (
                                                <button
                                                    key={center._id}
                                                    onClick={() => setSelectedCenterId(center._id)}
                                                    className={`w-full text-left p-3 rounded-xl border transition-all duration-100 flex items-center justify-between gap-2 ${isSelected
                                                        ? "bg-indigo-50 border-indigo-305 text-indigo-900 shadow-sm"
                                                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                                        }`}
                                                >
                                                    <div className="min-w-0">
                                                        <span className="font-bold text-xs truncate block">{center.incident?.title || "Incident Command"}</span>
                                                        <span className="text-[10px] text-slate-400 block truncate mt-0.5">CMDR: {center.assignedCommander}</span>
                                                    </div>
                                                    <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? "text-indigo-600 translate-x-0.5" : "text-slate-400"}`} />
                                                </button>
                                            );
                                        })
                                    )}
                                </div>

                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="w-full mt-3 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition duration-150 flex items-center justify-center gap-1.5"
                                >
                                    <PlusCircle className="w-4 h-4" />
                                    Establish Command Room
                                </button>
                            </div>
                        </div>

                        {/* RIGHT GRID: ACTIVE COORDINATION ROOM */}
                        <div className="lg:col-span-3 space-y-6">
                            {!selectedCenterId ? (
                                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[400px] shadow-sm space-y-4">
                                    <div className="p-4 bg-indigo-50 rounded-full border border-indigo-100 text-indigo-600 animate-bounce">
                                        <Activity className="w-10 h-10" />
                                    </div>
                                    <div className="max-w-md space-y-1">
                                        <h3 className="text-lg font-bold text-slate-800">No Command Room Selected</h3>
                                        <p className="text-xs text-slate-500">
                                            Select an active command session from the left side panel to start dispatching rescue teams, reviewing shared logistics, and sending joint announcements.
                                        </p>
                                    </div>
                                </div>
                            ) : detailLoading ? (
                                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[400px] shadow-sm space-y-3">
                                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-xs text-slate-500">Fetching live coordination log & participants...</span>
                                </div>
                            ) : !activeCenter ? (
                                <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-6 text-center text-xs">
                                    Failed to retrieve selected command center details. Try another session.
                                </div>
                            ) : (
                                <div className="space-y-6">

                                    {/* Command Center Title Card */}
                                    <div className="bg-white border border-slate-202 rounded-2xl shadow-sm p-6 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                        <div className="space-y-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 border border-indigo-200 text-indigo-700">
                                                    🏢 INCIDENT COMMAND POST
                                                </span>
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 border border-emerald-202 text-emerald-700">
                                                    Active Coords: {activeCenter.incident?.location?.district || "State"}
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-black text-slate-900 leading-snug">
                                                {activeCenter.incident?.title || "Establishment Point"}
                                            </h3>
                                            <p className="text-xs text-slate-500">
                                                Inc. Commander: <strong className="text-slate-800">{activeCenter.assignedCommander}</strong> • Objectives registered: <strong className="text-slate-808">{(activeCenter.objectives || []).length}</strong>
                                            </p>
                                        </div>

                                        {/* Step 13 Custom SVGs statistics visualizer */}
                                        {stats && (
                                            <div className="flex gap-6 shrink-0 bg-slate-50 border border-slate-100 p-4 rounded-xl">
                                                {/* Donut Success rate */}
                                                <div className="flex items-center gap-3">
                                                    <svg width="50" height="50" viewBox="0 0 36 36" className="rotate-[-90deg]">
                                                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-200" />
                                                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10b981" strokeWidth="3"
                                                            strokeDasharray={`${stats.successRate} ${100 - stats.successRate}`}
                                                        />
                                                    </svg>
                                                    <div>
                                                        <span className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider">Missions Done</span>
                                                        <span className="text-sm font-black text-slate-909">{stats.successRate}%</span>
                                                        <span className="text-[10px] text-slate-400 block">{stats.completed}/{stats.totalMissions} Completed</span>
                                                    </div>
                                                </div>

                                                {/* Stacked bar or stock numbers */}
                                                <div className="border-l border-slate-200 pl-4 space-y-1 text-xs">
                                                    <span className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider">Shared Stocks</span>
                                                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[10px] text-slate-650 font-medium">
                                                        <div>Supplies: <strong className="text-indigo-600">{stats.resourceSum.Supplies}</strong></div>
                                                        <div>Vehicles: <strong className="text-amber-500">{stats.resourceSum.Vehicles}</strong></div>
                                                        <div>Staff: <strong className="text-emerald-505">{stats.resourceSum.Personnel}</strong></div>
                                                        <div>Shelter: <strong className="text-cyan-500">{stats.resourceSum["Evacuation Spaces"]}</strong></div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Main active dashboard component */}
                                    <ActiveRoomDashboard
                                        center={activeCenter}
                                        allAgencies={agencies}
                                        rescueTeams={teams}
                                        vehicles={vehicles}
                                    />
                                </div>
                            )}
                        </div>

                    </div>

                </main>
            </div>

            {/* ── ESTABLISH COMMAND ROOM MODAL ─────────────────────────────────────────────────── */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
                    <form onSubmit={handleCreateCenter} className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg p-6 space-y-4 animate-scaleUp">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Establish Joint Command Center</h3>
                            <p className="text-xs text-slate-505">Pick an active incident hazard zone to establish a joint coordination room.</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Select Incident Hazard *</label>
                                <select
                                    required
                                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 cursor-pointer focus:ring-1 focus:ring-indigo-500 bg-white text-slate-800"
                                    value={newCenterForm.incidentId}
                                    onChange={(e) => setNewCenterForm({ ...newCenterForm, incidentId: e.target.value })}
                                >
                                    <option value="">Choose an active incident...</option>
                                    {uncoordinatedIncidents.map(inc => (
                                        <option key={inc._id} value={inc._id}>
                                            [{inc.severity}] {inc.title} ({inc.location?.district})
                                        </option>
                                    ))}
                                    {coordinatedIncidentIds.length > 0 && incidents.filter(i => coordinatedIncidentIds.includes(i._id)).map(inc => (
                                        <option key={inc._id} value={inc._id} className="text-slate-400">
                                            Already Managed: {inc.title}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Crisis Commander Name *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Major General Kumar"
                                        className="w-full text-xs border border-slate-202 rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 bg-white text-slate-800"
                                        value={newCenterForm.commander}
                                        onChange={(e) => setNewCenterForm({ ...newCenterForm, commander: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Initial Participating Agencies</label>
                                    <div className="border border-slate-200 rounded-lg p-2 h-[100px] overflow-y-auto text-[10px] space-y-1 bg-slate-50 text-slate-800">
                                        {agencies.length === 0 ? (
                                            <p className="italic text-slate-400">No agencies registered.</p>
                                        ) : (
                                            agencies.map(a => (
                                                <label key={a._id} className="flex items-center gap-1.5 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={newCenterForm.participatingAgencyIds.includes(a._id)}
                                                        onChange={(e) => {
                                                            const ids = e.target.checked
                                                                ? [...newCenterForm.participatingAgencyIds, a._id]
                                                                : newCenterForm.participatingAgencyIds.filter(id => id !== a._id);
                                                            setNewCenterForm({ ...newCenterForm, participatingAgencyIds: ids });
                                                        }}
                                                    />
                                                    {a.agencyName}
                                                </label>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-707 mb-1">Objectives (one per line)</label>
                                <textarea
                                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 h-20 bg-white text-slate-800 focus:ring-1 focus:ring-indigo-500"
                                    placeholder="Rescue trapped residents in Flooded sector A&#10;Coordinate drinking water dispatch to shelters&#10;Verify cell tower backup operations"
                                    value={newCenterForm.objectivesText}
                                    onChange={(e) => setNewCenterForm({ ...newCenterForm, objectivesText: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 mt-4">
                            <button
                                type="button"
                                onClick={() => setShowCreateModal(false)}
                                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-lg text-xs font-semibold"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
                            >
                                Establish Room
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </MainLayout>
    );
};

export default CommandCenterPage;
