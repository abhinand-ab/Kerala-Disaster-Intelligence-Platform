import { useState } from "react";
import {
    Users, Truck, Boxes, Building2, Send, Clock, Plus, Target, CheckCircle2, XCircle, AlertCircle, ShieldAlert
} from "lucide-react";
import {
    useJoinAgency,
    useAssignMission,
    useUpdateMissionStatus,
    useShareResource,
    useUpdateResourceStatus,
    usePostCommandMessage
} from "../../hooks/useCommandCenter";

const ActiveRoomDashboard = ({ center, allAgencies = [], rescueTeams = [], vehicles = [] }) => {
    // Actions hooks
    const joinAgencyMut = useJoinAgency();
    const assignMissionMut = useAssignMission();
    const updateMissionStatusMut = useUpdateMissionStatus();
    const shareResourceMut = useShareResource();
    const updateResourceStatusMut = useUpdateResourceStatus();
    const postMessageMut = usePostCommandMessage();

    // Local UI toggle states
    const [msgText, setMsgText] = useState("");
    const [selectedSenderAgency, setSelectedSenderAgency] = useState("");
    const [customSenderName, setCustomSenderName] = useState("");

    // Modal triggers
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [showMissionModal, setShowMissionModal] = useState(false);
    const [showResourceModal, setShowResourceModal] = useState(false);

    // Form inputs: Mission
    const [missionForm, setMissionForm] = useState({
        missionName: "",
        agencyId: "",
        description: "",
        teamIds: [],
        vehicleIds: [],
        location: { latitude: 10.0, longitude: 76.0 } // default coordinates
    });

    // Form inputs: Resource Share
    const [resourceForm, setResourceForm] = useState({
        resourceType: "Warehouse Supplies",
        name: "",
        fromAgencyId: "",
        toAgencyId: "",
        quantity: 1,
        details: ""
    });

    // Handle Join Agency
    const handleJoinAgency = (agencyId) => {
        if (!agencyId) return;
        joinAgencyMut.mutate({ id: center._id, agencyId }, {
            onSuccess: () => setShowJoinModal(false)
        });
    };

    // Handle Dispatch Mission
    const handleDispatchMission = (e) => {
        e.preventDefault();
        if (!missionForm.missionName || !missionForm.agencyId) return;
        assignMissionMut.mutate({
            id: center._id,
            missionData: {
                missionName: missionForm.missionName,
                agencyId: missionForm.agencyId,
                description: missionForm.description,
                teamIds: missionForm.teamIds,
                vehicleIds: missionForm.vehicleIds,
                location: {
                    latitude: Number(center.incident?.location?.latitude) || 10.85,
                    longitude: Number(center.incident?.location?.longitude) || 76.27
                }
            }
        }, {
            onSuccess: () => {
                setShowMissionModal(false);
                setMissionForm({ missionName: "", agencyId: "", description: "", teamIds: [], vehicleIds: [], location: { latitude: 10.0, longitude: 76.0 } });
            }
        });
    };

    // Handle Resource Share
    const handleShareResource = (e) => {
        e.preventDefault();
        if (!resourceForm.name || !resourceForm.fromAgencyId) return;
        shareResourceMut.mutate({
            id: center._id,
            resourceData: {
                ...resourceForm,
                quantity: Number(resourceForm.quantity)
            }
        }, {
            onSuccess: () => {
                setShowResourceModal(false);
                setResourceForm({ resourceType: "Warehouse Supplies", name: "", fromAgencyId: "", toAgencyId: "", quantity: 1, details: "" });
            }
        });
    };

    // Handle Post message
    const handlePostMessage = (e) => {
        e.preventDefault();
        if (!msgText.trim()) return;
        postMessageMut.mutate({
            id: center._id,
            messageData: {
                message: msgText,
                agencyId: selectedSenderAgency || undefined,
                sender: customSenderName || "State Commander"
            }
        }, {
            onSuccess: () => setMsgText("")
        });
    };

    // Available agencies that haven't joined yet
    const joinedIds = (center.participatingAgencies || []).map(a => a._id);
    const unjoinedAgencies = allAgencies.filter(a => !joinedIds.includes(a._id));

    // Available teams & vehicles belonging to active agencies
    const availableTeams = rescueTeams.filter(t => t.status === "Available");
    const availableVehicles = vehicles.filter(v => v.status === "Available");

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Column 1 & 2: Active Agencies, Missions & Resources */}
            <div className="lg:col-span-2 space-y-6">

                {/* 1. Participating Agencies Grid */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4 transition-colors">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-slate-800">Participating Disaster Response Agencies</h3>
                            <p className="text-xs text-slate-500">Cooperating entities sharing command alerts and pooling state logistics.</p>
                        </div>
                        <button
                            onClick={() => setShowJoinModal(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition duration-150"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Add Agency
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(center.participatingAgencies || []).length === 0 ? (
                            <p className="text-xs text-slate-400 py-3 italic col-span-2">No agency has joined yet. Quick add one above.</p>
                        ) : (
                            (center.participatingAgencies || []).map(agency => (
                                <div key={agency._id} className="border border-slate-100 rounded-xl p-3 flex gap-3 items-start bg-slate-50 relative hover:border-slate-200 transition-colors">
                                    <div className="p-2 bg-indigo-50 border border-indigo-150 rounded-lg text-indigo-600 mt-0.5 animate-pulse">
                                        <Building2 className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-xs font-bold text-slate-808 truncate">{agency.agencyName}</h4>
                                        <p className="text-[10px] text-slate-500 font-medium">{agency.agencyType} • {agency.district}</p>

                                        <div className="mt-2 text-[10px] text-slate-600 border-t border-slate-200/60 pt-1.5 space-y-0.5">
                                            <p className="truncate">Contact: {agency.contactPerson || "HQ Duty Officer"}</p>
                                            <p>Phone: {agency.phone || "+91 471 101"}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* 2. Active Missions List */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4 transition-colors">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-slate-800">Assigned Dispatch Missions</h3>
                            <p className="text-xs text-slate-500">Live search-and-rescue tasks dispatched to participating rescue commands.</p>
                        </div>
                        <button
                            onClick={() => setShowMissionModal(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition duration-150"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Dispatch Mission
                        </button>
                    </div>

                    <div className="space-y-3">
                        {(center.activeMissions || []).length === 0 ? (
                            <p className="text-xs text-slate-400 py-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                                No active missions dispatched yet. Deploy rescue teams and vehicles to coordinates.
                            </p>
                        ) : (
                            (center.activeMissions || []).map(mission => (
                                <div key={mission._id} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white hover:shadow-sm transition-all">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-0.5">
                                            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                                                <Target className="w-4 h-4 text-rose-500" />
                                                {mission.missionName}
                                            </h4>
                                            <p className="text-[11px] text-slate-500">
                                                Assigned To: <span className="font-semibold text-slate-700">{mission.agency?.agencyName || "General Force"}</span>
                                            </p>
                                        </div>
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${mission.status === "Completed" ? "bg-emerald-50 border-emerald-300 text-emerald-700" :
                                            mission.status === "Aborted" ? "bg-slate-100 border-slate-300 text-slate-600" :
                                                mission.status === "Ongoing" ? "bg-blue-50 border-blue-300 text-blue-700 animate-pulse" :
                                                    "bg-amber-50 border-amber-300 text-amber-700 font-semibold"
                                            }`}>
                                            {mission.status}
                                        </span>
                                    </div>

                                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        {mission.description || "No specific detailed description provided."}
                                    </p>

                                    <div className="flex flex-wrap items-center justify-between text-xs text-slate-505 border-t border-slate-100 pt-3">
                                        <div className="flex gap-4">
                                            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-slate-400" /> {(mission.teams || []).length} Teams</span>
                                            <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5 text-slate-400" /> {(mission.vehicles || []).length} Vehicles</span>
                                        </div>

                                        <div className="flex gap-1.5">
                                            {mission.status === "Dispatched" && (
                                                <button
                                                    onClick={() => updateMissionStatusMut.mutate({ id: center._id, missionId: mission._id, status: "Ongoing" })}
                                                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-semibold"
                                                >
                                                    Start Mission
                                                </button>
                                            )}
                                            {["Dispatched", "Ongoing"].includes(mission.status) && (
                                                <>
                                                    <button
                                                        onClick={() => updateMissionStatusMut.mutate({ id: center._id, missionId: mission._id, status: "Completed" })}
                                                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-semibold"
                                                    >
                                                        Mark Completed
                                                    </button>
                                                    <button
                                                        onClick={() => updateMissionStatusMut.mutate({ id: center._id, missionId: mission._id, status: "Aborted" })}
                                                        className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-707 rounded text-[10px] font-semibold"
                                                    >
                                                        Abort
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* 3. Shared Resource Pool Ledger */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4 transition-colors">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-slate-805">Cooperative Resource Sharing Ledger</h3>
                            <p className="text-xs text-slate-500">Cross-agency shared machinery, boat squads, shelter grids, and raw materials.</p>
                        </div>
                        <button
                            onClick={() => setShowResourceModal(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition duration-150"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Share Resource
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100 text-xs text-left">
                            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                                <tr>
                                    <th className="py-2.5 px-3">Resource</th>
                                    <th className="py-2.5 px-3">Quantity & Type</th>
                                    <th className="py-2.5 px-3">From Agency</th>
                                    <th className="py-2.5 px-3">Target Destination</th>
                                    <th className="py-2.5 px-3">Status</th>
                                    <th className="py-2.5 px-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {(center.sharedResources || []).length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="py-6 text-center text-slate-400 italic">No resources added/shared in the coordination board.</td>
                                    </tr>
                                ) : (
                                    (center.sharedResources || []).map(item => (
                                        <tr key={item._id} className="hover:bg-slate-50/50">
                                            <td className="py-3 px-3">
                                                <div className="font-semibold text-slate-900">{item.name}</div>
                                                <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{item.details || "No details"}</div>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className="font-bold text-slate-900">{item.quantity}x</span>
                                                <span className="ml-1 text-[10px] text-slate-500 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">{item.resourceType}</span>
                                            </td>
                                            <td className="py-3 px-3 font-medium text-slate-700">{item.fromAgency?.agencyName || "Primary Command"}</td>
                                            <td className="py-3 px-3 text-slate-505 font-medium">{item.toAgency?.agencyName || "Command Pool"}</td>
                                            <td className="py-3 px-3">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${item.status === "Approved" ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
                                                    item.status === "Rejected" ? "bg-rose-50 border-rose-200 text-rose-700" :
                                                        item.status === "Deployed" ? "bg-blue-50 border-blue-200 text-blue-700" :
                                                            "bg-amber-50 border-amber-200 text-amber-700"
                                                    }`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-3 text-right">
                                                <div className="flex gap-1 justify-end">
                                                    {item.status === "Requested" && (
                                                        <>
                                                            <button
                                                                onClick={() => updateResourceStatusMut.mutate({ id: center._id, resourceId: item._id, status: "Approved" })}
                                                                className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[9px] font-bold"
                                                            >
                                                                Approve
                                                            </button>
                                                            <button
                                                                onClick={() => updateResourceStatusMut.mutate({ id: center._id, resourceId: item._id, status: "Rejected" })}
                                                                className="px-2 py-0.5 bg-rose-605 hover:bg-rose-700 text-white rounded text-[9px] font-bold"
                                                            >
                                                                Reject
                                                            </button>
                                                        </>
                                                    )}
                                                    {item.status === "Approved" && (
                                                        <button
                                                            onClick={() => updateResourceStatusMut.mutate({ id: center._id, resourceId: item._id, status: "Deployed" })}
                                                            className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[9px] font-bold"
                                                        >
                                                            Deploy
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* Column 3: Live chat, announcements & Timeline */}
            <div className="space-y-6">

                {/* 1. Joint Live Communication & Announcement Panel */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 flex flex-col h-[400px] transition-colors">
                    <div className="border-b border-slate-100 pb-3">
                        <h3 className="text-sm font-bold text-slate-805 flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4 text-indigo-600" />
                            Live Command Feed & Msg Board
                        </h3>
                        <p className="text-[11px] text-slate-500">Real-time alerts broadcasted to all logged-in operators.</p>
                    </div>

                    {/* Messages Body */}
                    <div className="flex-1 overflow-y-auto py-3 space-y-3 scrollbar-thin">
                        {(center.messages || []).length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 italic text-xs space-y-1">
                                <p>No logs posted in dispatch feed.</p>
                                <p className="text-[10px] text-slate-350">Submit announcements/alerts below.</p>
                            </div>
                        ) : (
                            (center.messages || []).map((msg, i) => (
                                <div key={i} className="flex flex-col bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1">
                                    <div className="flex items-center justify-between text-[10px]">
                                        <span className="font-bold text-slate-800">{msg.sender}</span>
                                        <span className="text-slate-400 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-700 leading-snug">{msg.message}</p>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Chat Footer Box */}
                    <form onSubmit={handlePostMessage} className="border-t border-slate-100 pt-3 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                            <select
                                size="1"
                                className="w-full text-[10px] bg-slate-50 text-slate-800 border border-slate-200 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                value={selectedSenderAgency}
                                onChange={(e) => setSelectedSenderAgency(e.target.value)}
                            >
                                <option value="">No Agency (General Command)</option>
                                {(center.participatingAgencies || []).map(a => (
                                    <option key={a._id} value={a._id}>{a.agencyName.substring(0, 24)}...</option>
                                ))}
                            </select>
                            <input
                                type="text"
                                placeholder="Sender name (e.g. Officer John)"
                                className="w-full text-[10px] bg-slate-50 text-slate-800 border border-slate-200 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                value={customSenderName}
                                onChange={(e) => setCustomSenderName(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Type alert broadcast message..."
                                className="flex-1 text-xs border border-slate-200 bg-white text-slate-800 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                value={msgText}
                                onChange={(e) => setMsgText(e.target.value)}
                            />
                            <button
                                type="submit"
                                className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition duration-75 flex items-center justify-center"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </form>
                </div>

                {/* 2. Live Command Operations Timeline */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4 max-h-[360px] overflow-y-auto">
                    <div className="border-b border-slate-100 pb-2">
                        <h3 className="text-sm font-bold text-slate-800">Operations Activity Timeline</h3>
                    </div>

                    <div className="relative border-l border-slate-200 pl-4 ml-2 space-y-4">
                        {(center.timeline || []).slice(0).reverse().map((event, idx) => (
                            <div key={idx} className="relative text-xs">
                                <div className="absolute -left-[21px] top-1.5 bg-white w-2 h-2 rounded-full border-2 border-indigo-600 ring-4 ring-indigo-50"></div>
                                <div className="space-y-0.5">
                                    <span className="font-bold text-slate-900 block">{event.action}</span>
                                    <p className="text-slate-600 leading-snug">{event.details}</p>
                                    <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-1 font-medium">
                                        <Clock className="w-3 h-3" />
                                        {new Date(event.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* ── MODALS SECTION ────────────────────────────────────────────────────────── */}

            {/* Join Agency Modal */}
            {showJoinModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md p-6 space-y-4 animate-scaleUp">
                        <h3 className="text-lg font-bold text-slate-900">Cooperating Agency Add Intake</h3>
                        <p className="text-xs text-slate-500">Pick an active government or civil response agency to link into the communication room.</p>

                        <div className="space-y-2 max-h-[220px] overflow-y-auto">
                            {unjoinedAgencies.length === 0 ? (
                                <p className="text-xs text-slate-400 italic text-center py-4">All available default agencies are already participating.</p>
                            ) : (
                                unjoinedAgencies.map(agency => (
                                    <div key={agency._id} className="flex justify-between items-center p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50/50 transition-colors">
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-800">{agency.agencyName}</h4>
                                            <span className="text-[10px] text-slate-500 font-semibold">{agency.agencyType} • {agency.district}</span>
                                        </div>
                                        <button
                                            onClick={() => handleJoinAgency(agency._id)}
                                            className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded font-semibold text-[10px]"
                                        >
                                            Add
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                onClick={() => setShowJoinModal(false)}
                                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Dispatch Mission Modal */}
            {showMissionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
                    <form onSubmit={handleDispatchMission} className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg p-6 space-y-4">
                        <h3 className="text-lg font-bold text-slate-900">Dispatch Search & Rescue Mission</h3>
                        <p className="text-xs text-slate-500">Deploy rescue crew and support vehicles to target hazard site. Available assets are filtered below.</p>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Mission Name *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Flooded Area Boat Squad 3 Evacuation"
                                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800 focus:ring-1 focus:ring-indigo-500"
                                    value={missionForm.missionName}
                                    onChange={(e) => setMissionForm({ ...missionForm, missionName: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Agency *</label>
                                    <select
                                        required
                                        className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800 focus:ring-1"
                                        value={missionForm.agencyId}
                                        onChange={(e) => setMissionForm({ ...missionForm, agencyId: e.target.value })}
                                    >
                                        <option value="">Select responsible agency</option>
                                        {(center.participatingAgencies || []).map(a => (
                                            <option key={a._id} value={a._id}>{a.agencyName}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Incident Area Coords</label>
                                    <input
                                        type="text"
                                        disabled
                                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-500"
                                        value={center.incident ? `${center.incident?.location?.latitude}, ${center.incident?.location?.longitude}` : "Incident Coords"}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Description / Action Plan</label>
                                <textarea
                                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 h-16 bg-white text-slate-800 focus:ring-1 focus:ring-indigo-500"
                                    placeholder="Instructions for field operators..."
                                    value={missionForm.description}
                                    onChange={(e) => setMissionForm({ ...missionForm, description: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Select Available Teams</label>
                                    <div className="border border-slate-200 rounded-lg p-2 h-[100px] overflow-y-auto text-[10px] space-y-1 bg-slate-50 text-slate-700">
                                        {availableTeams.length === 0 ? (
                                            <p className="italic text-slate-400">No teams available.</p>
                                        ) : (
                                            availableTeams.map(t => (
                                                <label key={t._id} className="flex items-center gap-1.5 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={missionForm.teamIds.includes(t._id)}
                                                        onChange={(e) => {
                                                            const ids = e.target.checked
                                                                ? [...missionForm.teamIds, t._id]
                                                                : missionForm.teamIds.filter(id => id !== t._id);
                                                            setMissionForm({ ...missionForm, teamIds: ids });
                                                        }}
                                                    />
                                                    {t.name} ({t.specialization || "Crew"})
                                                </label>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Select Available Vehicles</label>
                                    <div className="border border-slate-200 rounded-lg p-2 h-[100px] overflow-y-auto text-[10px] space-y-1 bg-slate-50 text-slate-700">
                                        {availableVehicles.length === 0 ? (
                                            <p className="italic text-slate-400">No vehicles available.</p>
                                        ) : (
                                            availableVehicles.map(v => (
                                                <label key={v._id} className="flex items-center gap-1.5 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={missionForm.vehicleIds.includes(v._id)}
                                                        onChange={(e) => {
                                                            const ids = e.target.checked
                                                                ? [...missionForm.vehicleIds, v._id]
                                                                : missionForm.vehicleIds.filter(id => id !== v._id);
                                                            setMissionForm({ ...missionForm, vehicleIds: ids });
                                                        }}
                                                    />
                                                    {v.name} ({v.type})
                                                </label>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 mt-4">
                            <button
                                type="button"
                                onClick={() => setShowMissionModal(false)}
                                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
                            >
                                Dispatch Mission
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Share Resource Modal */}
            {showResourceModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fadeIn">
                    <form onSubmit={handleShareResource} className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md p-6 space-y-4 animate-scaleUp">
                        <h3 className="text-lg font-bold text-slate-900">Share Resources to Joint Pool</h3>
                        <p className="text-xs text-slate-505">Add boat, drone squad, food packages, medical inventory or transport vehicles to control center pool.</p>

                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Resource Type *</label>
                                    <select
                                        className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 cursor-pointer focus:ring-1 focus:ring-indigo-500 bg-white text-slate-800"
                                        value={resourceForm.resourceType}
                                        onChange={(e) => setResourceForm({ ...resourceForm, resourceType: e.target.value })}
                                    >
                                        <option value="Warehouse Supplies">Warehouse Supplies</option>
                                        <option value="Vehicle">Vehicle</option>
                                        <option value="Team">Team</option>
                                        <option value="Shelter Space">Shelter Space</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Quantity *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800 focus:ring-1 focus:ring-indigo-500"
                                        value={resourceForm.quantity}
                                        onChange={(e) => setResourceForm({ ...resourceForm, quantity: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Resource Name *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Inflatable Rescue Boats, 500x Food Packs"
                                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-808"
                                    value={resourceForm.name}
                                    onChange={(e) => setResourceForm({ ...resourceForm, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">From Agency *</label>
                                    <select
                                        required
                                        className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-808"
                                        value={resourceForm.fromAgencyId}
                                        onChange={(e) => setResourceForm({ ...resourceForm, fromAgencyId: e.target.value })}
                                    >
                                        <option value="">Select providing agency</option>
                                        {(center.participatingAgencies || []).map(a => (
                                            <option key={a._id} value={a._id}>{a.agencyName}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Target Agency / Sink</label>
                                    <select
                                        className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800"
                                        value={resourceForm.toAgencyId}
                                        onChange={(e) => setResourceForm({ ...resourceForm, toAgencyId: e.target.value })}
                                    >
                                        <option value="">Command Pool (Available to all)</option>
                                        {(center.participatingAgencies || []).map(a => (
                                            <option key={a._id} value={a._id}>{a.agencyName}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Details & Specifications</label>
                                <textarea
                                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 h-16 bg-white text-slate-800 focus:ring-1"
                                    placeholder="Model specs, capacity, location details or dispatch status..."
                                    value={resourceForm.details}
                                    onChange={(e) => setResourceForm({ ...resourceForm, details: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 mt-4">
                            <button
                                type="button"
                                onClick={() => setShowResourceModal(false)}
                                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
                            >
                                Share Resource
                            </button>
                        </div>
                    </form>
                </div>
            )}

        </div>
    );
};

export default ActiveRoomDashboard;
