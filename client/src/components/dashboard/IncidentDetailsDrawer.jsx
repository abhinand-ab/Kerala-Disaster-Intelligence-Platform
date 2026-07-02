import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { useAuth } from "../../context/AuthContext";
import {
	assignVolunteer,
	deleteIncident,
	updateIncidentStatus,
} from "../../features/incidents/services/incidentService";
import useVolunteers from "../../features/users/hooks/useVolunteers";

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
	const [selectedStatus, setSelectedStatus] = useState(incident?.status || "");
	const [selectedVolunteer, setSelectedVolunteer] = useState("");
	const [deleting, setDeleting] = useState(false);
	const [savingStatus, setSavingStatus] = useState(false);
	const [assigning, setAssigning] = useState(false);
	const queryClient = useQueryClient();
	const { user } = useAuth();
	const { volunteers, loading: volunteersLoading } = useVolunteers();

	const userRole = user?.role?.toLowerCase();
	const canAssignVolunteer = userRole === "admin";
	const canUpdateStatus = userRole === "admin" || userRole === "volunteer";
	const canDeleteIncident = userRole === "admin";

	useEffect(() => {
		setSelectedStatus(incident?.status || "");
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
			onClose();
		} catch (error) {
			toast.error(
				error?.response?.data?.message ||
					"Failed to update incident status"
			);
		} finally {
			setSavingStatus(false);
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
			onClose();
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
				className="fixed inset-0 z-40 bg-slate-900/40"
				onClick={onClose}
			/>

			<aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
				<div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
					<h2 className="text-lg font-semibold text-slate-900">
						Incident Details
					</h2>

					<button
						type="button"
						onClick={onClose}
						className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
						aria-label="Close drawer"
					>
						<span className="text-xl leading-none">×</span>
					</button>
				</div>

				<div className="flex-1 overflow-y-auto px-6 py-5">
					{!incident ? (
						<p className="text-sm text-slate-500">
							No incident selected.
						</p>
					) : (
						<div className="space-y-4">
							<div>
								<p className="text-xs font-medium uppercase tracking-wide text-slate-400">
									Title
								</p>
								<p className="mt-1 text-sm font-semibold text-slate-900">
									{incident.title || "--"}
								</p>
							</div>

							<div>
								<p className="text-xs font-medium uppercase tracking-wide text-slate-400">
									Category
								</p>
								<p className="mt-1 text-sm text-slate-700">
									{incident.category || "--"}
								</p>
							</div>

							<div>
								<p className="text-xs font-medium uppercase tracking-wide text-slate-400">
									Severity
								</p>
								<p className="mt-1 text-sm text-slate-700">
									{incident.severity || "--"}
								</p>
							</div>

							<div>
								<p className="text-xs font-medium uppercase tracking-wide text-slate-400">
									Status
								</p>
								<p className="mt-1 text-sm text-slate-700">
									{incident.status || "--"}
								</p>
							</div>

							<div>
								<p className="text-xs font-medium uppercase tracking-wide text-slate-400">
									District
								</p>
								<p className="mt-1 text-sm text-slate-700">
									{incident.location?.district || incident.district || "--"}
								</p>
							</div>

							<div>
								<p className="text-xs font-medium uppercase tracking-wide text-slate-400">
									Description
								</p>
								<p className="mt-1 text-sm leading-6 text-slate-700">
									{incident.description || "--"}
								</p>
							</div>

							<div>
								<p className="text-xs font-medium uppercase tracking-wide text-slate-400">
									Coordinates
								</p>
								<p className="mt-1 text-sm text-slate-700">
									{coordinates}
								</p>
							</div>

							<div>
								<p className="text-xs font-medium uppercase tracking-wide text-slate-400">
									Created At
								</p>
								<p className="mt-1 text-sm text-slate-700">
									{formatDateTime(incident.createdAt)}
								</p>
							</div>
						</div>
					)}
				</div>

				<div className="border-t border-slate-200 px-6 py-4">
					<div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
						{canAssignVolunteer && (
							<>
								<select
									value={selectedVolunteer}
									onChange={(event) => setSelectedVolunteer(event.target.value)}
									disabled={volunteersLoading}
									className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
								>
									<option value="">Select Volunteer</option>
									{volunteers.map((volunteer) => (
										<option key={volunteer._id} value={volunteer._id}>
											{volunteer.name}
										</option>
									))}
								</select>

								<button
									type="button"
									onClick={handleAssignVolunteer}
									disabled={assigning}
									className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
								>
									{assigning ? "Assigning..." : "Assign Volunteer"}
								</button>
							</>
						)}

						{canUpdateStatus && (
							<>
								<select
									value={selectedStatus}
									onChange={(event) => setSelectedStatus(event.target.value)}
									className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
								>
									<option value="Pending">Pending</option>
									<option value="Assigned">Assigned</option>
									<option value="In Progress">In Progress</option>
									<option value="Resolved">Resolved</option>
								</select>

								<button
									type="button"
									onClick={handleSaveStatus}
									disabled={savingStatus}
									className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
								>
									{savingStatus ? "Saving..." : "Save Status"}
								</button>
							</>
						)}

						{canDeleteIncident && (
							<button
								type="button"
								onClick={handleDelete}
								disabled={deleting}
								className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
							>
								{deleting ? "Deleting..." : "Delete Incident"}
							</button>
						)}
					</div>
				</div>
			</aside>
		</>
	);
};

export default IncidentDetailsDrawer;
