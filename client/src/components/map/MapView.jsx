import { MapContainer, TileLayer } from "react-leaflet";
import DistrictLayer from "./layers/DistrictLayer";
import { useMap } from "../../context/MapContext";
import { useMapEvents } from "react-leaflet";
import IncidentModal from "../../features/incidents/components/IncidentModal";
import IncidentLayer from "./layers/IncidentLayer";
import { useMap as useLeafletMap } from "react-leaflet";
import { useEffect } from "react";

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

const MapView = () => {
  const { layers } = useMap();

  return (
    <MapContainer
      center={[10.8505, 76.2711]}
      zoom={8}
      scrollWheelZoom={true}
      className="w-full h-full rounded-xl"
    >
      <MapClickHandler />
      <ResizeMap />

      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Render layers based on toggle state */}
      {layers.districts && <DistrictLayer />}
      {layers.incidents && <IncidentLayer />}

      {/* Future Layers */}
      {/* {layers.flood && <FloodLayer />} */}
      {/* {layers.incidents && <IncidentLayer />} */}
      {/* {layers.shelters && <ShelterLayer />} */}
      {/* {layers.delivery && <DeliveryLayer />} */}
      {/* {layers.aqi && <AQILayer />} */}
      {/* {layers.weather && <WeatherLayer />} */}

      <IncidentModal />
    </MapContainer>
  );
};

export default MapView;