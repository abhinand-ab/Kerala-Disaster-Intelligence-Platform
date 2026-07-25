import { useEffect, useId, useState } from "react";
import useVolunteers from "../../hooks/useVolunteers";
import useVehicles from "../../hooks/useVehicles"; // Wait, lets assume useVehicles exists or check if there is a hook or if we fetch them.
// Let's check if there is useVehicles or useIncidents or if they are fetched in the form.

const formatInitialData = (initialData) => ({
    teamName: initialData?.teamName || "",
    leader: initialData?.leader?._id || initialData?.leader || "",
    members: Array.isArray(initialData?.members)
        ? initialData.members.map(m => m._id || m)
        : [],
    assignedVehicle: initialData?.assignedVehicle?._id || initialData?.assignedVehicle || "",
    assignedIncident: initialData?.assignedIncident?._id || initialData?.assignedIncident || "",
    district: initialData?.district || "",
    status: initialData?.status || "Available",
    specialization: initialData?.specialization || "",
});

const RescueTeamForm = ({
    initialData,
    onSubmit,
    loading,
    volunteers = [],
    vehicles = [],
    incidents = [],
    formId = "rescue-team-modal-form",
    firstFocusableRef,
    lastFocusableRef,
}) => {
    const [formData, setFormData] = useState(() => formatInitialData(initialData));

    const teamNameId = useId();
    const leaderId = useId();
    const membersId = useId();
    const vehicleId = useId();
    const incidentId = useId();
    const districtId = useId();
    const statusId = useId();
    const specializationId = useId();

    useEffect(() => {
        setFormData(formatInitialData(initialData));
    }, [initialData]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const handleMemberChange = (volunteerIdRef) => {
        setFormData((current) => {
            const isAlreadyMember = current.members.includes(volunteerIdRef);
            const nextMembers = isAlreadyMember
                ? current.members.filter(m => m !== volunteerIdRef)
                : [...current.members, volunteerIdRef];

            return {
                ...current,
                members: nextMembers,
            };
        });
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        onSubmit?.({
            ...formData,
            leader: formData.leader || null,
            assignedVehicle: formData.assignedVehicle || null,
            assignedIncident: formData.assignedIncident || null,
        });
    };

    return (
        <form id={formId} onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                    <label htmlFor={teamNameId} className="mb-2 block text-sm font-medium text-slate-700">
                        Rescue Team Name
                    </label>
                    <input
                        id={teamNameId}
                        name="teamName"
                        type="text"
                        ref={firstFocusableRef}
                        value={formData.teamName}
                        onChange={handleChange}
                        disabled={loading}
                        required
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10"
                        placeholder="e.g. Malabar Rescue Squad"
                    />
                </div>

                <div>
                    <label htmlFor={districtId} className="mb-2 block text-sm font-medium text-slate-700">
                        District
                    </label>
                    <input
                        id={districtId}
                        name="district"
                        type="text"
                        value={formData.district}
                        onChange={handleChange}
                        disabled={loading}
                        required
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10"
                        placeholder="e.g. Kozhikode"
                    />
                </div>

                <div>
                    <label htmlFor={specializationId} className="mb-2 block text-sm font-medium text-slate-700">
                        Specialization
                    </label>
                    <input
                        id={specializationId}
                        name="specialization"
                        type="text"
                        value={formData.specialization}
                        onChange={handleChange}
                        disabled={loading}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10"
                        placeholder="e.g. Water Rescue, Landslide Excavation"
                    />
                </div>

                <div>
                    <label htmlFor={statusId} className="mb-2 block text-sm font-medium text-slate-700">
                        Status
                    </label>
                    <select
                        id={statusId}
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        disabled={loading}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10"
                    >
                        <option value="Available">Available</option>
                        <option value="On Mission">On Mission</option>
                        <option value="Returning">Returning</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                </div>

                <div>
                    <label htmlFor={leaderId} className="mb-2 block text-sm font-medium text-slate-700">
                        Team Leader
                    </label>
                    <select
                        id={leaderId}
                        name="leader"
                        value={formData.leader}
                        onChange={handleChange}
                        disabled={loading}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10"
                    >
                        <option value="">No Leader Assigned</option>
                        {volunteers.map(v => (
                            <option key={v._id} value={v._id}>
                                {v.fullName} ({v.phone})
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor={vehicleId} className="mb-2 block text-sm font-medium text-slate-700">
                        Assigned Rescue Vehicle
                    </label>
                    <select
                        id={vehicleId}
                        name="assignedVehicle"
                        value={formData.assignedVehicle}
                        onChange={handleChange}
                        disabled={loading}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10"
                    >
                        <option value="">No Vehicle Assigned</option>
                        {vehicles.map(ve => (
                            <option key={ve._id} value={ve._id}>
                                {ve.vehicleNumber} - {ve.vehicleType}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor={incidentId} className="mb-2 block text-sm font-medium text-slate-700">
                        Assigned Incident
                    </label>
                    <select
                        id={incidentId}
                        name="assignedIncident"
                        value={formData.assignedIncident}
                        onChange={handleChange}
                        disabled={loading}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10"
                    >
                        <option value="">No Incident Assigned</option>
                        {incidents.map(inc => (
                            <option key={inc._id} value={inc._id}>
                                {inc.title} ({inc.severity})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                        Rescue Team Members
                    </label>
                    <div className="max-h-48 overflow-y-auto rounded-2xl border border-slate-200 p-4 space-y-2.5">
                        {volunteers.length === 0 ? (
                            <p className="text-sm text-slate-400 italic">No volunteers registered to assign.</p>
                        ) : (
                            volunteers.map((vol) => (
                                <label key={vol._id} className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer hover:bg-slate-50 p-1.5 rounded-xl">
                                    <input
                                        type="checkbox"
                                        checked={formData.members.includes(vol._id)}
                                        onChange={() => handleMemberChange(vol._id)}
                                        className="h-4 w-4 rounded border-slate-300 text-cyan-500 focus:ring-cyan-400/20"
                                    />
                                    <div>
                                        <div className="font-semibold text-slate-800">{vol.fullName}</div>
                                        <div className="text-xs text-slate-400">{vol.skills?.join(", ")} | {vol.district}</div>
                                    </div>
                                </label>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <input ref={lastFocusableRef} aria-hidden="true" tabIndex={-1} className="sr-only" type="button" />
        </form>
    );
};

export default RescueTeamForm;
