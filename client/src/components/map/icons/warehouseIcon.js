import L from "leaflet";

export const createWarehouseIcon = (warehouse) => {
    const utilization = Number(warehouse?.currentUtilization) || 0;
    let statusBorderClass = "border-indigo-650";
    let statusPulseClass = "bg-indigo-650";

    if (utilization > 80) {
        statusBorderClass = "border-rose-500";
        statusPulseClass = "bg-rose-500";
    } else if (utilization > 50) {
        statusBorderClass = "border-amber-500";
        statusPulseClass = "bg-amber-500";
    }

    const html = `
    <div class="relative flex items-center justify-center w-10 h-10">
      <!-- Glow Ring -->
      <div class="absolute w-10 h-10 rounded-full ${statusPulseClass} opacity-20 animate-pulse pointer-events-none"></div>
      
      <!-- Outer Border white circle container -->
      <div class="relative flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 ${statusBorderClass} shadow-md">
        <!-- Indigo Warehouse Icon -->
        <svg class="w-4 h-4 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 22V4c0-.5.2-1 .6-1.4C5 2.2 5.5 2 6 2h12c.5 0 1 .2 1.4.6.4.4.6.9.6 1.4v18"/>
          <path d="M12 22v-5a2 2 0 0 0-2-2H6"/>
          <path d="M12 10V6"/>
          <path d="M18 10V6"/>
        </svg>
      </div>
    </div>
  `;

    return L.divIcon({
        html,
        className: "custom-warehouse-marker-container",
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20],
    });
};
