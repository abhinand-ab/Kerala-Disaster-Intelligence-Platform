import { createContext, useContext, useState } from "react";

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
    delivery: false,
    aqi: false,
    weather: false,
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

  return (
    <MapContext.Provider
      value={{
        // Layers
        layers,
        toggleLayer,

        // Incident
        clickedLocation,
        isIncidentModalOpen,
        selectedIncident,

        openIncidentModal,
        closeIncidentModal,

        setSelectedIncident,
      }}
    >
      {children}
    </MapContext.Provider>
  );
};

export const useMap = () => useContext(MapContext);