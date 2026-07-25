import { useState } from "react";
import Card from "../common/Card";
import StatusBadge from "../common/StatusBadge";
import IncidentDetailsDrawer from "./IncidentDetailsDrawer";
import useIncidents from "../../features/incidents/hooks/useIncidents";

const RecentIncidents = () => {
  const [selectedIncident, setSelectedIncident] = useState(null);
  const { incidents, loading } = useIncidents();

  const recentIncidents = [...incidents].sort(
    (leftIncident, rightIncident) =>
      new Date(rightIncident.createdAt || 0) - new Date(leftIncident.createdAt || 0)
  );

  return (
    <>
      <Card>
        <h2 className="font-semibold mb-4 text-slate-900">
          Recent Incidents
        </h2>


        {loading ? (
          <p className="text-slate-500">
            Loading incidents...
          </p>
        ) : recentIncidents.length === 0 ? (
          <p className="text-slate-500">
            No incidents reported.
          </p>
        ) : (
          <div className="space-y-3">
            {recentIncidents.map((incident) => (
              <div
                key={incident._id}
                role="button"
                tabIndex={0}
                className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-transparent p-3 transition hover:border-slate-200 hover:bg-slate-50"
                onClick={() => setSelectedIncident(incident)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedIncident(incident);
                  }
                }}
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {incident.title}
                  </p>

                  <p className="text-sm text-slate-500">
                    District: {incident.location?.district || incident.district || "Unknown"}
                  </p>

                  <p className="text-sm text-slate-500">
                    Severity: {incident.severity || "Unknown"}
                  </p>
                </div>

                <StatusBadge status={incident.status} />
              </div>
            ))}
          </div>
        )}

      </Card>

      <IncidentDetailsDrawer
        isOpen={Boolean(selectedIncident)}
        incident={selectedIncident}
        onClose={() => setSelectedIncident(null)}
      />
    </>
  );
};

export default RecentIncidents;