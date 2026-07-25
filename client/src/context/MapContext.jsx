import { createContext, useContext, useState } from "react";
import { toast } from "react-hot-toast";

const MapContext = createContext();

export const MapProvider = ({ children }) => {
  // ===============================
  // Layer Visibility
  // ===============================
  const [layers, setLayers] = useState({
    districts: true,
    flood: false,
    incidents: false,
    shelters: false,
    delivery: true,
    aqi: false,
    weather: false,
    volunteers: true,
    rescueTeams: true,
    warehouses: true,
    resources: true,
    vehicles: true,
    floodRisk: false,
    landslideRisk: false,
    combinedRisk: false,
    heatmap: false,
    historicalDisasterPoints: false,
    emergencySOS: true,
    sensors: true,
    aiRecommendations: false,
    commandCenters: true,
  });

  const toggleLayer = (layer) => {
    setLayers((prev) => ({
      ...prev,
      [layer]: !prev[layer],
    }));
  };

  // ===============================
  // Incident Reporting
  // ===============================

  const [clickedLocation, setClickedLocation] = useState(null);

  const [isIncidentModalOpen, setIncidentModalOpen] =
    useState(false);

  const [selectedIncident, setSelectedIncident] =
    useState(null);

  const openIncidentModal = (latlng) => {
    setClickedLocation(latlng);
    setIncidentModalOpen(true);
  };

  const closeIncidentModal = () => {
    setIncidentModalOpen(false);
    setClickedLocation(null);
  };

  const [userLocation, setUserLocation] = useState(null);
  const [navigationDest, setNavigationDest] = useState(null);
  const [activeRoute, setActiveRoute] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [mapFlyToTarget, setMapFlyToTarget] = useState(null);

  const locateUser = (callback) => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newLoc = [latitude, longitude];
        setUserLocation(newLoc);
        setIsLocating(false);
        if (callback) {
          callback(newLoc);
        }
      },
      (geoError) => {
        console.error("Geolocation error:", geoError);
        toast.error("Failed to retrieve your current location. Make sure GPS permissions are enabled.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <MapContext.Provider
      value={{
        // Layers
        layers,
        toggleLayer,
        setLayers,

        // Incident
        clickedLocation,
        isIncidentModalOpen,
        selectedIncident,

        openIncidentModal,
        closeIncidentModal,

        setSelectedIncident,

        // Navigation
        userLocation,
        setUserLocation,
        navigationDest,
        setNavigationDest,
        activeRoute,
        setActiveRoute,
        routeInfo,
        setRouteInfo,
        isLocating,
        setIsLocating,
        locateUser,
        mapFlyToTarget,
        setMapFlyToTarget,
      }}
    >
      {children}
    </MapContext.Provider>
  );
};

export const useMap = () => useContext(MapContext);