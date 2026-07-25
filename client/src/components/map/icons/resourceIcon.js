import L from "leaflet";

export const createResourceIcon = (resource) => {
    const status = resource?.status;
    let statusBorderClass = "border-cyan-500";
    let statusPulseClass = "bg-cyan-500";

    if (status === "Out of Stock") {
        statusBorderClass = "border-rose-500";
        statusPulseClass = "bg-rose-500";
    } else if (status === "Low Stock") {
        statusBorderClass = "border-amber-500";
        statusPulseClass = "bg-amber-500";
    }

    const html = `
    <div class="relative flex items-center justify-center w-8 h-8">
      <!-- Glow Ring -->
      <div class="absolute w-8 h-8 rounded-full ${statusPulseClass} opacity-20 animate-pulse pointer-events-none"></div>
      
      <!-- Outer Border white circle container -->
      <div class="relative flex items-center justify-center w-7.5 h-7.5 rounded-full bg-white border-2 ${statusBorderClass} shadow-md">
        <!-- Package Icon -->
        <svg class="w-3.5 h-3.5 text-cyan-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
          <line x1="12" y1="22.08" x2="12" y2="12"/>
        </svg>
      </div>
    </div>
  `;

    return L.divIcon({
        html,
        className: "custom-resource-marker-container",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
    });
};
