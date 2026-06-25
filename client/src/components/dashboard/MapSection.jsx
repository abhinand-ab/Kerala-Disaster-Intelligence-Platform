import Card from "../common/Card";
import MapView from "../map/MapView";
import LayerSwitcher from "../map/LayerSwitcher";

const MapSection = () => {
  return (
    <Card className="h-[650px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">
            Kerala Operations Map
          </h2>
          <p className="text-sm text-slate-500">
            Live geospatial intelligence dashboard
          </p>
        </div>

        <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
          Live
        </span>

         <LayerSwitcher />

      </div>

      {/* Map */}
      <div className="flex-1 overflow-hidden rounded-xl border border-slate-200">
        <MapView />
      </div>
    </Card>
  );
};

export default MapSection;