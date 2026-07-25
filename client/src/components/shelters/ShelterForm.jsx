import { useEffect, useId, useState } from "react";

const formatInitialData = (initialData) => ({
	name: initialData?.name || "",
	district: initialData?.district || "",
	address: initialData?.address || "",
	capacity: initialData?.capacity ?? "",
	occupancy: initialData?.occupancy ?? "",
	availableBeds: initialData?.availableBeds ?? "",
	contactPerson: initialData?.contactPerson || "",
	phone: initialData?.phone || "",
	status: initialData?.status || "Open",
	latitude: initialData?.latitude ?? "",
	longitude: initialData?.longitude ?? "",
});

const ShelterForm = ({
	initialData,
	onSubmit,
	loading,
	mode,
	formId = "shelter-modal-form",
	firstFocusableRef,
	lastFocusableRef,
}) => {
	const [formData, setFormData] = useState(() => formatInitialData(initialData));
	const nameId = useId();
	const districtId = useId();
	const addressId = useId();
	const capacityId = useId();
	const occupancyId = useId();
	const availableBedsId = useId();
	const latitudeId = useId();
	const longitudeId = useId();
	const contactPersonId = useId();
	const phoneId = useId();
	const statusId = useId();

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

	const handleSubmit = (event) => {
		event.preventDefault();

		onSubmit?.({
			...formData,
			capacity: formData.capacity === "" ? 0 : Number(formData.capacity),
			occupancy: formData.occupancy === "" ? 0 : Number(formData.occupancy),
			availableBeds: formData.availableBeds === "" ? 0 : Number(formData.availableBeds),
			latitude: formData.latitude === "" ? 0 : Number(formData.latitude),
			longitude: formData.longitude === "" ? 0 : Number(formData.longitude),
		});
	};

	return (
		<form id={formId} onSubmit={handleSubmit} className="space-y-5">
			<div className="grid grid-cols-1 gap-5 md:grid-cols-2">
				<div>
					<label htmlFor={nameId} className="mb-2 block text-sm font-medium text-slate-700">
						Shelter Name
					</label>
					<input
						id={nameId}
						name="name"
						type="text"
						ref={firstFocusableRef}
						value={formData.name}
						onChange={handleChange}
						disabled={loading}
						className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
						placeholder="Enter shelter name"
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
						className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
						placeholder="Enter district"
					/>
				</div>

				<div className="md:col-span-2">
					<label htmlFor={addressId} className="mb-2 block text-sm font-medium text-slate-700">
						Address
					</label>
					<textarea
						id={addressId}
						name="address"
						rows="3"
						value={formData.address}
						onChange={handleChange}
						disabled={loading}
						className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
						placeholder="Enter shelter address"
					/>
				</div>

				<div>
					<label htmlFor={capacityId} className="mb-2 block text-sm font-medium text-slate-700">
						Capacity
					</label>
					<input
						id={capacityId}
						name="capacity"
						type="number"
						min="0"
						value={formData.capacity}
						onChange={handleChange}
						disabled={loading}
						className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
						placeholder="0"
					/>
				</div>

				<div>
					<label htmlFor={occupancyId} className="mb-2 block text-sm font-medium text-slate-700">
						Occupancy
					</label>
					<input
						id={occupancyId}
						name="occupancy"
						type="number"
						min="0"
						value={formData.occupancy}
						onChange={handleChange}
						disabled={loading}
						className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
						placeholder="0"
					/>
				</div>

				<div>
					<label htmlFor={availableBedsId} className="mb-2 block text-sm font-medium text-slate-700">
						Available Beds
					</label>
					<input
						id={availableBedsId}
						name="availableBeds"
						type="number"
						min="0"
						value={formData.availableBeds}
						onChange={handleChange}
						disabled={loading}
						className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
						placeholder="0"
					/>
				</div>

				<div>
					<label htmlFor={latitudeId} className="mb-2 block text-sm font-medium text-slate-700">
						Latitude
					</label>
					<input
						id={latitudeId}
						name="latitude"
						type="number"
						step="any"
						value={formData.latitude}
						onChange={handleChange}
						disabled={loading}
						className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
						placeholder="e.g. 10.8505"
					/>
				</div>

				<div>
					<label htmlFor={longitudeId} className="mb-2 block text-sm font-medium text-slate-700">
						Longitude
					</label>
					<input
						id={longitudeId}
						name="longitude"
						type="number"
						step="any"
						value={formData.longitude}
						onChange={handleChange}
						disabled={loading}
						className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
						placeholder="e.g. 76.2711"
					/>
				</div>

				<div>
					<label htmlFor={contactPersonId} className="mb-2 block text-sm font-medium text-slate-700">
						Contact Person
					</label>
					<input
						id={contactPersonId}
						name="contactPerson"
						type="text"
						value={formData.contactPerson}
						onChange={handleChange}
						disabled={loading}
						className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
						placeholder="Enter contact person"
					/>
				</div>

				<div>
					<label htmlFor={phoneId} className="mb-2 block text-sm font-medium text-slate-700">
						Phone Number
					</label>
					<input
						id={phoneId}
						name="phone"
						type="text"
						value={formData.phone}
						onChange={handleChange}
						disabled={loading}
						className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
						placeholder="Enter phone number"
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
						className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
					>
						<option value="Open">Open</option>
						<option value="Closed">Closed</option>
						<option value="Full">Full</option>
					</select>
				</div>
			</div>

			<input ref={lastFocusableRef} aria-hidden="true" tabIndex={-1} className="sr-only" type="button" />
		</form>
	);
};

export default ShelterForm;