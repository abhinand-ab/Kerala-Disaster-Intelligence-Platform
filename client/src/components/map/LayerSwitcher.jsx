import { useMap } from "../../context/MapContext";

const LayerSwitcher = () => {
  const { layers, toggleLayer } = useMap();

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 space-y-2">
      <h3 className="font-semibold mb-2">Layers</h3>

      {Object.entries(layers).map(([key, value]) => (
        <label key={key} className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value}
            onChange={() => toggleLayer(key)}
          />
          <span className="capitalize">{key}</span>
        </label>
      ))}
    </div>
  );
};

export default LayerSwitcher;