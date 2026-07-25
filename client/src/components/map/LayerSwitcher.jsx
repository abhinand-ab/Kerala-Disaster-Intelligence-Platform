import { useMap } from "../../context/MapContext";
import { useTranslation } from "react-i18next";

const LayerSwitcher = () => {
  const { layers, toggleLayer } = useMap();
  const { t } = useTranslation();

  return (
    <div className="bg-white border border-slate-205 rounded-xl shadow-lg p-4 space-y-2 text-slate-800">
      <h3 className="font-semibold mb-2 text-slate-900">{t("map.legend", "Layers")}</h3>

      {Object.entries(layers).map(([key, value]) => (
        <label key={key} className="flex items-center gap-2 cursor-pointer hover:text-slate-950">
          <input
            type="checkbox"
            checked={value}
            onChange={() => toggleLayer(key)}
            className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
          <span className="capitalize text-xs font-medium">
            {t(`map.layerNames.${key}`, key.replace(/([A-Z])/g, " $1").trim())}
          </span>
        </label>
      ))}
    </div>
  );
};

export default LayerSwitcher;