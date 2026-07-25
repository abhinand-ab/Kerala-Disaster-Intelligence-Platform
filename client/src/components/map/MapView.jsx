import { MapContainer, TileLayer, ScaleControl, useMapEvents, useMap as useLeafletMap } from "react-leaflet";
import DistrictLayer from "./layers/DistrictLayer";
import { useMap } from "../../context/MapContext";
import { useEffect, useState } from "react";
import IncidentModal from "../../features/incidents/components/IncidentModal";
import IncidentLayer from "./layers/IncidentLayer";
import ShelterLayer from "./layers/ShelterLayer";
import VolunteerLayer from "./layers/VolunteerLayer";
import RescueTeamLayer from "./layers/RescueTeamLayer";
import EvacuationRouteLayer from "./layers/EvacuationRouteLayer";
import WarehouseLayer from "./layers/WarehouseLayer";
import ResourceLayer from "./layers/ResourceLayer";
import DeliveryLayer from "./layers/DeliveryLayer";
import VehicleLayer from "./layers/VehicleLayer";
import WeatherLayer from "./layers/WeatherLayer";
import RiskLayer from "./layers/RiskLayer";
import EmergencyLayer from "./layers/EmergencyLayer";
import SensorLayer from "./layers/SensorLayer";
import AIRecommendationLayer from "./layers/AIRecommendationLayer";
import CommandCenterLayer from "./layers/CommandCenterLayer";
import useShelters from "../../hooks/useShelters";
import { toast } from "react-hot-toast";

const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const deg2rad = (deg) => deg * (Math.PI / 180);
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

function MapClickHandler() {
  const { openIncidentModal } = useMap();

  useMapEvents({
    click(e) {
      openIncidentModal(e.latlng);
    },
  });

  return null;
}

function ResizeMap() {
  const map = useLeafletMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => clearTimeout(timer);
  }, [map]);

  return null;
}

function MouseCoordinatesControl() {
  const [coords, setCoords] = useState(null);
  useMapEvents({
    mousemove(e) {
      setCoords(e.latlng);
    }
  });

  if (!coords) return null;

  return (
    <div className="absolute bottom-16 right-4 z-[1000] pointer-events-none bg-white/90 backdrop-blur-sm border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm text-xs font-mono text-slate-800">
      Lat: {coords.lat.toFixed(5)}, Lng: {coords.lng.toFixed(5)}
    </div>
  );
}

function MapController() {
  const map = useLeafletMap();
  const { userLocation, navigationDest, mapFlyToTarget } = useMap();

  useEffect(() => {
    if (userLocation) {
      map.flyTo(userLocation, 13);
    }
  }, [userLocation, map]);

  useEffect(() => {
    if (navigationDest && navigationDest.latitude && navigationDest.longitude) {
      map.flyTo([navigationDest.latitude, navigationDest.longitude], 12);
    }
  }, [navigationDest, map]);

  useEffect(() => {
    if (mapFlyToTarget) {
      map.flyTo(mapFlyToTarget, 12);
    }
  }, [mapFlyToTarget, map]);

  return null;
}

const MapView = () => {
  const {
    layers,
    setLayers,
    locateUser,
    isLocating,
    setNavigationDest,
  } = useMap();
  const { shelters } = useShelters();

  const handleEmergencyEvacuate = () => {
    locateUser((coords) => {
      if (!shelters || shelters.length === 0) {
        toast.error("No shelters are registered in the platform.");
        return;
      }

      // Filter for open, vacancy-available shelters
      const openShelters = shelters.filter((s) => {
        const capacity = Number(s.capacity) || 0;
        const occupancy = Number(s.occupancy) || 0;
        const isClosed = s.status === "Closed";
        const isFull = occupancy >= capacity || (capacity > 0 && (occupancy / capacity) >= 1.0);
        const hasCoords = Number(s.latitude) !== 0 && Number(s.longitude) !== 0;
        return hasCoords && !isClosed && !isFull;
      });

      if (openShelters.length === 0) {
        toast.error("No open, vacancy-available shelters found.");
        return;
      }

      let nearest = null;
      let minDistance = Infinity;

      openShelters.forEach((s) => {
        const dist = getDistanceKm(coords[0], coords[1], Number(s.latitude), Number(s.longitude));
        if (dist < minDistance) {
          minDistance = dist;
          nearest = s;
        }
      });

      if (nearest) {
        setNavigationDest(nearest);
        setLayers((prev) => ({ ...prev, shelters: true }));
        toast.success(`Routing to nearest safe shelter: ${nearest.name} (${minDistance.toFixed(1)} km)`);
      }
    });
  };

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={[10.8505, 76.2711]}
        zoom={8}
        scrollWheelZoom={true}
        className="h-full w-full rounded-xl"
      >
        <MapClickHandler />
        <ResizeMap />
        <MapController />
        <MouseCoordinatesControl />

        <ScaleControl position="bottomleft" />

        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Render layers based on toggle state */}
        {layers.districts && <DistrictLayer />}
        {layers.incidents && <IncidentLayer />}
        {layers.shelters && <ShelterLayer />}
        {layers.volunteers && <VolunteerLayer />}
        {layers.rescueTeams && <RescueTeamLayer />}
        {layers.warehouses && <WarehouseLayer />}
        {layers.resources && <ResourceLayer />}
        {layers.delivery && <DeliveryLayer />}
        {layers.vehicles && <VehicleLayer />}
        {layers.emergencySOS && <EmergencyLayer />}
        {layers.sensors && <SensorLayer />}
        {layers.aiRecommendations && <AIRecommendationLayer />}
        {layers.commandCenters && <CommandCenterLayer />}
        <EvacuationRouteLayer />

        {layers.weather && <WeatherLayer />}

        {(layers.floodRisk || layers.landslideRisk || layers.combinedRisk || layers.heatmap || layers.historicalDisasterPoints) && (
          <RiskLayer
            showFlood={layers.floodRisk}
            showLandslide={layers.landslideRisk}
            showCombined={layers.combinedRisk}
            showHeatmap={layers.heatmap}
            showHistorical={layers.historicalDisasterPoints}
          />
        )}

        <IncidentModal />
      </MapContainer>

      {/* Floating Evacuate Action Trigger Button */}
      <div className="absolute bottom-5 left-5 z-[1000] p-0.5 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 shadow-xl hover:shadow-rose-500/25 transition-all duration-300">
        <button
          type="button"
          onClick={handleEmergencyEvacuate}
          disabled={isLocating}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 border border-white/10 hover:bg-slate-800 text-white font-bold transition-all disabled:opacity-85 disabled:cursor-not-allowed"
        >
          {isLocating ? (
            <svg className="animate-spin h-5 w-5 text-rose-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="h-5 w-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
          <span>Emergency Evacuate</span>
        </button>
      </div>
    </div>
  );
};

export default MapView;