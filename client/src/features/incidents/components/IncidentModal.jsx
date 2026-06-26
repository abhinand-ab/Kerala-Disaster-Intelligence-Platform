import IncidentForm from "./IncidentForm";
import { useMap } from "../../../context/MapContext";

const IncidentModal = () => {
  const {
    clickedLocation,
    isIncidentModalOpen,
    closeIncidentModal,
  } = useMap();

  if (!isIncidentModalOpen || !clickedLocation) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              Report Incident
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Report a disaster or emergency from the selected location.
            </p>
          </div>

          <button
            onClick={closeIncidentModal}
            className="text-2xl text-slate-500 hover:text-red-500"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">

          <IncidentForm
            latitude={clickedLocation.lat}
            longitude={clickedLocation.lng}
            onClose={closeIncidentModal}
            onSuccess={() => {
              closeIncidentModal();
            }}
          />

        </div>
      </div>
    </div>
  );
};

export default IncidentModal;