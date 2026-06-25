import Card from "../../common/Card";
import { useWeather } from "../../../hooks/useWeather";

const WeatherWidget = () => {
  // Kozhikode coordinates for now
  const { weather, loading } = useWeather(11.2588, 75.7804);

  if (loading) {
    return (
      <Card>
        <p>Loading weather...</p>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="font-semibold mb-4">
        Live Weather
      </h3>

      <h1 className="text-5xl font-bold">
        {weather.temperature_2m}°
      </h1>

      <p className="text-slate-500 mt-2">
        Humidity: {weather.relative_humidity_2m}%
      </p>

      <p className="text-slate-500">
        Wind: {weather.wind_speed_10m} km/h
      </p>
    </Card>
  );
};

export default WeatherWidget;