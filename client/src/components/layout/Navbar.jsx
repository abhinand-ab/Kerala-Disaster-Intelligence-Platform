import { Search, Menu, Package, AlertTriangle, Users, Truck, Home, Building2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import useIncidents from "../../features/incidents/hooks/useIncidents";
import useShelters from "../../hooks/useShelters";
import useVolunteers from "../../hooks/useVolunteers";
import useRescueTeams from "../../hooks/useRescueTeams";
import useWarehouses from "../../hooks/useWarehouses";

const badgeColors = {
  Incident: "bg-rose-50 text-rose-700 ring-rose-200 border-rose-100",
  Shelter: "bg-emerald-50 text-emerald-700 ring-emerald-200 border-emerald-100",
  Volunteer: "bg-cyan-50 text-cyan-700 ring-cyan-200 border-cyan-100",
  "Rescue Team": "bg-blue-50 text-blue-700 ring-blue-200 border-blue-100",
  Warehouse: "bg-indigo-50 text-indigo-750 ring-indigo-200 border-indigo-100",
};

const Navbar = ({ onToggleMenu }) => {
  const { t, i18n } = useTranslation();
  const [searchVal, setSearchVal] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Hook invocations
  const { incidents = [] } = useIncidents() || {};
  const { shelters = [] } = useShelters() || {};
  const { volunteers = [] } = useVolunteers() || {};
  const { rescueTeams = [] } = useRescueTeams() || {};
  const { warehouses = [] } = useWarehouses() || {};

  const trimmed = searchVal.trim().toLowerCase();

  const results = useMemo(() => {
    if (!trimmed) return [];

    const matchedIncidents = (incidents || [])
      .filter(i => (i.title || "").toLowerCase().includes(trimmed) || (i.category || "").toLowerCase().includes(trimmed))
      .slice(0, 3)
      .map(i => ({ type: "Incident", title: i.title, subtitle: i.category, link: "/incidents", raw: i }));

    const matchedShelters = (shelters || [])
      .filter(s => (s.shelterName || "").toLowerCase().includes(trimmed) || (s.district || "").toLowerCase().includes(trimmed))
      .slice(0, 3)
      .map(s => ({ type: "Shelter", title: s.shelterName, subtitle: s.district, link: "/shelters", raw: s }));

    const matchedVolunteers = (volunteers || [])
      .filter(v => (v.fullName || "").toLowerCase().includes(trimmed) || (v.district || "").toLowerCase().includes(trimmed))
      .slice(0, 3)
      .map(v => ({ type: "Volunteer", title: v.fullName, subtitle: v.district, link: "/volunteers", raw: v }));

    const matchedTeams = (rescueTeams || [])
      .filter(t => (t.teamName || "").toLowerCase().includes(trimmed) || (t.district || "").toLowerCase().includes(trimmed))
      .slice(0, 3)
      .map(t => ({ type: "Rescue Team", title: t.teamName, subtitle: `${t.district} (${t.status || 'Active'})`, link: "/rescue-teams", raw: t }));

    const matchedWarehouses = (warehouses || [])
      .filter(w => (w.warehouseName || "").toLowerCase().includes(trimmed) || (w.district || "").toLowerCase().includes(trimmed))
      .slice(0, 3)
      .map(w => ({ type: "Warehouse", title: w.warehouseName, subtitle: w.district, link: "/warehouses", raw: w }));

    return [
      ...matchedIncidents,
      ...matchedShelters,
      ...matchedVolunteers,
      ...matchedTeams,
      ...matchedWarehouses
    ];
  }, [trimmed, incidents, shelters, volunteers, rescueTeams, warehouses]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleItemClick = (item) => {
    setSearchVal("");
    setIsOpen(false);
    navigate(item.link);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30 font-sans">
      {/* Left - Hamburger and Logo */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMenu}
          className="p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-100 md:hidden transition cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          <Menu size={22} />
        </button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-blue-600 flex items-center gap-2">
            <span>🛡️</span>
            <span className="hidden sm:inline">{t("navbar.title", "Kerala Disaster Intelligence")}</span>
            <span className="sm:hidden text-base truncate max-w-[140px]">{t("navbar.title", "Kerala Disaster Intelligence")}</span>
          </h1>
        </div>
      </div>

      {/* Global Search - Centralized Entity Navigation */}
      <div className="hidden md:flex relative w-72 lg:w-96" ref={dropdownRef}>
        <div className="flex items-center bg-slate-100 rounded-xl px-4 py-2 w-full border border-transparent focus-within:border-blue-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100 transition duration-200">
          <Search size={18} className="text-slate-500" />
          <input
            type="text"
            value={searchVal}
            onChange={(e) => {
              setSearchVal(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={t("navbar.search", "Global search entities...")}
            className="bg-transparent outline-none ml-3 w-full text-slate-800 text-sm font-semibold"
          />
        </div>

        {isOpen && searchVal.trim() && (
          <div className="absolute top-12 left-0 right-0 max-h-80 overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 animate-in fade-in duration-200">
            {results.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 font-bold">
                No matching incidents, shelters, or personnel found.
              </div>
            ) : (
              <div className="space-y-1">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Intel Registry Matches
                </div>
                {results.map((item, idx) => {
                  const badgeCol = badgeColors[item.type] || "bg-slate-50 text-slate-600";
                  return (
                    <button
                      key={idx}
                      onClick={() => handleItemClick(item)}
                      type="button"
                      className="w-full text-left flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition cursor-pointer"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-bold text-slate-800 truncate">{item.title}</div>
                        <div className="text-[10px] text-slate-450 font-bold mt-0.5 truncate">{item.subtitle}</div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold border ${badgeCol}`}>
                        {item.type}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right - Language Switcher */}
      <div className="flex items-center gap-5">
        <select
          value={i18n.language?.startsWith("ml") ? "ml" : "en"}
          onChange={(e) => i18n.changeLanguage(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold bg-white text-slate-750 outline-none cursor-pointer hover:border-slate-300 transition"
        >
          <option value="en">English</option>
          <option value="ml">മലയാളം</option>
        </select>
      </div>
    </header>
  );
};

export default Navbar;