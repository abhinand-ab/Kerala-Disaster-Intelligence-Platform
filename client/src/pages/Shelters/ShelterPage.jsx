import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	BedDouble,
	Building2,
	MapPin,
	PencilLine,
	Plus,
	Phone,
	RefreshCcw,
	Search,
	ShieldAlert,
	ShieldCheck,
	Trash2,
	Truck,
	UserRound,
	Navigation,
	Map,
	Download,
	FileText,
} from "lucide-react";
import { toast } from "react-hot-toast";

import MainLayout from "../../components/layout/MainLayout";
import Header from "../../components/layout/Header";
import DeleteShelterDialog from "../../components/shelters/DeleteShelterDialog";
import ShelterModal from "../../components/shelters/ShelterModal";
import useShelters from "../../hooks/useShelters";
import { useMap } from "../../context/MapContext";

const statusStyles = {
	Open: "bg-emerald-100 text-emerald-700 ring-emerald-200",
	"Nearly Full": "bg-amber-105 text-amber-700 ring-amber-200",
	Full: "bg-rose-100 text-rose-700 ring-rose-200",
	Closed: "bg-slate-100 text-slate-600 ring-slate-200",
};

const statConfigs = [
	{
		key: "totalShelters",
		label: "Total Shelters",
		icon: Building2,
		iconClassName: "text-cyan-600",
		cardClassName: "from-cyan-50 to-white",
	},
	{
		key: "openShelters",
		label: "Open Shelters",
		icon: ShieldCheck,
		iconClassName: "text-emerald-600",
		cardClassName: "from-emerald-50 to-white",
	},
	{
		key: "fullShelters",
		label: "Full Shelters",
		icon: ShieldAlert,
		iconClassName: "text-rose-600",
		cardClassName: "from-rose-50 to-white",
	},
	{
		key: "availableBeds",
		label: "Total Available Beds",
		icon: BedDouble,
		iconClassName: "text-amber-600",
		cardClassName: "from-amber-50 to-white",
	},
];

const filterOptions = ["All", "Open", "Nearly Full", "Full", "Closed"];

const formatNumber = (value) => new Intl.NumberFormat("en-IN").format(Number(value) || 0);

const getShelterProgress = (shelter) => {
	const capacity = Number(shelter?.capacity) || 0;
	const occupancy = Number(shelter?.occupancy) || 0;

	if (capacity <= 0) {
		return 0;
	}

	return Math.min(Math.round((occupancy / capacity) * 100), 100);
};

const getShelterStatus = (shelter) => {
	if (shelter?.status === "Closed") {
		return "Closed";
	}

	const capacity = Number(shelter?.capacity) || 0;
	const occupancy = Number(shelter?.occupancy) || 0;

	if (capacity > 0 && occupancy >= capacity) {
		return "Full";
	}

	const progress = getShelterProgress(shelter);

	if (progress >= 90) {
		return "Full";
	}

	if (progress >= 60) {
		return "Nearly Full";
	}

	return "Open";
};

const getProgressColorClass = (progress) => {
	if (progress >= 90) {
		return "bg-rose-500";
	}

	if (progress >= 60) {
		return "bg-amber-500";
	}

	return "bg-emerald-500";
};

const getStatusBadgeClass = (status) => statusStyles[status] || statusStyles.Open;

const ShelterPage = () => {
	const {
		shelters,
		isLoading,
		error,
		refetch,
		createShelter,
		updateShelter,
		deleteShelter,
		updateOccupancy,
	} = useShelters();

	const { setMapFlyToTarget, setNavigationDest, setLayers } = useMap();
	const navigate = useNavigate();

	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("All");
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [mode, setMode] = useState("add");
	const [selectedShelter, setSelectedShelter] = useState(null);
	const [loading, setLoading] = useState(false);
	const [deleteLoading, setDeleteLoading] = useState(false);

	const filteredShelters = useMemo(() => {
		return shelters.filter((shelter) => {
			const status = getShelterStatus(shelter);
			const matchesSearch = [shelter?.name, shelter?.district]
				.filter(Boolean)
				.some((value) => value.toLowerCase().includes(searchTerm.trim().toLowerCase()));
			const matchesStatus = statusFilter === "All" || status === statusFilter;

			return matchesSearch && matchesStatus;
		});
	}, [searchTerm, shelters, statusFilter]);

	const totalShelters = shelters.length;
	const openShelters = shelters.filter((shelter) => getShelterStatus(shelter) === "Open").length;
	const fullShelters = shelters.filter((shelter) => getShelterStatus(shelter) === "Full").length;
	const totalAvailableBeds = shelters.reduce(
		(sum, shelter) => {
			const cap = Number(shelter?.capacity) || 0;
			const occ = Number(shelter?.occupancy) || 0;
			const avail = Math.max(0, cap - occ);
			return sum + avail;
		},
		0
	);

	const summaryValues = {
		totalShelters,
		openShelters,
		fullShelters,
		availableBeds: totalAvailableBeds,
	};

	const handleOpenAddModal = () => {
		setSelectedShelter(null);
		setMode("add");
		setIsModalOpen(true);
	};

	const handleEditShelter = (shelter) => {
		setSelectedShelter(shelter);
		setMode("edit");
		setIsModalOpen(true);
	};

	const handleDeleteShelter = (shelter) => {
		setSelectedShelter(shelter);
		setIsDeleteDialogOpen(true);
	};

	const handleUpdateOccupancy = async (shelter) => {
		const result = prompt(`Update occupancy count for ${shelter.name} (Max capacity: ${shelter.capacity}):`, shelter.occupancy);
		if (result === null) return;
		const nextOccupancy = parseInt(result, 10);
		if (isNaN(nextOccupancy) || nextOccupancy < 0) {
			toast.error("Please enter a valid non-negative number.");
			return;
		}
		try {
			await updateOccupancy({ id: shelter._id, occupancy: nextOccupancy });
			await refetch();
		} catch (err) {
			toast.error(err?.message || "Failed to update occupancy.");
		}
	};

	const handleViewOnMap = (shelter) => {
		if (!shelter.latitude || !shelter.longitude) {
			toast.error("Coordinates not found for this shelter.");
			return;
		}
		setMapFlyToTarget([Number(shelter.latitude), Number(shelter.longitude)]);
		setLayers((prev) => ({ ...prev, shelters: true }));
		toast.success(`Positioned map view over: ${shelter.name}`);
		navigate("/map");
	};

	const handleNavigate = (shelter) => {
		if (!shelter.latitude || !shelter.longitude) {
			toast.error("Coordinates not found for this shelter.");
			return;
		}
		setNavigationDest(shelter);
		setLayers((prev) => ({ ...prev, shelters: true }));
		toast.success(`Routing safe evacuation path to: ${shelter.name}`);
		navigate("/map");
	};

	const handleExportCSV = () => {
		if (filteredShelters.length === 0) {
			toast.error("No shelters found to export.");
			return;
		}
		const headers = ["Name", "District", "Address", "Latitude", "Longitude", "Capacity", "Occupancy", "Available Beds", "Status", "Contact", "Phone"];
		const rows = filteredShelters.map((s) => [
			`"${s.name.replace(/"/g, '""')}"`,
			`"${(s.district || "").replace(/"/g, '""')}"`,
			`"${(s.address || "").replace(/"/g, '""')}"`,
			s.latitude || 0,
			s.longitude || 0,
			s.capacity || 0,
			s.occupancy || 0,
			Math.max(0, (Number(s.capacity) || 0) - (Number(s.occupancy) || 0)),
			s.status || "Open",
			`"${(s.contactPerson || "").replace(/"/g, '""')}"`,
			`"${(s.phone || "").replace(/"/g, '""')}"`
		]);

		const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
		const encodedUri = encodeURI(csvContent);
		const link = document.createElement("a");
		link.setAttribute("href", encodedUri);
		link.setAttribute("download", `shelters_report_${new Date().toISOString().slice(0, 10)}.csv`);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		toast.success("CSV report downloaded.");
	};

	const handleExportPDF = () => {
		if (filteredShelters.length === 0) {
			toast.error("No shelters found to export.");
			return;
		}
		const printWindow = window.open("", "_blank");
		const htmlDef = `
			<html>
				<head>
					<title>Kerala operational shelters - ${new Date().toLocaleDateString()}</title>
					<style>
						body { font-family: sans-serif; padding: 30px; color: #1e293b; }
						h1 { font-size: 24px; margin-bottom: 4px; color: #0f172a; }
						p { font-size: 13px; color: #64748b; margin-top: 0; }
						table { width: 100%; border-collapse: collapse; margin-top: 25px; }
						th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; font-size: 11px; }
						th { background-color: #f8fafc; font-weight: 600; color: #475569; }
						.badge { padding: 3px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; text-transform: uppercase; }
						.badge-Open { background-color: #f0fdf4; color: #166534; }
						.badge-Full { background-color: #fef2f2; color: #991b1b; }
						.badge-Nearly-Full { background-color: #fff7ed; color: #9a3412; }
						.badge-Closed { background-color: #f1f5f9; color: #475569; }
					</style>
				</head>
				<body>
					<h1>Kerala Disaster Intelligence Platform</h1>
					<p>Operational Shelters Capacity Log - Generated ${new Date().toLocaleString()}</p>
					<table>
						<thead>
							<tr>
								<th>Shelter Name</th>
								<th>District</th>
								<th>Status</th>
								<th>Capacity</th>
								<th>Occupancy</th>
								<th>Available Beds</th>
								<th>Contact Phone</th>
							</tr>
						</thead>
						<tbody>
							${filteredShelters.map(s => {
			const avail = Math.max(0, (Number(s.capacity) || 0) - (Number(s.occupancy) || 0));
			return `
									<tr>
										<td><strong>${s.name}</strong></td>
										<td>${s.district || "Unknown"}</td>
										<td><span class="badge ${s.status === "Open" ? "badge-Open" : s.status === "Full" ? "badge-Full" : "badge-Closed"}">${s.status || "Open"}</span></td>
										<td>${s.capacity}</td>
										<td>${s.occupancy}</td>
										<td>${avail}</td>
										<td>${s.phone || "N/A"}</td>
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
		toast.success("PDF generated.");
	};

	const resetModalState = () => {
		setIsModalOpen(false);
		setMode("add");
		setSelectedShelter(null);
	};

	const handleCloseModal = () => {
		if (loading) {
			return;
		}

		resetModalState();
	};

	const handleCloseDeleteDialog = () => {
		if (deleteLoading) {
			return;
		}

		setIsDeleteDialogOpen(false);
		setSelectedShelter(null);
	};

	const handleConfirmDelete = async () => {
		if (!selectedShelter?._id) {
			return;
		}

		setDeleteLoading(true);

		try {
			await deleteShelter(selectedShelter._id);
			await refetch();
			setIsDeleteDialogOpen(false);
			setSelectedShelter(null);
		} catch (error) {
			throw error;
		} finally {
			setDeleteLoading(false);
		}
	};

	const handleSubmitShelter = async (formData) => {
		setLoading(true);

		try {
			if (mode === "add") {
				await createShelter(formData);
			} else if (selectedShelter?._id) {
				await updateShelter({ id: selectedShelter._id, data: formData });
			}

			await refetch();
			setLoading(false);
			resetModalState();
			return;
		} catch (error) {
			throw error;
		} finally {
			setLoading(false);
		}
	};

	const isFilteredEmpty = !isLoading && !error && shelters.length > 0 && filteredShelters.length === 0;
	const isShelterListEmpty = !isLoading && !error && shelters.length === 0;
	const errorMessage = typeof error === "string" ? error : error?.message || "Unable to load shelters.";

	return (
		<MainLayout>
			<Header
				title="Shelter Management"
				subtitle="Manage relief shelters, monitor capacity, and coordinate shelter resources across Kerala."
			/>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
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
									Live
								</div>
							</div>

							<div className="text-3xl font-semibold tracking-tight text-slate-900">
								{formatNumber(summaryValues[stat.key])}
							</div>
							<div className="mt-1 text-sm font-medium text-slate-600">{stat.label}</div>
						</div>
					);
				})}
			</div>

			<div className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
				<div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_180px_auto_auto_auto] lg:items-center">
					<div className="relative">
						<Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
						<input
							type="search"
							value={searchTerm}
							onChange={(event) => setSearchTerm(event.target.value)}
							placeholder="Search by shelter name or district"
							className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-400/10 font-semibold"
						/>
					</div>

					<div className="relative">
						<select
							value={statusFilter}
							onChange={(event) => setStatusFilter(event.target.value)}
							className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm font-semibold text-slate-700 outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-400/10 cursor-pointer"
						>
							{filterOptions.map((option) => (
								<option key={option} value={option}>
									{option}
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
						className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-750 transition hover:bg-slate-55"
					>
						<Download className="h-4 w-4" />
						CSV
					</button>

					<button
						type="button"
						onClick={handleExportPDF}
						className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-750 transition hover:bg-slate-55"
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
						Add Shelter
					</button>
				</div>
			</div>

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
								<div className="h-14 rounded-2xl bg-slate-100" />
								<div className="h-14 rounded-2xl bg-slate-100" />
							</div>
							<div className="mt-6 h-3 rounded-full bg-slate-100" />
							<div className="mt-3 h-14 rounded-2xl bg-slate-100" />
						</div>
					))}
				</div>
			) : error ? (
				<div className="mt-8 rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-sm">
					<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
						<ShieldAlert className="h-6 w-6" />
					</div>
					<h3 className="mt-4 text-lg font-semibold text-slate-900">Unable to load shelters</h3>
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
			) : isShelterListEmpty ? (
				<div className="mt-8 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
					<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-50 text-cyan-600">
						<Truck className="h-7 w-7" />
					</div>
					<h3 className="mt-4 text-lg font-semibold text-slate-900">No shelters available</h3>
					<p className="mt-2 text-sm text-slate-500">
						Add a shelter to start tracking capacity and resources across Kerala.
					</p>
					<button
						type="button"
						onClick={handleOpenAddModal}
						className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-600"
					>
						<Plus className="h-4 w-4" />
						Add Shelter
					</button>
				</div>
			) : isFilteredEmpty ? (
				<div className="mt-8 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
					<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
						<Search className="h-7 w-7" />
					</div>
					<h3 className="mt-4 text-lg font-semibold text-slate-900">No shelters match your filters</h3>
					<p className="mt-2 text-sm text-slate-500">Try a different search term or adjust the shelter status filter.</p>
				</div>
			) : (
				<div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
					{filteredShelters.map((shelter) => {
						const status = getShelterStatus(shelter);
						const progress = getShelterProgress(shelter);
						const capacity = Number(shelter?.capacity) || 0;
						const occupancy = Number(shelter?.occupancy) || 0;
						const availableBeds = Math.max(0, capacity - occupancy);

						return (
							<article
								key={shelter?._id || shelter?.name}
								className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between"
							>
								<div>
									<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
										<div className="min-w-0">
											<div className="flex flex-wrap items-center gap-3">
												<h3 className="text-xl font-semibold text-slate-900">{shelter?.name || "Unnamed Shelter"}</h3>
												<span
													className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStatusBadgeClass(status)}`}
												>
													{status}
												</span>
											</div>
											<div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
												<MapPin className="h-4 w-4 text-blue-600" />
												<span className="font-semibold text-slate-700">{shelter?.district || "Unknown District"}</span>
												<span className="text-slate-300">•</span>
												<span className="line-clamp-1">{shelter?.address || "No address provided"}</span>
											</div>
											<div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-505 font-mono">
												<MapPin className="h-3.5 w-3.5 text-slate-400" />
												<span>Lat: {shelter?.latitude ?? "N/A"}</span>
												<span className="text-slate-300">•</span>
												<span>Lng: {shelter?.longitude ?? "N/A"}</span>
											</div>
										</div>

										<div className="grid grid-cols-3 gap-3 text-center text-sm font-semibold">
											<div className="rounded-2xl bg-slate-50 px-4 py-3">
												<div className="text-lg font-bold text-slate-900">{formatNumber(capacity)}</div>
												<div className="text-xs font-medium text-slate-500">Capacity</div>
											</div>
											<div className="rounded-2xl bg-slate-50 px-4 py-3 font-semibold">
												<div className="text-lg font-bold text-slate-900">{formatNumber(occupancy)}</div>
												<div className="text-xs font-medium text-slate-500">Occupied</div>
											</div>
											<div className="rounded-2xl bg-slate-50 px-4 py-3">
												<div className="text-lg font-bold text-blue-600">{formatNumber(availableBeds)}</div>
												<div className="text-xs font-medium text-slate-500">Available</div>
											</div>
										</div>
									</div>

									<div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
										<div className="rounded-2xl bg-slate-50 p-4">
											<div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Contact Person</div>
											<div className="mt-2 flex items-center gap-2 text-sm font-bold text-slate-800">
												<UserRound className="h-4 w-4 text-blue-600" />
												<span>{shelter?.contactPerson || "Not specified"}</span>
											</div>
										</div>

										<div className="rounded-2xl bg-slate-50 p-4">
											<div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Phone Number</div>
											<div className="mt-2 flex items-center gap-2 text-sm font-bold text-slate-800">
												<Phone className="h-4 w-4 text-blue-600" />
												<span>{shelter?.phone || "Not specified"}</span>
											</div>
										</div>
									</div>

									<div className="mt-6">
										<div className="mb-2 flex items-center justify-between text-sm">
											<span className="font-semibold text-slate-705">Capacity Progress</span>
											<span className="font-bold text-slate-900">{progress}%</span>
										</div>
										<div className="h-3 overflow-hidden rounded-full bg-slate-100">
											<div
												className={`h-full rounded-full transition-all duration-500 ${getProgressColorClass(progress)}`}
												style={{ width: `${progress}%` }}
											/>
										</div>
									</div>
								</div>

								<div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-6">
									<button
										type="button"
										onClick={() => handleViewOnMap(shelter)}
										className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-750"
									>
										<Map className="h-3.5 w-3.5 text-blue-605" />
										Map
									</button>

									<button
										type="button"
										onClick={() => handleNavigate(shelter)}
										className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
									>
										<Navigation className="h-3.5 w-3.5 text-emerald-600" />
										Navigate
									</button>

									<button
										type="button"
										onClick={() => handleEditShelter(shelter)}
										className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-705"
									>
										<PencilLine className="h-3.5 w-3.5" />
										Edit
									</button>

									<button
										type="button"
										onClick={() => handleUpdateOccupancy(shelter)}
										className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-705"
									>
										<RefreshCcw className="h-3.5 w-3.5" />
										Set Occupy
									</button>

									<button
										type="button"
										onClick={() => handleDeleteShelter(shelter)}
										className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-705 ml-auto text-rose-600"
									>
										<Trash2 className="h-3.5 w-3.5" />
										Delete
									</button>
								</div>
							</article>
						);
					})}
				</div>
			)}

			<ShelterModal
				isOpen={isModalOpen}
				onClose={handleCloseModal}
				onSubmit={handleSubmitShelter}
				initialData={selectedShelter}
				loading={loading}
				mode={mode}
			/>

			<DeleteShelterDialog
				isOpen={isDeleteDialogOpen}
				onClose={handleCloseDeleteDialog}
				onConfirm={handleConfirmDelete}
				shelter={selectedShelter}
				loading={deleteLoading}
			/>
		</MainLayout>
	);
};

export default ShelterPage;
