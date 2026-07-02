import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * RoleGuard protects route content by checking the current user's role.
 *
 * Keep this component small and composable so it can wrap any protected route
 * without changing navigation or backend behavior.
 */
export default function RoleGuard({ allowedRoles = [], children }) {
  const { user, loading } = useAuth();

  const isAllowed = Boolean(user?.role) && allowedRoles.includes(user.role);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900"
            aria-hidden="true"
          />
          <p className="text-sm font-medium text-slate-700">Loading access control...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAllowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-red-50 px-4">
        <div className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-8 text-center shadow-xl shadow-red-100/40">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-8 w-8"
              aria-hidden="true"
            >
              <path d="M12 9v4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 17h.01" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.72 3h16.92a2 2 0 0 0 1.72-3l-8.47-14.14a2 2 0 0 0-3.42 0Z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-500">
            Access Denied
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">
            You do not have permission to view this page.
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Your current role does not match the allowed roles for this section.
            If you believe this is a mistake, contact an administrator.
          </p>

          <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-3 text-left text-sm text-slate-600">
            <span className="block font-medium text-slate-900">Current role</span>
            <span>{user.role || "Unknown"}</span>
          </div>
        </div>
      </div>
    );
  }

  return children;
}