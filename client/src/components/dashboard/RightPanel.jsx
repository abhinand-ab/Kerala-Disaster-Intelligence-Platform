import Card from "../common/Card";
import WeatherWidget from "./widgets/WeatherWidget";
import FleetAvailabilityWidget from "./widgets/FleetAvailabilityWidget";
import RescueTeamStatusWidget from "./widgets/RescueTeamStatusWidget";
import IoTSensorWidget from "./widgets/IoTSensorWidget";
import AIDecisionWidget from "./widgets/AIDecisionWidget";

const RightPanel = () => {
  return (
    <div className="space-y-5">

      <AIDecisionWidget />

      <IoTSensorWidget />

      <FleetAvailabilityWidget />

      <RescueTeamStatusWidget />

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