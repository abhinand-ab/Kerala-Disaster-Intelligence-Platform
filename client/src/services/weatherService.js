const BASE_URL = "https://api.open-meteo.com/v1/forecast";

export const getCurrentWeather = async (lat, lon) => {
  const response = await fetch(
    `${BASE_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch weather");
  }

  return await response.json();
};