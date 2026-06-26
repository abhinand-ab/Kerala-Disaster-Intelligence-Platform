import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

import "leaflet/dist/leaflet.css";
import "./index.css";

import App from "./App.jsx";
import { MapProvider } from "./context/MapContext";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <MapProvider>
        <App />
        <Toaster position="top-right" />
      </MapProvider>
    </QueryClientProvider>
  </StrictMode>
);