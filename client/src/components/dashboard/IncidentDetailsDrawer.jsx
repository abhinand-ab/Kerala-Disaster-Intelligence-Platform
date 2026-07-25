import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { MapContainer, TileLayer, Marker } from "react-leaflet";

import { useAuth } from "../../context/AuthContext";
import {
	assignVolunteer,
	deleteIncident,
	updateIncidentStatus,
	updateIncident,
} from "../../features/incidents/services/incidentService";
import useVolunteers from "../../features/users/hooks/useVolunteers";
import useVolunteersList from "../../hooks/useVolunteers";
import useVehicles from "../../hooks/useVehicles";
import useRescueTeams from "../../hooks/useRescueTeams";

const formatDateTime = (value) => {
	if (!value) {
		return "--";
	}

	const date = new Date(value);

	if (Number.isNaN(date.getTime())) {
		return "--";
	}

	return date.toLocaleString();
};

const IncidentDetailsDrawer = ({ isOpen, onClose, incident }) => {
	const [selectedStatus, setSelectedStatus] = useState(incident?.status || "Reported");
	const [selectedSeverity, setSelectedSeverity] = useState(incident?.severity || "Low");
	const [selectedVolunteer, setSelectedVolunteer] = useState("");
	const [deleting, setDeleting] = useState(false);
	const [savingStatus, setSavingStatus] = useState(false);
	const [savingSeverity, setSavingSeverity] = useState(false);
	const [assigning, setAssigning] = useState(false);
	const queryClient = useQueryClient();
	const { user } = useAuth();

	const { volunteers, loading: volunteersLoading } = useVolunteers();

	const {
		volunteers: rescueVolunteers,
		assignVolunteer: updateRescueAssignment,
		isLoading: rescueLoading,
	} = useVolunteersList();
	const [selectedRescueVolunteer, setSelectedRescueVolunteer] = useState("");
	const [rescueAssigning, setRescueAssigning] = useState(false);

	const {
		vehicles,
		assignVehicle: updateVehicleAssignment,
		isLoading: vehiclesLoading,
	} = useVehicles();
	const [selectedVehicle, setSelectedVehicleState] = useState("");
	const [vehicleAssigning, setVehicleAssigning] = useState(false);

	const {
		teams,
		assignTeamToIncident: updateTeamAssignment,
		isLoading: teamsLoading,
	} = useRescueTeams();
	const [selectedTeam, setSelectedTeamState] = useState("");
	const [teamAssigning, setTeamAssigning] = useState(false);

	const handleAssignVehicle = async () => {
		if (!incident) return;
		if (!selectedVehicle) {
			toast.error("Please select a rescue vehicle");
			return;
		}

		setVehicleAssigning(true);
		try {
			await updateVehicleAssignment({ id: selectedVehicle, incidentId: incident._id });
			await queryClient.invalidateQueries({ queryKey: ["vehicles"] });
			await queryClient.invalidateQueries({ queryKey: ["incidents"] });
			toast.success("Rescue vehicle assigned successfully");
			setSelectedVehicleState("");
		} catch (error) {
			toast.error(error?.message || "Failed to assign vehicle");
		} finally {
			setVehicleAssigning(false);
		}
	};

	const handleRemoveVehicle = async (vehicleId) => {
		try {
			await updateVehicleAssignment({ id: vehicleId, incidentId: null });
			await queryClient.invalidateQueries({ queryKey: ["vehicles"] });
			await queryClient.invalidateQueries({ queryKey: ["incidents"] });
			toast.success("Rescue vehicle unassigned successfully");
		} catch (error) {
			toast.error(error?.message || "Failed to remove vehicle");
		}
	};

	const handleAssignRescueVolunteer = async () => {
		if (!incident) return;
		if (!selectedRescueVolunteer) {
			toast.error("Please select a rescue volunteer/team");
			return;
		}

		setRescueAssigning(true);
		try {
			await updateRescueAssignment({ id: selectedRescueVolunteer, incidentId: incident._id });
			await queryClient.invalidateQueries({ queryKey: ["volunteers"] });
			await queryClient.invalidateQueries({ queryKey: ["incidents"] });
			toast.success("Rescue volunteer/team assigned successfully");
			setSelectedRescueVolunteer("");
		} catch (error) {
			toast.error(error?.message || "Failed to assign rescue volunteer");
		} finally {
			setRescueAssigning(false);
		}
	};

	const handleRemoveRescueVolunteer = async (volunteerId) => {
		try {
			await updateRescueAssignment({ id: volunteerId, incidentId: null });
			await queryClient.invalidateQueries({ queryKey: ["volunteers"] });
			await queryClient.invalidateQueries({ queryKey: ["incidents"] });
			toast.success("Rescue volunteer/team removed successfully");
		} catch (error) {
			toast.error(error?.message || "Failed to remove rescue volunteer");
		}
	};

	const handleAssignTeam = async () => {
		if (!incident) return;
		if (!selectedTeam) {
			toast.error("Please select a rescue team");
			return;
		}

		setTeamAssigning(true);
		try {
			await updateTeamAssignment({ id: selectedTeam, incidentId: incident._id });
			await queryClient.invalidateQueries({ queryKey: ["rescueTeams"] });
			await queryClient.invalidateQueries({ queryKey: ["incidents"] });
			toast.success("Rescue team assigned successfully");
			setSelectedTeamState("");
		} catch (error) {
			toast.error(error?.message || "Failed to assign rescue team");
		} finally {
			setTeamAssigning(false);
		}
	};

	const handleRemoveTeam = async (teamId) => {
		try {
			await updateTeamAssignment({ id: teamId, incidentId: null });
			await queryClient.invalidateQueries({ queryKey: ["rescueTeams"] });
			await queryClient.invalidateQueries({ queryKey: ["incidents"] });
			toast.success("Rescue team removed successfully");
		} catch (error) {
			toast.error(error?.message || "Failed to remove rescue team");
		}
	};

	const userRole = user?.role?.toLowerCase();
	const canAssignVolunteer = userRole === "admin";
	const canUpdateStatus = userRole === "admin" || userRole === "volunteer";
	const canDeleteIncident = userRole === "admin";

	useEffect(() => {
		setSelectedStatus(incident?.status || "Reported");
		setSelectedSeverity(incident?.severity || "Low");
	}, [incident]);

	useEffect(() => {
		setSelectedVolunteer(incident?.assignedTo?._id || "");
	}, [incident]);

	const handleDelete = async () => {
		if (!incident) {
			return;
		}

		const confirmed = window.confirm(
			"Are you sure you want to delete this incident?"
		);

		if (!confirmed) {
			return;
		}

		setDeleting(true);

		try {
			await deleteIncident(incident._id);
			await queryClient.invalidateQueries({ queryKey: ["incidents"] });
			await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
			toast.success("Incident deleted successfully");
			onClose();
		} catch (error) {
			toast.error("Failed to delete incident");
		} finally {
			setDeleting(false);
		}
	};

	const handleSaveStatus = async () => {
		if (!incident) {
			return;
		}

		if (selectedStatus === incident.status) {
			return;
		}

		setSavingStatus(true);

		try {
			await updateIncidentStatus(incident._id, selectedStatus);
			await queryClient.invalidateQueries({ queryKey: ["incidents"] });
			await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
			toast.success("Incident status updated");
		} catch (error) {
			toast.error(
				error?.response?.data?.message ||
				"Failed to update incident status"
			);
		} finally {
			setSavingStatus(false);
		}
	};

	const handleSaveSeverity = async () => {
		if (!incident) {
			return;
		}

		if (selectedSeverity === incident.severity) {
			return;
		}

		setSavingSeverity(true);

		try {
			await updateIncident(incident._id, { severity: selectedSeverity });
			await queryClient.invalidateQueries({ queryKey: ["incidents"] });
			await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
			toast.success("Incident severity updated");
		} catch (error) {
			toast.error(
				error?.response?.data?.message ||
				"Failed to update incident severity"
			);
		} finally {
			setSavingSeverity(false);
		}
	};

	const handleAssignVolunteer = async () => {
		if (!incident) {
			return;
		}

		if (!selectedVolunteer) {
			toast.error("Please select a volunteer");
			return;
		}

		setAssigning(true);

		try {
			await assignVolunteer(incident._id, selectedVolunteer);
			await queryClient.invalidateQueries({ queryKey: ["incidents"] });
			await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
			toast.success("Volunteer assigned successfully");
		} catch (error) {
			toast.error(
				error?.response?.data?.message || "Failed to assign volunteer"
			);
		} finally {
			setAssigning(false);
		}
	};

	if (!isOpen) {
		return null;
	}

	const coordinates = incident?.location
		? [incident.location.latitude, incident.location.longitude]
			.filter((coordinate) => coordinate !== undefined && coordinate !== null)
			.join(", ")
		: incident?.coordinates || "--";

	return (
		<>
			<div
				className="fixed inset-0 z-[1000] bg-slate-900/40 backdrop-blur-xs"
				onClick={onClose}
			/>

			<aside className="fixed right-0 top-0 z-[1001] flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-all duration-300">
				<div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
					<h2 className="text-lg font-bold text-slate-900">
						Incident Details Drawer
					</h2>

					<button
						type="button"
						onClick={onClose}
						className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
						aria-label="Close drawer"
					>
						<span className="text-xl leading-none font-bold">×</span>
					</button>
				</div>

				<div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 scrollbar-thin">
					{!incident ? (
						<p className="text-sm text-slate-500">
							No incident selected.
						</p>
					) : (
						<div className="space-y-4">
							<div>
								<p className="text-[10px] font-bold uppercase tracking-wider text-slate-405">
									Title
								</p>
								<p className="mt-1 text-sm font-bold text-slate-900">
									{incident.title || "--"}
								</p>
							</div>

							<div>
								<p className="text-[10px] font-bold uppercase tracking-wider text-slate-405">
									Category
								</p>
								<p className="mt-1 text-sm font-semibold text-slate-700">
									{incident.category || "--"}
								</p>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<p className="text-[10px] font-bold uppercase tracking-wider text-slate-405">
										Severity
									</p>
									<p className="mt-1 text-sm font-semibold text-slate-700">
										{incident.severity || "--"}
									</p>
								</div>

								<div>
									<p className="text-[10px] font-bold uppercase tracking-wider text-slate-405">
										Status
									</p>
									<p className="mt-1 text-sm font-semibold text-slate-700">
										{incident.status || "--"}
									</p>
								</div>
							</div>

							<div>
								<p className="text-[10px] font-bold uppercase tracking-wider text-slate-405">
									District
								</p>
								<p className="mt-1 text-sm font-semibold text-slate-700">
									{incident.location?.district || incident.district || "--"}
								</p>
							</div>

							<div>
								<p className="text-[10px] font-bold uppercase tracking-wider text-slate-405">
									Description
								</p>
								<p className="mt-1 text-sm leading-relaxed text-slate-700 font-medium">
									{incident.description || "--"}
								</p>
							</div>

							<div>
								<p className="text-[10px] font-bold uppercase tracking-wider text-slate-405">
									Coordinates
								</p>
								<p className="mt-1 text-sm text-slate-700 font-mono font-semibold">
									{coordinates}
								</p>
								{incident?.location?.latitude && incident?.location?.longitude && (
									<div className="h-40 w-full rounded-xl overflow-hidden border border-slate-200 mt-2 z-[10] relative">
										<MapContainer
											center={[incident.location.latitude, incident.location.longitude]}
											zoom={12}
											scrollWheelZoom={false}
											zoomControl={false}
											attributionControl={false}
											className="h-full w-full"
										>
											<TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
											<Marker position={[incident.location.latitude, incident.location.longitude]} />
										</MapContainer>
									</div>
								)}
							</div>

							<div>
								<p className="text-[10px] font-bold uppercase tracking-wider text-slate-405">
									Created At
								</p>
								<p className="mt-1 text-sm text-slate-705 font-medium">
									{formatDateTime(incident.createdAt)}
								</p>
							</div>

							<div className="border-t border-slate-100 pt-3">
								<p className="text-[10px] font-bold uppercase tracking-wider text-slate-405 mb-2.5">
									Incident History Timeline
								</p>
								<div className="relative border-l border-slate-200 ml-2 pl-4 space-y-4">
									<div className="relative">
										<span className="absolute -left-[22.5px] top-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-blue-600 ring-4 ring-white" />
										<p className="text-xs font-bold text-slate-800">Reported</p>
										<p className="text-[10px] text-slate-500">{formatDateTime(incident.createdAt)}</p>
									</div>

									{(incident.verificationStatus || incident.status !== "Reported") && (
										<div className="relative">
											<span className="absolute -left-[22.5px] top-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-emerald-500 ring-4 ring-white" />
											<p className="text-xs font-bold text-slate-800">Verified</p>
											<p className="text-[10px] text-slate-500 font-semibold text-emerald-600">System verified</p>
										</div>
									)}

									{(incident.status === "Assigned" || incident.status === "In Progress" || incident.status === "Resolved") && (
										<div className="relative">
											<span className="absolute -left-[22.5px] top-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-amber-500 ring-4 ring-white" />
											<p className="text-xs font-bold text-slate-800">Mission Dispatched</p>
											<p className="text-[10px] text-slate-500">Personnel & fleet assigned</p>
										</div>
									)}

									{incident.status === "Resolved" && (
										<div className="relative">
											<span className="absolute -left-[22.5px] top-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-emerald-600 ring-4 ring-white" />
											<p className="text-xs font-bold text-slate-800">Resolved</p>
											<p className="text-[10px] text-slate-505">{formatDateTime(incident.updatedAt)}</p>
										</div>
									)}
								</div>
							</div>

							{incident && (
								<div className="space-y-4 pt-2 border-t border-slate-100">
									<div>
										<p className="text-[10px] font-bold uppercase tracking-wider text-slate-405">
											Assigned Rescue Volunteers
										</p>
										{rescueVolunteers.filter(v => v.currentIncident?._id === incident._id || v.currentIncident === incident._id).length === 0 ? (
											<p className="mt-1 text-sm text-slate-500 italic font-medium">No volunteers assigned.</p>
										) : (
											<div className="mt-2 space-y-2">
												{rescueVolunteers
													.filter(v => v.currentIncident?._id === incident._id || v.currentIncident === incident._id)
													.map(v => (
														<div key={v._id} className="flex items-center justify-between bg-slate-50 rounded-2xl p-3 border border-slate-205">
															<div>
																<p className="text-sm font-bold text-slate-900">{v.fullName}</p>
																<p className="text-xs text-slate-500 font-semibold">{v.team} • {v.phone}</p>
															</div>
															{canAssignVolunteer && (
																<button
																	type="button"
																	onClick={() => handleRemoveRescueVolunteer(v._id)}
																	className="text-xs font-bold text-rose-600 hover:text-rose-800 transition cursor-pointer"
																>
																	Remove
																</button>
															)}
														</div>
													))}
											</div>
										)}
									</div>

									<div>
										<p className="text-[10px] font-bold uppercase tracking-wider text-slate-405">
											Assigned Rescue Teams
										</p>
										{teams.filter(t => t.assignedIncident?._id === incident._id || t.assignedIncident === incident._id).length === 0 ? (
											<p className="mt-1 text-sm text-slate-500 italic font-medium">No rescue teams assigned.</p>
										) : (
											<div className="mt-2 space-y-2">
												{teams
													.filter(t => t.assignedIncident?._id === incident._id || t.assignedIncident === incident._id)
													.map(t => (
														<div key={t._id} className="flex items-center justify-between bg-slate-50 rounded-2xl p-3 border border-slate-205">
															<div>
																<p className="text-sm font-bold text-slate-900">{t.teamName}</p>
																<p className="text-xs text-slate-500 font-semibold">{t.specialization || "General Triage"} • {t.district}</p>
															</div>
															{canAssignVolunteer && (
																<button
																	type="button"
																	onClick={() => handleRemoveTeam(t._id)}
																	className="text-xs font-bold text-rose-600 hover:text-rose-800 transition cursor-pointer"
																>
																	Remove
																</button>
															)}
														</div>
													))}
											</div>
										)}
									</div>

									<div>
										<p className="text-[10px] font-bold uppercase tracking-wider text-slate-405">
											Assigned Rescue Vehicles & Fleet
										</p>
										{vehicles.filter(v => (v.assignedIncident?._id === incident._id) || (v.assignedIncident === incident._id)).length === 0 ? (
											<p className="mt-1 text-sm text-slate-500 italic font-medium">No fleet units assigned.</p>
										) : (
											<div className="mt-2 space-y-2">
												{vehicles
													.filter(v => (v.assignedIncident?._id === incident._id) || (v.assignedIncident === incident._id))
													.map(v => (
														<div key={v._id} className="flex items-center justify-between bg-slate-50 rounded-2xl p-3 border border-slate-205">
															<div>
																<p className="text-sm font-bold text-slate-900">{v.vehicleNumber} ({v.vehicleType})</p>
																<p className="text-xs text-slate-500 font-semibold">Driver: {v.driverName} • {v.driverPhone}</p>
															</div>
															{canAssignVolunteer && (
																<button
																	type="button"
																	onClick={() => handleRemoveVehicle(v._id)}
																	className="text-xs font-bold text-rose-600 hover:text-rose-800 transition cursor-pointer"
																>
																	Remove
																</button>
															)}
														</div>
													))}
											</div>
										)}
									</div>
								</div>
							)}
						</div>
					)}
				</div>

				<div className="border-t border-slate-205 px-6 py-4 bg-slate-50 space-y-4">
					{canUpdateStatus && (
						<div className="grid grid-cols-2 gap-2">
							<div className="flex flex-col gap-1">
								<label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</label>
								<div className="flex gap-1.5">
									<select
										value={selectedStatus}
										onChange={(event) => setSelectedStatus(event.target.value)}
										className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition"
									>
										<option value="Reported">Reported</option>
										<option value="Verified">Verified</option>
										<option value="Assigned">Assigned</option>
										<option value="In Progress">In Progress</option>
										<option value="Resolved">Resolved</option>
										<option value="Rejected">Rejected</option>
									</select>
									<button
										type="button"
										onClick={handleSaveStatus}
										disabled={savingStatus}
										className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
									>
										Save
									</button>
								</div>
							</div>

							<div className="flex flex-col gap-1">
								<label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Severity</label>
								<div className="flex gap-1.5">
									<select
										value={selectedSeverity}
										onChange={(event) => setSelectedSeverity(event.target.value)}
										className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition"
									>
										<option value="Low">Low</option>
										<option value="Medium">Medium</option>
										<option value="High">High</option>
										<option value="Critical">Critical</option>
									</select>
									<button
										type="button"
										onClick={handleSaveSeverity}
										disabled={savingSeverity}
										className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
									>
										Save
									</button>
								</div>
							</div>
						</div>
					)}

					{canAssignVolunteer && (
						<div className="space-y-2 pt-2 border-t border-slate-200">
							<div className="flex flex-col gap-1">
								<label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Assign Rescue Volunteer</label>
								<div className="flex gap-1.5">
									<select
										value={selectedRescueVolunteer}
										onChange={(event) => setSelectedRescueVolunteer(event.target.value)}
										disabled={rescueLoading}
										className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition"
									>
										<option value="">Select Volunteer</option>
										{rescueVolunteers
											.filter(v => v.availability || v.status === "Available")
											.map(v => (
												<option key={v._id} value={v._id}>
													{v.fullName} ({v.team || "Independent"})
												</option>
											))}
									</select>
									<button
										type="button"
										onClick={handleAssignRescueVolunteer}
										disabled={rescueAssigning}
										className="rounded-xl bg-cyan-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-cyan-700 disabled:opacity-50"
									>
										Assign
									</button>
								</div>
							</div>

							<div className="flex flex-col gap-1">
								<label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Assign Rescue Team</label>
								<div className="flex gap-1.5">
									<select
										value={selectedTeam}
										onChange={(event) => setSelectedTeamState(event.target.value)}
										disabled={teamsLoading}
										className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition"
									>
										<option value="">Select Rescue Team</option>
										{teams
											.filter(t => t.status === "Available")
											.map(t => (
												<option key={t._id} value={t._id}>
													{t.teamName} ({t.specialization || "General"})
												</option>
											))}
									</select>
									<button
										type="button"
										onClick={handleAssignTeam}
										disabled={teamAssigning}
										className="rounded-xl bg-emerald-650 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
									>
										Assign
									</button>
								</div>
							</div>

							<div className="flex flex-col gap-1">
								<label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Assign Rescue Vehicle</label>
								<div className="flex gap-1.5">
									<select
										value={selectedVehicle}
										onChange={(event) => setSelectedVehicleState(event.target.value)}
										disabled={vehiclesLoading}
										className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition"
									>
										<option value="">Select Rescue Vehicle</option>
										{vehicles
											.filter(v => v.status === "Available")
											.map(v => (
												<option key={v._id} value={v._id}>
													{v.vehicleNumber} ({v.vehicleType})
												</option>
											))}
									</select>
									<button
										type="button"
										onClick={handleAssignVehicle}
										disabled={vehicleAssigning}
										className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50"
									>
										Assign
									</button>
								</div>
							</div>
						</div>
					)}

					{canDeleteIncident && (
						<div className="pt-2 border-t border-slate-200">
							<button
								type="button"
								onClick={handleDelete}
								disabled={deleting}
								className="w-full rounded-xl border border-rose-200 bg-rose-50 py-2.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100 hover:text-rose-800"
							>
								{deleting ? "Deleting Incident..." : "Delete Incident Entry"}
							</button>
						</div>
					)}
				</div>
			</aside>
		</>
	);
};

export default IncidentDetailsDrawer;
