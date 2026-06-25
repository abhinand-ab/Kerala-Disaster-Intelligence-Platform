import Card from "../common/Card";
import WeatherWidget from "./widgets/WeatherWidget";

const RightPanel = () => {
  return (
    <div className="space-y-5">

      <Card>

        <h3 className="font-semibold mb-4">
          Live Alerts
        </h3>

        <p className="text-sm text-slate-500">
          No active alerts.
        </p>

      </Card>

      <Card>

        <h3 className="font-semibold mb-4">
          Weather
        </h3>

        <h1 className="text-4xl font-bold">
          29°
        </h1>

        <p className="text-slate-500">
          Kozhikode
        </p>

      </Card>

      <WeatherWidget />

      <Card>

        <h3 className="font-semibold mb-4">
          AQI
        </h3>

        <h1 className="text-3xl font-bold">
          72
        </h1>

        <p className="text-green-600">
          Moderate
        </p>

      </Card>

    </div>
  );
};

export default RightPanel;