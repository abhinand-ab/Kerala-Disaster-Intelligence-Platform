import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { register } from "../../services/authService";

export default function RegisterPage() {
	const navigate = useNavigate();
	const { login: setAuthUser } = useAuth();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [district, setDistrict] = useState("");
	const [role, setRole] = useState("citizen");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);

	const handleSubmit = async (event) => {
		event.preventDefault();
		setLoading(true);

		try {
			const response = await register({
				name,
				email,
				phone,
				district,
				role,
				password,
			});

			localStorage.setItem("token", response.token);
			setAuthUser(response.user);
			toast.success("Registration successful");
			navigate("/");
		} catch (error) {
			toast.error(error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 px-4 py-10 text-white sm:px-6 lg:px-8">
			<div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl items-center justify-center">
				<div className="grid w-full overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl lg:grid-cols-[1.1fr_0.9fr]">
					<div className="hidden flex-col justify-between bg-gradient-to-br from-cyan-500/20 via-sky-500/10 to-transparent p-10 lg:flex">
						<div>
							<div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-cyan-100">
								<span className="h-2 w-2 rounded-full bg-emerald-400" />
								Join the response network
							</div>
							<h1 className="max-w-lg text-4xl font-semibold tracking-tight text-white xl:text-5xl">
								Kerala Disaster Intelligence Platform
							</h1>
							<p className="mt-4 max-w-lg text-base leading-7 text-slate-300">
								Create your account to participate in disaster response, track incidents, and coordinate action with a secure operational platform.
							</p>
						</div>
						<div className="grid grid-cols-2 gap-4 text-sm text-slate-300">
							<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
								<div className="text-white">Role-based access</div>
								<div className="mt-1">Citizen, volunteer, and driver workflows</div>
							</div>
							<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
								<div className="text-white">Operational ready</div>
								<div className="mt-1">Designed for fast onboarding</div>
							</div>
						</div>
					</div>

					<div className="flex items-center justify-center p-6 sm:p-8 lg:p-12">
						<div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950/70 p-8 shadow-xl shadow-black/20 sm:p-10">
							<div className="mb-8 text-center">
								<div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/20">
									<UserPlus className="h-7 w-7" />
								</div>
								<h2 className="text-3xl font-semibold tracking-tight text-white">Create Account</h2>
								<p className="mt-3 text-sm text-slate-400">Join Kerala Disaster Intelligence Platform</p>
							</div>

							<form onSubmit={handleSubmit} className="space-y-5">
								<div>
									<label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-200">
										Full Name
									</label>
									<input
										id="name"
										type="text"
										value={name}
										onChange={(event) => setName(event.target.value)}
										placeholder="Your full name"
										className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400/50 focus:ring-4 focus:ring-cyan-400/10"
										required
									/>
								</div>

								<div>
									<label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-200">
										Email
									</label>
									<input
										id="email"
										type="email"
										value={email}
										onChange={(event) => setEmail(event.target.value)}
										placeholder="you@example.com"
										className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400/50 focus:ring-4 focus:ring-cyan-400/10"
										required
									/>
								</div>

								<div>
									<label htmlFor="phone" className="mb-2 block text-sm font-medium text-slate-200">
										Phone
									</label>
									<input
										id="phone"
										type="tel"
										value={phone}
										onChange={(event) => setPhone(event.target.value)}
										placeholder="Phone number"
										className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400/50 focus:ring-4 focus:ring-cyan-400/10"
										required
									/>
								</div>

								<div>
									<label htmlFor="district" className="mb-2 block text-sm font-medium text-slate-200">
										District
									</label>
									<input
										id="district"
										type="text"
										value={district}
										onChange={(event) => setDistrict(event.target.value)}
										placeholder="District"
										className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400/50 focus:ring-4 focus:ring-cyan-400/10"
										required
									/>
								</div>

								<div>
									<label htmlFor="role" className="mb-2 block text-sm font-medium text-slate-200">
										Role
									</label>
									<select
										id="role"
										value={role}
										onChange={(event) => setRole(event.target.value)}
										className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-400/50 focus:ring-4 focus:ring-cyan-400/10"
										required
									>
										<option value="citizen" className="bg-slate-900">
											Citizen
										</option>
										<option value="volunteer" className="bg-slate-900">
											Volunteer
										</option>
										<option value="driver" className="bg-slate-900">
											Driver
										</option>
									</select>
								</div>

								<div>
									<label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-200">
										Password
									</label>
									<div className="relative">
										<input
											id="password"
											type={showPassword ? "text" : "password"}
											value={password}
											onChange={(event) => setPassword(event.target.value)}
											placeholder="Create a password"
											className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 pr-12 text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400/50 focus:ring-4 focus:ring-cyan-400/10"
											required
										/>
										<button
											type="button"
											onClick={() => setShowPassword((current) => !current)}
											className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 transition hover:text-white"
											aria-label={showPassword ? "Hide password" : "Show password"}
										>
											{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
										</button>
									</div>
								</div>

								<button
									type="submit"
									disabled={loading}
									className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-4 py-3.5 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
								>
									{loading ? "Creating Account..." : "Create Account"}
								</button>
							</form>

							<p className="mt-8 text-center text-sm text-slate-400">
								Already have an account?{" "}
								<Link
									to="/login"
									className="font-medium text-cyan-300 transition hover:text-cyan-200 hover:underline"
								>
									Login
								</Link>
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
