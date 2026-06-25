import { createContext, useContext, useState } from "react";

const MapContext = createContext();

export const MapProvider = ({ children }) => {
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

  return (
    <MapContext.Provider value={{ layers, toggleLayer }}>
      {children}
    </MapContext.Provider>
  );
};

export const useMap = () => useContext(MapContext);