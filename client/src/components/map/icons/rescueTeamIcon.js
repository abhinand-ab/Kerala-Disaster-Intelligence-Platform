import L from "leaflet";

export const getRescueTeamStatusColor = (status) => {
    switch (status) {
        case "Available":
            return { border: "border-emerald-500", bg: "bg-emerald-500", text: "text-emerald-700", ring: "ring-emerald-100" };
        case "On Mission":
            return { border: "border-amber-500", bg: "bg-amber-500", text: "text-amber-700", ring: "ring-amber-100" };
        case "Returning":
            return { border: "border-cyan-500", bg: "bg-cyan-500", text: "text-cyan-700", ring: "ring-cyan-100" };
        case "Maintenance":
            return { border: "border-slate-500", bg: "bg-slate-500", text: "text-slate-700", ring: "ring-slate-100" };
        case "Inactive":
            return { border: "border-rose-500", bg: "bg-rose-500", text: "text-rose-700", ring: "ring-rose-100" };
        default:
            return { border: "border-blue-500", bg: "bg-blue-500", text: "text-blue-700", ring: "ring-blue-100" };
    }
};

export const createRescueTeamIcon = (team) => {
    const colors = getRescueTeamStatusColor(team.status);

    const html = `
    <div class="relative flex items-center justify-center w-10 h-10">
      <!-- Glow Effect -->
      <div class="absolute w-10 h-10 rounded-full ${colors.bg} opacity-20 animate-pulse pointer-events-none"></div>
      
      <!-- Outer status border container -->
      <div class="relative flex items-center justify-center w-9 h-9 rounded-full bg-white border-2 ${colors.border} shadow-lg">
        <!-- Shield icon inside for Team -->
        <svg class="w-5 h-5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <path d="M12 8v8M9 12h6"/>
        </svg>
      </div>
    </div>
  `;

    return L.divIcon({
        html,
        className: "custom-rescue-team-marker-container",
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20],
    });
};
