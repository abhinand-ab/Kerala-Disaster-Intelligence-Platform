import {
  LayoutDashboard,
  Map,
  CloudRain,
  TriangleAlert,
  Truck,
  House,
  BarChart3,
  Settings,
} from "lucide-react";

const menus = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Live Map", icon: Map },
  { name: "Flood Alerts", icon: CloudRain },
  { name: "Incidents", icon: TriangleAlert },
  { name: "Delivery", icon: Truck },
  { name: "Shelters", icon: House },
  { name: "Analytics", icon: BarChart3 },
  { name: "Settings", icon: Settings },
];

const Sidebar = () => {
  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-[calc(100vh-64px)] p-5">
      <ul className="space-y-3">
        {menus.map((item) => (
          <li
            key={item.name}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-blue-50 hover:text-blue-600 cursor-pointer transition"
          >
            <item.icon size={20} />
            {item.name}
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default Sidebar;