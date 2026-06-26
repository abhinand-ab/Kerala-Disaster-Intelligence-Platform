import Card from "../common/Card";
import MapView from "../map/MapView";
import LayerSwitcher from "../map/LayerSwitcher";

const MapSection = () => {
  return (
    <Card className="h-[650px] flex flex-col">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-slate-800">
            Kerala Operations Map
          </h2>
          <p className="text-sm text-slate-500">
            Live geospatial intelligence dashboard
          </p>
        </div>

        <div className="flex items-center gap-4">
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
            Live
          </span>
          <LayerSwitcher />
        </div>
      </div>

      {/* Map */}
      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-200">
        <MapView />
      </div>
    </Card>
  );
};

export default MapSection;