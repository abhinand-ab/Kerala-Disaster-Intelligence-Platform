import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { login } from "../../services/authService";

export default function LoginPage() {
	const navigate = useNavigate();
	const { t, i18n } = useTranslation();
	const { login: setAuthUser } = useAuth();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);

	const handleSubmit = async (event) => {
		event.preventDefault();
		setLoading(true);

		try {
			const response = await login({ email, password });
			localStorage.setItem("token", response.token);
			setAuthUser(response.user);
			toast.success(t("notifications.success", "Login successful"));
			navigate("/");
		} catch (error) {
			toast.error(error || t("notifications.error", "Something went wrong. Please try again."));
		} finally {
			setLoading(false);
		}
	};

	return (
		<div dir={i18n.dir()} className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 px-4 py-10 text-white sm:px-6 lg:px-8 relative">
			<div className="absolute top-4 right-4 z-50">
				<select
					value={i18n.language?.startsWith("ml") ? "ml" : "en"}
					onChange={(e) => i18n.changeLanguage(e.target.value)}
					className="px-2.5 py-1.5 rounded-lg border border-white/10 bg-slate-900 text-white text-xs font-semibold outline-none cursor-pointer hover:border-white/20 transition"
				>
					<option value="en">English</option>
					<option value="ml">മലയാളം</option>
				</select>
			</div>

			<div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl items-center justify-center">
				<div className="grid w-full overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl lg:grid-cols-[1.1fr_0.9fr]">
					<div className="hidden flex-col justify-between bg-gradient-to-br from-cyan-500/20 via-sky-500/10 to-transparent p-10 lg:flex">
						<div>
							<div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-cyan-100">
								<span className="h-2 w-2 rounded-full bg-emerald-400" />
								Real-time disaster intelligence
							</div>
							<h1 className="max-w-lg text-4xl font-semibold tracking-tight text-white xl:text-5xl">
								{t("navbar.title", "Kerala Disaster Intelligence Platform")}
							</h1>
							<p className="mt-4 max-w-lg text-base leading-7 text-slate-300">
								Streamline response coordination, monitor incidents, and stay ahead with a secure operations dashboard built for critical situations.
							</p>
						</div>
						<div className="grid grid-cols-2 gap-4 text-sm text-slate-300">
							<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
								<div className="text-white">Secure access</div>
								<div className="mt-1">Authenticated operational workflow</div>
							</div>
							<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
								<div className="text-white">Fast response</div>
								<div className="mt-1">Designed for incident command teams</div>
							</div>
						</div>
					</div>

					<div className="flex items-center justify-center p-6 sm:p-8 lg:p-12">
						<div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950/70 p-8 shadow-xl shadow-black/20 sm:p-10">
							<div className="mb-8 text-center">
								<div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/20">
									<LogIn className="h-7 w-7" />
								</div>
								<h2 className="text-3xl font-semibold tracking-tight text-white">
									{t("navbar.title", "Kerala Disaster Intelligence Platform")}
								</h2>
								<p className="mt-3 text-sm text-slate-400">Sign in to continue</p>
							</div>

							<form onSubmit={handleSubmit} className="space-y-5">
								<div>
									<label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-200">
										{t("login.email", "Email Address")}
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
									<label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-200">
										{t("login.password", "Password")}
									</label>
									<div className="relative">
										<input
											id="password"
											type={showPassword ? "text" : "password"}
											value={password}
											onChange={(event) => setPassword(event.target.value)}
											placeholder="Enter your password"
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
									className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-4 py-3.5 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70 border-0 cursor-pointer"
								>
									{loading ? t("forms.buttons.submit", "Signing In...") : t("login.submit", "Login")}
								</button>
							</form>

							<p className="mt-8 text-center text-sm text-slate-400">
								{t("login.registerPrompt", "Don't have an account?")}{" "}
								<Link
									to="/register"
									className="font-medium text-cyan-200 transition hover:text-cyan-100 hover:underline"
								>
									{t("registration.submit", "Register")}
								</Link>
							</p>

							<div className="mt-6 pt-6 border-t border-white/10 text-center">
								<span className="text-xs text-slate-500 block mb-2.5">Access general citizens relief advisory board</span>
								<Link
									to="/public"
									className="inline-flex items-center gap-1 px-4 py-2 border border-cyan-500/30 rounded-xl text-cyan-400 hover:text-cyan-300 font-semibold text-xs transition bg-cyan-900/10"
								>
									🛡️ Open Citizens Portal
								</Link>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
