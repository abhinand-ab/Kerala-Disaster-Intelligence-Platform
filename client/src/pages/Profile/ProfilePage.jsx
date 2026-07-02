import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import EditProfileModal from "../../components/profile/EditProfileModal";

const formatDate = (value) => {
	if (!value) {
		return "--";
	}

	const date = new Date(value);

	if (Number.isNaN(date.getTime())) {
		return "--";
	}

	return date.toLocaleDateString("en-IN", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
};

const getInitials = (name = "") => {
	const parts = name.trim().split(/\s+/).filter(Boolean);

	if (!parts.length) {
		return "U";
	}

	return parts
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() || "")
		.join("");
};

const getDisplayValue = (value) => value || "--";

const getAvatarUrl = (user) =>
	user?.profileImage ||
	user?.avatar ||
	user?.image ||
	user?.photo ||
	user?.photoUrl ||
	"";

const ProfilePage = () => {
	const navigate = useNavigate();
	const { user, loading, login } = useAuth();
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);

	const profile = useMemo(() => {
		if (!user) {
			return {
				fullName: "User",
				email: "--",
				role: "--",
				phone: "--",
				district: "--",
				joinedDate: "--",
				avatarUrl: "",
				initials: "U",
			};
		}

		const fullName =
			user.name ||
			user.fullName ||
			[user.firstName, user.lastName].filter(Boolean).join(" ") ||
			"User";

		return {
			fullName,
			email: getDisplayValue(user.email),
			role: getDisplayValue(user.role),
			phone: getDisplayValue(user.phone),
			district: getDisplayValue(user.district || user.location?.district),
			joinedDate: formatDate(user.createdAt),
			avatarUrl: getAvatarUrl(user),
			initials: getInitials(fullName),
		};
	}, [user]);

	const handleProfileUpdated = (updatedUser) => {
		if (!updatedUser) {
			setIsEditModalOpen(false);
			return;
		}

		login(updatedUser);
		localStorage.setItem("user", JSON.stringify(updatedUser));
		setIsEditModalOpen(false);
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-5xl">
					<div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
						<div className="h-7 w-40 animate-pulse rounded-full bg-slate-200" />
						<div className="mt-3 h-4 w-64 animate-pulse rounded-full bg-slate-100" />
						<div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
							<div className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
								<div className="mx-auto h-28 w-28 animate-pulse rounded-full bg-slate-200" />
								<div className="mx-auto mt-6 h-6 w-44 animate-pulse rounded-full bg-slate-200" />
								<div className="mx-auto mt-3 h-4 w-32 animate-pulse rounded-full bg-slate-100" />
							</div>
							<div className="grid gap-4 sm:grid-cols-2">
								{Array.from({ length: 6 }).map((_, index) => (
									<div key={index} className="h-28 animate-pulse rounded-3xl border border-slate-200 bg-slate-50" />
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	const details = [
		{ label: "Full Name", value: profile.fullName },
		{ label: "Email", value: profile.email },
		{ label: "Role", value: profile.role },
		{ label: "Phone", value: profile.phone },
		{ label: "District", value: profile.district },
		{ label: "Joined Date", value: profile.joinedDate },
	];

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
			<div className="mx-auto max-w-6xl">
				<div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
					<div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-cyan-50 px-6 py-6 sm:px-8">
						<button
							type="button"
							onClick={() => navigate("/")}
							className="mb-4 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
						>
							<ArrowLeft className="h-4 w-4" />
							Back to Dashboard
						</button>

						<p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700">
							Profile
						</p>
						<h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
							My Profile
						</h1>
						<p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
							Manage your account information.
						</p>
					</div>

					<div className="grid gap-6 px-6 py-6 lg:grid-cols-[340px_minmax(0,1fr)] lg:px-8 lg:py-8">
						<section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
							<div className="flex flex-col items-center text-center">
								<div className="relative">
									<div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-gradient-to-br from-cyan-500 to-sky-600 text-3xl font-semibold text-white shadow-lg shadow-cyan-500/20 ring-1 ring-slate-200">
										{profile.avatarUrl ? (
											<img
												src={profile.avatarUrl}
												alt={profile.fullName}
												className="h-full w-full object-cover"
											/>
										) : (
											<span>{profile.initials}</span>
										)}
									</div>
								</div>

								<h2 className="mt-5 text-2xl font-semibold tracking-tight text-slate-900">
									{profile.fullName}
								</h2>
								<p className="mt-2 text-sm font-medium text-slate-500">
									{profile.role}
								</p>

								<div className="mt-6 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
									<button
										type="button"
										onClick={() => setIsEditModalOpen(true)}
										className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
									>
										Edit Profile
									</button>
									<button
										type="button"
										className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
									>
										Logout
									</button>
								</div>
							</div>
						</section>

						<section className="grid gap-4 sm:grid-cols-2">
							{details.map((detail) => (
								<article
									key={detail.label}
									className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
								>
									<p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
										{detail.label}
									</p>
									<p className="mt-3 break-words text-base font-medium text-slate-900">
										{detail.value}
									</p>
								</article>
							))}
						</section>
					</div>
				</div>
			</div>

			<EditProfileModal
				isOpen={isEditModalOpen}
				onClose={() => setIsEditModalOpen(false)}
				user={user}
				onProfileUpdated={handleProfileUpdated}
			/>
		</div>
	);
};

export default ProfilePage;
