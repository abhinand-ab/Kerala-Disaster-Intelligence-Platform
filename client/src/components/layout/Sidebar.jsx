import {
  LayoutDashboard,
  Building2,
  Users,
  Map,
  CloudRain,
  TriangleAlert,
  Truck,
  BarChart3,
  Settings,
  Package,
  Shield,
  Mountain,
  ShieldAlert,
  Cpu,
  Brain,
  Radio,
  History,
} from "lucide-react";

import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";

const menus = [
  { name: "Dashboard", key: "dashboard", icon: LayoutDashboard, to: "/" },
  { name: "Emergency Portal", key: "emergencyPortal", icon: ShieldAlert, to: "/emergency-dashboard" },
  { name: "Crisis Command", key: "crisisCommand", icon: Radio, to: "/command-center" },
  { name: "AI Decisions", key: "aiDecisions", icon: Brain, to: "/ai-decisions" },
  { name: "IoT Sensors", key: "iotSensors", icon: Cpu, to: "/sensors" },
  { name: "Risk Intelligence", key: "riskIntelligence", icon: Mountain, to: "/risk" },
  { name: "Shelters", key: "shelters", icon: Building2, to: "/shelters" },
  { name: "Volunteers", key: "volunteers", icon: Users, to: "/volunteers" },
  { name: "Rescue Teams", key: "rescueTeams", icon: Shield, to: "/rescue-teams" },
  { name: "Resources", key: "resources", icon: Package, to: "/resources" },
  { name: "Warehouses", key: "warehouses", icon: Building2, to: "/warehouses" },
  { name: "Live Map", key: "liveMap", icon: Map, to: "/map" },
  { name: "Flood Alerts", key: "floodAlerts", icon: CloudRain, to: "/alerts" },
  { name: "Incidents", key: "incidents", icon: TriangleAlert, to: "/incidents" },
  { name: "Rescue Fleet", key: "rescueFleet", icon: Truck, to: "/vehicles" },
  { name: "Delivery", key: "delivery", icon: Truck, to: "/delivery" },
  { name: "Analytics", key: "analytics", icon: BarChart3, to: "/analytics" },
  { name: "Audit Logs", key: "auditLogs", icon: History, to: "/audit", roles: ["admin", "auditor"] },
  { name: "Settings", key: "settings", icon: Settings, to: "/settings" },
];

const Sidebar = ({ isMobileOpen, setIsMobileOpen }) => {
  const location = useLocation();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();

  const filteredMenus = menus.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role?.toLowerCase());
  });

  const isRtl = i18n.dir() === "rtl";
  const mobileTranslateClass = isMobileOpen
    ? "translate-x-0"
    : isRtl
      ? "translate-x-full"
      : "-translate-x-full";

  return (
    <aside
      className={`
        h-[calc(100vh-64px)]
        bg-white
        p-4 lg:p-5 overflow-y-auto scrollbar-thin
        transition-all duration-300 ease-in-out
        lg:w-[280px] md:w-20 w-[280px]
        sticky top-16 z-40
        ${isRtl ? "right-0 border-l border-r-0" : "left-0 border-r border-l-0"}
        ${mobileTranslateClass}
        max-md:fixed md:translate-x-0
        border-slate-200
      `}
    >
      <ul className="space-y-3">
        {filteredMenus.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <li key={item.name}>
              <NavLink
                to={item.to}
                onClick={() => setIsMobileOpen(false)}
                className={`
                  flex items-center rounded-xl cursor-pointer transition-all duration-200 py-3 gap-3 px-5
                  lg:px-5 md:px-0 md:justify-center lg:justify-start
                  border-l-4
                  ${isActive
                    ? "bg-blue-50 border-blue-600 text-blue-750 font-semibold"
                    : "border-transparent text-slate-700 hover:bg-slate-100 hover:text-blue-600"
                  }
                `}
              >
                <item.icon
                  size={20}
                  className={`shrink-0 transition-colors duration-200 ${isActive
                      ? "text-blue-600"
                      : "text-slate-505"
                    }`}
                />
                <span className="lg:block md:hidden block truncate">
                  {t("sidebar." + item.key, item.name)}
                </span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </aside>
  );
};

export default Sidebar;