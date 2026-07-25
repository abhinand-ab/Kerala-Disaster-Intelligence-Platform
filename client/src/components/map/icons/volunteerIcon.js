import L from "leaflet";

export const getVolunteerStatus = (volunteer) => {
    const isAvail = volunteer?.status === "Available" || volunteer?.availability;
    return isAvail ? "Available" : "Busy";
};

export const createVolunteerIcon = (volunteer) => {
    const status = getVolunteerStatus(volunteer);
    let statusBorderClass = "border-emerald-500";
    let statusPulseClass = "bg-emerald-500";

    switch (status) {
        case "Available":
            statusBorderClass = "border-emerald-500";
            statusPulseClass = "bg-emerald-500";
            break;
        case "Busy":
            statusBorderClass = "border-amber-500";
            statusPulseClass = "bg-amber-500";
            break;
        default:
            statusBorderClass = "border-cyan-500";
            statusPulseClass = "bg-cyan-500";
    }

    const html = `
    <div class="relative flex items-center justify-center w-9 h-9">
      <!-- Glow Effect -->
      <div class="absolute w-9 h-9 rounded-full ${statusPulseClass} opacity-20 animate-pulse pointer-events-none"></div>
      
      <!-- Outer status-colored border on white circle icon container -->
      <div class="relative flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 ${statusBorderClass} shadow-md">
        <!-- Blue User/Volunteer Icon -->
        <svg class="w-4 h-4 text-cyan-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </div>
    </div>
  `;

    return L.divIcon({
        html,
        className: "custom-volunteer-marker-container",
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18],
    });
};
