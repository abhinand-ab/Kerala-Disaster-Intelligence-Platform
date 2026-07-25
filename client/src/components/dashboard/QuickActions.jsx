import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../common/Card";
import Button from "../common/Button";
import IncidentModal from "../../features/incidents/components/IncidentModal";
import ShelterLocatorModal from "./ShelterLocatorModal";
import { useMap } from "../../context/MapContext";

const QuickActions = () => {
  const navigate = useNavigate();
  const { openIncidentModal } = useMap();
  const [isShelterLocatorOpen, setIsShelterLocatorOpen] = useState(false);

  const handleReportIncident = () => {
    // Open reporting modal with default Kerala center coords (user can refine on map)
    openIncidentModal({ lat: 10.8505, lng: 76.2711 });
  };

  return (
    <>
      <Card>
        <h2 className="font-semibold mb-4 text-slate-900 border-b border-slate-100 pb-2">
          Quick Actions
        </h2>

        <div className="space-y-3 flex flex-col">
          <Button onClick={handleReportIncident}>
            Report Incident
          </Button>

          <Button onClick={() => setIsShelterLocatorOpen(true)}>
            Locate Shelter
          </Button>

          <Button onClick={() => navigate("/vehicles")}>
            Rescue Fleet Telematics
          </Button>
        </div>
      </Card>

      {/* Mount modals in place so they trigger correctly from any page containing QuickActions */}
      <IncidentModal />

      <ShelterLocatorModal
        isOpen={isShelterLocatorOpen}
        onClose={() => setIsShelterLocatorOpen(false)}
      />
    </>
  );
};

export default QuickActions;