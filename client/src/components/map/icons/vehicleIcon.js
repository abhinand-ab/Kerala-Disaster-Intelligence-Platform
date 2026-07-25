import L from "leaflet";

const typeSVGs = {
    Ambulance: `
    <svg class="w-4 h-4 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 14c1.66 0 3-1.34 3-3V6c0-1.66-1.34-3-3-3H5C3.34 3 2 4.34 2 6v5c0 1.66 1.34 3 3 3"/>
      <path d="M12 5v8"/>
      <path d="M8 9h8"/>
      <circle cx="7" cy="18" r="2"/>
      <circle cx="17" cy="18" r="2"/>
    </svg>`,
    "Rescue Boat": `
    <svg class="w-4 h-4 text-sky-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 22a7 7 0 0 0 5-2H7a7 7 0 0 0 5 2Z"/>
      <path d="M12 2v10"/>
      <path d="M12 2 4 8h8"/>
    </svg>`,
    "Fire Engine": `
    <svg class="w-4 h-4 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
    </svg>`,
    "Police Vehicle": `
    <svg class="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>`,
    "Supply Truck": `
    <svg class="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 18H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2Z"/>
      <path d="M14 6h4l4 4v6h-8"/>
      <circle cx="7.5" cy="18.5" r="2.5"/>
      <circle cx="16.5" cy="18.5" r="2.5"/>
    </svg>`,
    "NDRF Vehicle": `
    <svg class="w-4 h-4 text-indigo-650" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10"/>
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
    </svg>`,
};

export const createVehicleIcon = (vehicle) => {
    const status = vehicle?.status || "Available";
    let statusBorderClass = "border-emerald-500";
    let statusPulseClass = "bg-emerald-500";

    if (status === "Assigned") {
        statusBorderClass = "border-blue-500";
        statusPulseClass = "bg-blue-500";
    } else if (status === "On Mission") {
        statusBorderClass = "border-amber-500";
        statusPulseClass = "bg-amber-500";
    } else if (status === "Returning") {
        statusBorderClass = "border-purple-500";
        statusPulseClass = "bg-purple-500";
    } else if (status === "Maintenance") {
        statusBorderClass = "border-rose-400";
        statusPulseClass = "bg-rose-400";
    }

    const svgHtml = typeSVGs[vehicle?.vehicleType] || typeSVGs["Supply Truck"];

    const html = `
    <div class="relative flex items-center justify-center w-10 h-10">
      <!-- Glow Ring -->
      <div class="absolute w-10 h-10 rounded-full ${statusPulseClass} opacity-20 animate-pulse pointer-events-none"></div>
      
      <!-- Outer Border white circle container -->
      <div class="relative flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 ${statusBorderClass} shadow-md">
        ${svgHtml}
      </div>
    </div>
  `;

    return L.divIcon({
        html,
        className: "custom-vehicle-marker-container",
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20],
    });
};
