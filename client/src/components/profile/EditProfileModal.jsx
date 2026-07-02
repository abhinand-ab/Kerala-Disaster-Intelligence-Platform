import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { updateProfile } from "../../services/authService";

const EditProfileModal = ({ isOpen, onClose, user, onProfileUpdated }) => {
	const [name, setName] = useState("");
	const [phone, setPhone] = useState("");
	const [district, setDistrict] = useState("");
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (!isOpen) {
			return;
		}

		const fullName =
			user?.name ||
			user?.fullName ||
			[user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
			"";

		setName(fullName);
		setPhone(user?.phone || "");
		setDistrict(user?.district || user?.location?.district || "");
	}, [isOpen, user]);

	if (!isOpen) {
		return null;
	}

	const handleClose = () => {
		if (saving) {
			return;
		}

		onClose?.();
	};

	const handleSave = async (event) => {
		event.preventDefault();

		if (!name.trim()) {
			toast.error("Name is required.");
			return;
		}

		setSaving(true);

		try {
			const response = await updateProfile({
				name: name.trim(),
				phone,
				district,
			});

			const updatedUser = response?.user || response;
			toast.success("Profile updated successfully");
			onProfileUpdated?.(updatedUser);
			onClose?.();
		} catch (error) {
			toast.error(error);
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 sm:px-6">
			<div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]" onClick={handleClose} />

			<div className="relative z-10 w-full max-w-lg rounded-3xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
				<div className="border-b border-slate-200 px-6 py-5 sm:px-8">
					<h2 className="text-2xl font-semibold tracking-tight text-slate-900">
						Edit Profile
					</h2>
				</div>

				<form onSubmit={handleSave} className="space-y-5 px-6 py-6 sm:px-8">
					<div>
						<label htmlFor="edit-profile-name" className="mb-2 block text-sm font-medium text-slate-700">
							Full Name
						</label>
						<input
							id="edit-profile-name"
							type="text"
							value={name}
							onChange={(event) => setName(event.target.value)}
							disabled={saving}
							className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
							placeholder="Enter full name"
						/>
					</div>

					<div>
						<label htmlFor="edit-profile-phone" className="mb-2 block text-sm font-medium text-slate-700">
							Phone Number
						</label>
						<input
							id="edit-profile-phone"
							type="text"
							value={phone}
							onChange={(event) => setPhone(event.target.value)}
							disabled={saving}
							className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
							placeholder="Enter phone number"
						/>
					</div>

					<div>
						<label htmlFor="edit-profile-district" className="mb-2 block text-sm font-medium text-slate-700">
							District
						</label>
						<input
							id="edit-profile-district"
							type="text"
							value={district}
							onChange={(event) => setDistrict(event.target.value)}
							disabled={saving}
							className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
							placeholder="Enter district"
						/>
					</div>

					<div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
						<button
							type="button"
							onClick={handleClose}
							disabled={saving}
							className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={saving}
							className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
						>
							{saving ? "Saving..." : "Save Changes"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default EditProfileModal;
