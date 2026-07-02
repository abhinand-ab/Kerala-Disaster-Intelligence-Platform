import { createContext, useContext, useEffect, useState } from "react";
import { getProfile, logout as authLogout } from "../services/authService";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
	const storedUser = localStorage.getItem("user");
	const [user, setUser] = useState(storedUser ? JSON.parse(storedUser) : null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const initialToken = localStorage.getItem("token");

		const loadProfile = async () => {
			if (!initialToken) {
				setLoading(false);
				return;
			}

			try {
				const profile = await getProfile();
				if (localStorage.getItem("token") !== initialToken) {
					return;
				}
				setUser(profile);
				localStorage.setItem("user", JSON.stringify(profile));
			} catch (error) {
				if (localStorage.getItem("token") === initialToken) {
					await authLogout();
					setUser(null);
				}
			} finally {
				setLoading(false);
			}
		};

		loadProfile();
	}, []);

	const login = (userData) => {
		setUser(userData);
		localStorage.setItem("user", JSON.stringify(userData));
		setLoading(false);
	};

	const signOut = async () => {
		await authLogout();
		setUser(null);
		setLoading(false);
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				loading,
				login,
				logout: signOut,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	return useContext(AuthContext);
}

export default useAuth;
