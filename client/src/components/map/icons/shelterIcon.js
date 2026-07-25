import L from "leaflet";

const getShelterProgress = (shelter) => {
    const capacity = Number(shelter?.capacity) || 0;
    const occupancy = Number(shelter?.occupancy) || 0;

    if (capacity <= 0) {
        return 0;
    }

    return Math.min(Math.round((occupancy / capacity) * 100), 100);
};

export const getShelterStatus = (shelter) => {
    if (shelter?.status === "Closed") {
        return "Closed";
    }

    const capacity = Number(shelter?.capacity) || 0;
    const occupancy = Number(shelter?.occupancy) || 0;

    if (capacity > 0 && occupancy >= capacity) {
        return "Full";
    }

    // Under Step 4 & 5, Nearly Full is occupancy >= 80%
    if (capacity > 0 && (occupancy / capacity) >= 0.8) {
        return "Nearly Full";
    }

    return "Open";
};

export const createShelterIcon = (shelter) => {
    const status = getShelterStatus(shelter);
    let statusBorderClass = "border-emerald-500";
    let statusPulseClass = "bg-emerald-500";

    switch (status) {
        case "Open":
            statusBorderClass = "border-emerald-500";
            statusPulseClass = "bg-emerald-500";
            break;
        case "Nearly Full":
            statusBorderClass = "border-orange-500";
            statusPulseClass = "bg-orange-500";
            break;
        case "Full":
            statusBorderClass = "border-rose-500";
            statusPulseClass = "bg-rose-500";
            break;
        case "Closed":
            statusBorderClass = "border-slate-400";
            statusPulseClass = "bg-slate-400";
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
        <!-- Blue Shelter/Home Icon -->
        <svg class="w-4 h-4 text-cyan-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </div>
    </div>
  `;

    return L.divIcon({
        html,
        className: "custom-shelter-marker-container",
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18],
    });
};
