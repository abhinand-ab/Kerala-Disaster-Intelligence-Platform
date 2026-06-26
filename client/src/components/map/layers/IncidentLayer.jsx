import { CircleMarker, Popup } from "react-leaflet";
import useIncidents from "../../../features/incidents/hooks/useIncidents";

const getColor = (severity) => {
  switch (severity?.toLowerCase()) {
    case "critical":
      return "#dc2626";

    case "high":
      return "#ea580c";

    case "medium":
      return "#ca8a04";

    default:
      return "#16a34a";
  }
};

const IncidentLayer = () => {
  const { incidents, loading } = useIncidents();

  if (loading) return null;

  return (
    <>
      {incidents.map((incident) => (
        <CircleMarker
          key={incident._id}
          center={[
            incident.location.latitude,
            incident.location.longitude,
          ]}
          radius={8}
          pathOptions={{
            color: getColor(incident.severity),
            fillColor: getColor(incident.severity),
            fillOpacity: 0.8,
          }}
        >
          <Popup>
            <div className="space-y-2 min-w-[220px]">
              <h3 className="font-bold text-lg">
                {incident.title}
              </h3>

              <p>{incident.description}</p>

              <hr />

              <p>
                <strong>Category:</strong>{" "}
                {incident.category}
              </p>

              <p>
                <strong>Severity:</strong>{" "}
                {incident.severity}
              </p>

              <p>
                <strong>District:</strong>{" "}
                {incident.location.district}
              </p>

              <p>
                <strong>Address:</strong>{" "}
                {incident.location.address}
              </p>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </>
  );
};

export default IncidentLayer;