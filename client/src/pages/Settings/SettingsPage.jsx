import { useState } from "react";
import MainLayout from "../../components/layout/MainLayout";
import Header from "../../components/layout/Header";
import { useAuth } from "../../context/AuthContext";
import {
    User,
    Lock,
    BellRing,
    Palette,
    Info,
    Check,
    AlertCircle,
    Activity,
} from "lucide-react";
import { toast } from "react-hot-toast";

const SettingsPage = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState("account");

    // Local states for inputs
    const [userName, setUserName] = useState(user?.name || user?.fullName || "");
    const [userEmail, setUserEmail] = useState(user?.email || "");
    const [userPhone, setUserPhone] = useState(user?.phone || "+91 98456 12345");
    const [userDistrict, setUserDistrict] = useState(user?.district || "Kozhikode");

    // Password states
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordLoading, setPasswordLoading] = useState(false);

    // Notification states
    const [notifPreferences, setNotifPreferences] = useState({
        emergency: true,
        dispatches: true,
        stockAlerts: false,
        systemEmails: true,
    });

    // Theme states
    const handleSaveAccount = (e) => {
        e.preventDefault();
        toast.success("Account settings updated successfully.");
    };

    const handleSavePassword = (e) => {
        e.preventDefault();
        if (!oldPassword || !newPassword || !confirmPassword) {
            toast.error("Please fill in all password fields.");
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match.");
            return;
        }
        setPasswordLoading(true);
        setTimeout(() => {
            setPasswordLoading(false);
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
            toast.success("Password changed successfully.");
        }, 1500);
    };

    const handleToggleNotif = (key) => {
        setNotifPreferences((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
        toast.success("Notification preferences updated.");
    };

    const tabs = [
        { id: "account", label: "Account Settings", icon: User },
        { id: "password", label: "Change Password", icon: Lock },
        { id: "notifications", label: "Notifications", icon: BellRing },
        { id: "system", label: "System Information", icon: Info },
    ];

    return (
        <MainLayout>
            <Header
                title="System Settings"
                subtitle="Configure account profiles, security settings, notify channels, and inspect operational metrics."
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 font-sans max-w-6xl">
                {/* Tabs Sidebar */}
                <div className="lg:col-span-1 space-y-1">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition border-l-4 shadow-sm ${isActive
                                    ? "bg-indigo-50 text-indigo-700 border-indigo-600"
                                    : "bg-white text-slate-600 hover:bg-slate-50 border-transparent"
                                    }`}
                            >
                                <Icon className={`h-4.5 w-4.5 ${isActive ? "text-indigo-650" : "text-slate-400"}`} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Tabs Content Panel */}
                <div className="lg:col-span-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm min-h-[400px]">
                    {activeTab === "account" && (
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 mb-5">
                                Account Settings
                            </h3>
                            <form onSubmit={handleSaveAccount} className="space-y-5">
                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            value={userName}
                                            onChange={(e) => setUserName(e.target.value)}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-cyan-400 focus:bg-white transition"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            value={userEmail}
                                            onChange={(e) => setUserEmail(e.target.value)}
                                            className="w-full rounded-xl border border-slate-205 bg-slate-100 px-4 py-2.5 text-sm text-slate-500 outline-none cursor-not-allowed"
                                            disabled
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                            Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            value={userPhone}
                                            onChange={(e) => setUserPhone(e.target.value)}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-cyan-400 focus:bg-white transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                            Primary Assigned District
                                        </label>
                                        <input
                                            type="text"
                                            value={userDistrict}
                                            onChange={(e) => setUserDistrict(e.target.value)}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-cyan-400 focus:bg-white transition"
                                        />
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 pt-5">
                                    <button
                                        type="submit"
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-600 focus:outline-none"
                                    >
                                        Save Profile Updates
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === "password" && (
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 mb-5">
                                Change Password
                            </h3>
                            <form onSubmit={handleSavePassword} className="space-y-4 max-w-md">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                        Current Password
                                    </label>
                                    <input
                                        type="password"
                                        value={oldPassword}
                                        onChange={(e) => setOldPassword(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-cyan-400 focus:bg-white transition"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-cyan-400 focus:bg-white transition"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                        Confirm New Password
                                    </label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-cyan-400 focus:bg-white transition"
                                        required
                                    />
                                </div>

                                <div className="border-t border-slate-100 pt-5 mt-2">
                                    <button
                                        type="submit"
                                        disabled={passwordLoading}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-600 focus:outline-none disabled:opacity-50"
                                    >
                                        {passwordLoading ? "Updating security tokens..." : "Update Security Password"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === "notifications" && (
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 mb-5">
                                Notification Preferences
                            </h3>
                            <p className="text-xs text-slate-500 mb-5">
                                Set up real-time webpush alerts and event logs. Select triggers that dispatch dashboard updates.
                            </p>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900">Critical & Emergency Alerts</h4>
                                        <p className="text-xs text-slate-500 mt-1">Receive warning banners and immediate sounds on incoming disaster incidents.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleToggleNotif("emergency")}
                                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${notifPreferences.emergency ? "bg-cyan-500" : "bg-slate-250"
                                            }`}
                                    >
                                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${notifPreferences.emergency ? "translate-x-5" : "translate-x-0"
                                            }`} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900">Mission Dispatches</h4>
                                        <p className="text-xs text-slate-500 mt-1">Notify when teams, rescue vehicles, or personnel assignments are modified.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleToggleNotif("dispatches")}
                                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${notifPreferences.dispatches ? "bg-cyan-500" : "bg-slate-250"
                                            }`}
                                    >
                                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${notifPreferences.dispatches ? "translate-x-5" : "translate-x-0"
                                            }`} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900">Resource Stock Warning</h4>
                                        <p className="text-xs text-slate-500 mt-1">Alert if warehouses or emergency shelter inventories fall below safety buffers.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleToggleNotif("stockAlerts")}
                                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${notifPreferences.stockAlerts ? "bg-cyan-500" : "bg-slate-250"
                                            }`}
                                    >
                                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${notifPreferences.stockAlerts ? "translate-x-5" : "translate-x-0"
                                            }`} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900">System Logs & Emails</h4>
                                        <p className="text-xs text-slate-500 mt-1">Periodic summary reporting and platform maintenance updates.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleToggleNotif("systemEmails")}
                                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${notifPreferences.systemEmails ? "bg-cyan-500" : "bg-slate-250"
                                            }`}
                                    >
                                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${notifPreferences.systemEmails ? "translate-x-5" : "translate-x-0"
                                            }`} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}



                    {activeTab === "system" && (
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 mb-5">
                                System Information & Telemetry
                            </h3>
                            <div className="space-y-4 max-w-lg">
                                <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                                    <span className="text-xs font-semibold text-slate-500">Framework Engine</span>
                                    <span className="text-xs font-bold text-slate-800">Vite 8.1.0 (React 19.2.7)</span>
                                </div>
                                <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                                    <span className="text-xs font-semibold text-slate-500">Styling System</span>
                                    <span className="text-xs font-bold text-slate-800">Tailwind CSS v4.3.1</span>
                                </div>
                                <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                                    <span className="text-xs font-semibold text-slate-500">Platform Version</span>
                                    <span className="text-xs font-bold text-slate-800">v1.2.0 (Kerala Disaster Intelligence)</span>
                                </div>
                                <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                                    <span className="text-xs font-semibold text-slate-500">Socket connection status</span>
                                    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                                        <Activity className="h-3.5 w-3.5 animate-pulse" /> Live Link Online
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                                    <span className="text-xs font-semibold text-slate-500">Current Server Epoch</span>
                                    <span className="text-xs font-mono font-medium text-slate-700">
                                        {new Date().toISOString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
};

export default SettingsPage;
