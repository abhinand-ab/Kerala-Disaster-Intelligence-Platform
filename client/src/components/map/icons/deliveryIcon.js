import L from "leaflet";

export const createDeliveryIcon = (mission) => {
    const status = mission?.missionStatus;
    let statusBorderClass = "border-cyan-600";
    let statusPulseClass = "bg-cyan-600";

    if (status === "Completed") {
        statusBorderClass = "border-emerald-500";
        statusPulseClass = "bg-emerald-500";
    } else if (status === "Cancelled") {
        statusBorderClass = "border-red-500";
        statusPulseClass = "bg-red-500";
    } else if (status === "In Transit") {
        statusBorderClass = "border-sky-500";
        statusPulseClass = "bg-sky-500";
    }

    const html = `
    <div class="relative flex items-center justify-center w-10 h-10">
      <!-- Glow Ring -->
      <div class="absolute w-10 h-10 rounded-full ${statusPulseClass} opacity-20 animate-pulse pointer-events-none"></div>
      
      <!-- Outer Border white circle container -->
      <div class="relative flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 ${statusBorderClass} shadow-md">
        <!-- Cyan/Sky Truck Icon -->
        <svg class="w-4 h-4 text-cyan-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 18H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2Z"/>
          <path d="M14 6h4l4 4v6h-8"/>
          <circle cx="7.5" cy="18.5" r="2.5"/>
          <circle cx="16.5" cy="18.5" r="2.5"/>
        </svg>
      </div>
    </div>
  `;

    return L.divIcon({
        html,
        className: "custom-delivery-marker-container",
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20],
    });
};
