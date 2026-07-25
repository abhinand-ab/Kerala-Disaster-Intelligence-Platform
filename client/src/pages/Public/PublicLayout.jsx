import { useState, useEffect } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    ShieldAlert,
    Home,
    AlertTriangle,
    Map,
    Building2,
    Phone,
    BookOpen,
    HelpCircle,
    Lock,
    Menu,
    X,
    Eye,
    EyeOff
} from "lucide-react";

const publicMenus = [
    { name: "Home", key: "home", icon: Home, to: "/public" },
    { name: "Live Alerts", key: "alerts", icon: AlertTriangle, to: "/public/alerts" },
    { name: "Interactive Map", key: "map", icon: Map, to: "/public/map" },
    { name: "Shelter Finder", key: "shelters", icon: Building2, to: "/public/shelters" },
    { name: "Prep Guides", key: "education", icon: BookOpen, to: "/public/education" },
    { name: "FAQ", key: "faq", icon: HelpCircle, to: "/public/faq" },
    { name: "Contacts", key: "contacts", icon: Phone, to: "/public/contacts" },
];

const PublicLayout = () => {
    const { t, i18n } = useTranslation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [highContrast, setHighContrast] = useState(false);
    const [fontSizeLevel, setFontSizeLevel] = useState(1); // 1 = normal, 2 = large, 3 = extra large
    const navigate = useNavigate();

    // Persist accessibility settings
    useEffect(() => {
        const storedContrast = localStorage.getItem("pub-high-contrast") === "true";
        const storedFont = parseInt(localStorage.getItem("pub-font-size") || "1");
        setHighContrast(storedContrast);
        setFontSizeLevel(storedFont);
    }, []);

    const toggleHighContrast = () => {
        const newVal = !highContrast;
        setHighContrast(newVal);
        localStorage.setItem("pub-high-contrast", String(newVal));
    };

    const increaseFontSize = () => {
        let newVal = fontSizeLevel >= 3 ? 1 : fontSizeLevel + 1;
        setFontSizeLevel(newVal);
        localStorage.setItem("pub-font-size", String(newVal));
    };

    const getFontSizeClass = () => {
        if (fontSizeLevel === 2) return "text-lg";
        if (fontSizeLevel === 3) return "text-xl";
        return "text-base";
    };

    return (
        <div
            dir={i18n.dir()}
            className={`min-h-screen flex flex-col font-sans transition-colors duration-150 ${highContrast ? "bg-black text-white" : "bg-slate-900 text-slate-100"
                } ${getFontSizeClass()}`}
        >

            {/* Top Accessibility & Action Bar */}
            <div className={`text-xs px-4 py-2 flex items-center justify-between border-b ${highContrast ? "bg-zinc-900 border-zinc-800" : "bg-slate-950 border-slate-800"
                }`}>
                <div className="flex items-center gap-4">
                    <span className="font-semibold text-slate-400">{t("public.portalTitle", "CITIZEN PORTAL — VERIFIED DISASTER RESPONSE RESOURCES")}</span>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleHighContrast}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded border text-xs font-medium transition ${highContrast
                            ? "bg-white text-black border-white hover:bg-zinc-200"
                            : "bg-slate-900 text-cyan-400 border-cyan-500/30 hover:bg-slate-800"
                            }`}
                        title="Toggle high contrast accessibility mode"
                        aria-label="Toggle high contrast accessibility mode"
                    >
                        {highContrast ? <EyeOff size={14} /> : <Eye size={14} />}
                        {highContrast ? "Normal Mode" : "High Contrast"}
                    </button>

                    <button
                        onClick={increaseFontSize}
                        className={`px-2.5 py-1 rounded border text-xs font-semibold transition ${highContrast
                            ? "bg-white text-black border-white hover:bg-zinc-200"
                            : "bg-slate-900 text-cyan-400 border-cyan-500/30 hover:bg-slate-800"
                            }`}
                        title="Change text size"
                        aria-label="Increase text size"
                    >
                        Size: {fontSizeLevel === 1 ? "A" : fontSizeLevel === 2 ? "A+" : "A++"}
                    </button>

                    <select
                        value={i18n.language?.startsWith("ml") ? "ml" : "en"}
                        onChange={(e) => i18n.changeLanguage(e.target.value)}
                        className={`px-2.5 py-1 rounded border text-xs font-bold transition ${highContrast
                            ? "bg-black text-white border-white"
                            : "bg-slate-900 text-cyan-400 border-cyan-500/30 hover:bg-slate-800"
                            } outline-none cursor-pointer`}
                    >
                        <option value="en">English</option>
                        <option value="ml">മലയാളം</option>
                    </select>

                    <button
                        onClick={() => navigate("/login")}
                        className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded font-medium shadow-md text-xs transition border-0 cursor-pointer"
                    >
                        <Lock size={12} />
                        {t("public.officerLogin", "Officer Login")}
                    </button>
                </div>
            </div>

            {/* Main Header */}
            <header className={`sticky top-0 z-40 backdrop-blur-md border-b ${highContrast ? "bg-black border-zinc-700" : "bg-slate-950/80 border-slate-800/80"
                }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/public" className="flex items-center gap-2 group">
                        <div className="p-2 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg group-hover:scale-105 transition shadow-lg shadow-red-500/20">
                            <ShieldAlert className="text-white w-6 h-6" />
                        </div>
                        <span className="font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300">
                            {t("public.title", "Kerala Disaster Response")}
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center gap-1">
                        {publicMenus.map((menu) => (
                            <NavLink
                                key={menu.name}
                                to={menu.to}
                                end={menu.to === "/public"}
                                className={({ isActive }) => `
                                    flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200
                                    ${isActive
                                        ? "bg-slate-800/80 text-cyan-400 border border-slate-700"
                                        : "text-slate-300 hover:text-white hover:bg-slate-800/30"
                                    }
                                    ${highContrast && isActive ? "bg-white text-black border-white" : ""}
                                    ${highContrast && !isActive ? "text-slate-350 hover:bg-zinc-800" : ""}
                                `}
                            >
                                <menu.icon size={16} />
                                {t("public." + menu.key, menu.name)}
                            </NavLink>
                        ))}
                    </nav>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className={`lg:hidden p-2 rounded-lg transition ${highContrast ? "bg-zinc-900 border border-zinc-700 text-white" : "bg-slate-900 text-slate-300 hover:text-white"
                            }`}
                        aria-label="Toggle navigation menu"
                    >
                        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                {/* Mobile Navigation Dropdown */}
                {mobileMenuOpen && (
                    <div className={`lg:hidden border-b px-4 pt-2 pb-4 space-y-1 shadow-2xl animate-fade-in ${highContrast ? "bg-black border-zinc-700" : "bg-slate-950 border-slate-800"
                        }`}>
                        {publicMenus.map((menu) => (
                            <NavLink
                                key={menu.name}
                                to={menu.to}
                                end={menu.to === "/public"}
                                onClick={() => setMobileMenuOpen(false)}
                                className={({ isActive }) => `
                                    flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-base transition-colors
                                    ${isActive
                                        ? "bg-slate-850 text-cyan-400"
                                        : "text-slate-300 hover:text-white hover:bg-slate-900"
                                    }
                                    ${highContrast && isActive ? "bg-white text-black border-white" : ""}
                                `}
                            >
                                <menu.icon size={18} />
                                {t("public." + menu.key, menu.name)}
                            </NavLink>
                        ))}
                    </div>
                )}
            </header>

            {/* Live Advisories Ticker */}
            <div className={`py-1.5 overflow-hidden ${highContrast ? "bg-amber-400 text-black font-bold" : "bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border-b border-amber-500/10 text-amber-300"
                } text-xs`}>
                <div className="max-w-7xl mx-auto px-4 flex items-center gap-2">
                    <span className="shrink-0 inline-flex items-center gap-1 font-bold tracking-wider uppercase bg-amber-500/20 px-2 py-0.5 rounded text-[10px] border border-amber-500/30">
                        {t("public.notice", "Notice")}
                    </span>
                    <marquee className="cursor-pointer font-medium" scrollamount="4">
                        {t("public.noticeText", "⚠️ Heavy Rain Warn alerts are active for Idukki and Wayanad. Dial 1077 (District Control) to receive instant updates. Citizens stranded in flooded zones or needing urgent food shelter coordination can register SOS requests. ⚠️ Keep emergency kit ready with essential documents, flashlights, water, food resources.")}
                    </marquee>
                </div>
            </div>

            {/* Page Body Context */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
                <Outlet context={{ highContrast, fontSizeLevel }} />
            </main>

            {/* Footer */}
            <footer className={`mt-auto border-t text-sm py-8 ${highContrast ? "bg-black border-zinc-700 text-zinc-400" : "bg-slate-950 border-slate-900 text-slate-500"
                }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <ShieldAlert className="text-red-500 w-5 h-5" />
                                <span className="font-bold text-slate-200">Kerala Disaster Intelligence Platform</span>
                            </div>
                            <p className="text-xs leading-relaxed">
                                A central initiative of the Department of Disaster Management to process real-time hazard analytics, flood routing risk vectors, and rescue operations coordination pipelines.
                            </p>
                        </div>

                        <div>
                            <span className="font-semibold text-slate-350 block mb-3">Quick Resources</span>
                            <ul className="space-y-1.5 text-xs">
                                <li><Link to="/public/alerts" className="hover:text-cyan-400 transition">Active Rain Warning Indexes</Link></li>
                                <li><Link to="/public/shelters" className="hover:text-cyan-400 transition">Find Safe Evacuation Shelters</Link></li>
                                <li><Link to="/public/education" className="hover:text-cyan-400 transition">Family Emergency Toolkit checklist</Link></li>
                                <li><Link to="/sos" className="hover:text-red-400 transition font-medium">Create Live Citizen SOS Request</Link></li>
                            </ul>
                        </div>

                        <div>
                            <span className="font-semibold text-slate-350 block mb-3">Emergency Contact Networks</span>
                            <div className="text-xs space-y-1 text-slate-400">
                                <p className="font-semibold">State Emergency Center: <span className="text-red-500 tracking-wider">1070</span></p>
                                <p className="font-semibold">District Helpline: <span className="text-red-500 tracking-wider">1077</span></p>
                                <p className="mt-2 text-[11px] leading-tight">
                                    Advisories are certified by the State Disaster Management Authority. In critical situations, stay calm and wait in elevated dry areas.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-900 pt-6 flex flex-col md:flex-row items-center justify-between text-xs">
                        <p>© {new Date().getFullYear()} Kerala Disaster Response Portal. Developed for Public Good. WCAG 2.1 Compliant.</p>
                        <div className="flex gap-4 mt-2 md:mt-0">
                            <span className="hover:underline cursor-pointer">Privacy Policy</span>
                            <span className="hover:underline cursor-pointer">Disclaimer Notice</span>
                            <span className="hover:underline cursor-pointer">Accessibility Statement</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default PublicLayout;
