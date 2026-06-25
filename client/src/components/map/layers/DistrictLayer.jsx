import { GeoJSON } from "react-leaflet";
import { useEffect, useState } from "react";

const defaultStyle = {
  color: "#2563eb",
  weight: 2,
  fillColor: "#bfdbfe",
  fillOpacity: 0.2,
};

const highlightStyle = {
  color: "#1d4ed8",
  weight: 3,
  fillColor: "#60a5fa",
  fillOpacity: 0.5,
};

const DistrictLayer = () => {
  const [districts, setDistricts] = useState(null);

  useEffect(() => {
    fetch("/data/kerala_districts.geojson")
      .then((res) => res.json())
      .then((data) => setDistricts(data));
  }, []);

  const onEachDistrict = (feature, layer) => {
    layer.bindPopup(`<strong>${feature.properties.DISTRICT}</strong>`);

    layer.on({
      mouseover: (e) => {
        e.target.setStyle(highlightStyle);
      },
      mouseout: (e) => {
        e.target.setStyle(defaultStyle);
      },
      click: (e) => {
        e.target._map.fitBounds(e.target.getBounds());
      },
    });
  };

  if (!districts) return null;

  return (
    <GeoJSON
      data={districts}
      style={defaultStyle}
      onEachFeature={onEachDistrict}
    />
  );
};

export default DistrictLayer;