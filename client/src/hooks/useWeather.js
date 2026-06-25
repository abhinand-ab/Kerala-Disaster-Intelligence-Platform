import { useEffect, useState } from "react";
import { getCurrentWeather } from "../services/weatherService";

export const useWeather = (lat, lon) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWeather = async () => {
      try {
        const data = await getCurrentWeather(lat, lon);
        setWeather(data.current);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadWeather();
  }, [lat, lon]);

  return { weather, loading };
};