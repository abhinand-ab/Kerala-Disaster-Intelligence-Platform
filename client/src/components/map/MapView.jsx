import { MapContainer, TileLayer } from "react-leaflet";
import DistrictLayer from "./layers/DistrictLayer";
import { useMap } from "../../context/MapContext";

const MapView = () => {
  const { layers } = useMap();

  return (
    <MapContainer
      center={[10.8505, 76.2711]}
      zoom={8}
      scrollWheelZoom={true}
      className="w-full h-full rounded-xl"
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Render layers based on toggle state */}
      {layers.districts && <DistrictLayer />}

      {/* Future Layers */}
      {/* {layers.flood && <FloodLayer />} */}
      {/* {layers.incidents && <IncidentLayer />} */}
      {/* {layers.shelters && <ShelterLayer />} */}
      {/* {layers.delivery && <DeliveryLayer />} */}
      {/* {layers.aqi && <AQILayer />} */}
      {/* {layers.weather && <WeatherLayer />} */}
    </MapContainer>
  );
};

export default MapView;