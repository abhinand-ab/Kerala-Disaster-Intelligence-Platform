import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, UserCircle2 } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import NotificationBell from "../notifications/NotificationBell";
import NotificationDropdown from "../notifications/NotificationDropdown";

const SectionHeader = ({ title, subtitle }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const handleProfileClick = () => {
    navigate("/profile");
  };

  const handleLogoutClick = async () => {
    await logout();
    navigate("/login");
  };

  const userName = user?.name || user?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "User";

  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>

        <p className="mt-1 text-slate-500">{subtitle}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:justify-end">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
          {userName}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative">
            <NotificationBell
              isOpen={isNotificationOpen}
              setIsOpen={setIsNotificationOpen}
            />

            <NotificationDropdown
              isOpen={isNotificationOpen}
              setIsOpen={setIsNotificationOpen}
            />
          </div>

          <button
            type="button"
            onClick={handleProfileClick}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
          >
            <UserCircle2 className="h-4 w-4" />
            Profile
          </button>

          <button
            type="button"
            onClick={handleLogoutClick}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default SectionHeader;