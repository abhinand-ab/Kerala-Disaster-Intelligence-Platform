import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LogOut, ChevronDown, Settings, User } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import NotificationBell from "../notifications/NotificationBell";
import NotificationDropdown from "../notifications/NotificationDropdown";

const Header = ({ title, subtitle }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { user, logout } = useAuth();
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef(null);
    const notificationRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setIsNotificationOpen(false);
            }
        };
        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                setIsProfileOpen(false);
                setIsNotificationOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    const handleProfileClick = () => { setIsProfileOpen(false); navigate("/profile"); };
    const handleSettingsClick = () => { setIsProfileOpen(false); navigate("/settings"); };
    const handleLogoutClick = async () => { setIsProfileOpen(false); await logout(); navigate("/login"); };

    const userName = user?.name || user?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "User";
    const userRole = user?.role || "Staff Member";
    const userEmail = user?.email || "user@disasterrelief.gov.in";
    const initials = userName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U";

    return (
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
                {subtitle && <p className="mt-1 text-slate-500 text-sm font-medium">{subtitle}</p>}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:justify-end">
                <div className="flex items-center gap-3">
                    {/* Notification Area */}
                    <div className="relative" ref={notificationRef}>
                        <NotificationBell isOpen={isNotificationOpen} setIsOpen={setIsNotificationOpen} />
                        <NotificationDropdown isOpen={isNotificationOpen} setIsOpen={setIsNotificationOpen} />
                    </div>

                    {/* User Profile Dropdown */}
                    <div className="relative" ref={profileRef}>
                        <button
                            type="button"
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="inline-flex items-center justify-center gap-2.5 rounded-2xl border border-slate-200 bg-white pl-2 pr-4 py-1.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none"
                        >
                            <div className="h-7 w-7 rounded-xl bg-indigo-50 border border-indigo-150 flex items-center justify-center font-bold text-[11px] text-indigo-700 uppercase">
                                {initials}
                            </div>
                            <span className="max-w-[120px] truncate">{userName}</span>
                            <ChevronDown className="h-4 w-4 text-slate-400 transition-transform duration-200" style={{ transform: isProfileOpen ? 'rotate(180deg)' : 'none' }} />
                        </button>

                        {isProfileOpen && (
                            <div className="absolute right-0 top-full z-50 mt-2.5 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl animate-in fade-in slide-in-from-top-1 duration-100">
                                <div className="px-3.5 py-4 border-b border-slate-100 mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 shrink-0 rounded-2xl bg-indigo-500 border border-indigo-650 flex items-center justify-center font-bold text-sm text-white uppercase shadow-sm">
                                            {initials}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-bold text-slate-900 text-sm truncate">{userName}</h4>
                                            <p className="text-[11px] text-slate-500 truncate mt-0.5">{userEmail}</p>
                                            <span className="inline-flex items-center rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 mt-2.5 capitalize ring-1 ring-indigo-100">
                                                {userRole}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <button type="button" onClick={handleProfileClick} className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-cyan-700 transition border-0 cursor-pointer">
                                        <User className="h-4 w-4 text-slate-400" />
                                        {t("header.myProfile", "My Profile")}
                                    </button>
                                    <button type="button" onClick={handleSettingsClick} className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-cyan-700 transition border-0 cursor-pointer">
                                        <Settings className="h-4 w-4 text-slate-400" />
                                        {t("header.settings", "Settings")}
                                    </button>
                                    <div className="border-t border-slate-100 my-1.5" />
                                    <button type="button" onClick={handleLogoutClick} className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition border-0 cursor-pointer">
                                        <LogOut className="h-4 w-4 text-rose-500" />
                                        {t("header.logout", "Logout")}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Header;
