import { Routes, Route } from "react-router-dom";

import HomePage from "./pages/Home/HomePage";
import LoginPage from "./pages/Login/LoginPage";
import ProfilePage from "./pages/Profile/ProfilePage";
import RegisterPage from "./pages/Register/RegisterPage";
import ShelterPage from "./pages/Shelters/ShelterPage";
import VolunteerPage from "./pages/Volunteers/VolunteerPage";
import ResourcePage from "./pages/Resources/ResourcePage";
import WarehousePage from "./pages/Warehouses/WarehousePage";
import DeliveryPage from "./pages/Delivery/DeliveryPage";
import VehiclePage from "./pages/Vehicles/VehiclePage";
import RescueTeamsPage from "./pages/RescueTeams/RescueTeamsPage";
import SettingsPage from "./pages/Settings/SettingsPage";
import WeatherPage from "./pages/Weather/WeatherPage";
import RiskPage from "./pages/Risk/RiskPage";
import SOSPage from "./pages/Emergency/SOSPage";
import EmergencyDashboard from "./pages/Emergency/EmergencyDashboard";
import SensorsPage from "./pages/Sensors/SensorsPage";
import AIDecisionPage from "./pages/AI/AIDecisionPage";
import AnalyticsPage from "./pages/Analytics/AnalyticsPage";
import CommandCenterPage from "./pages/CommandCenter/CommandCenterPage";
import AuditDashboard from "./pages/Audit/AuditDashboard";
import MapPage from "./pages/Map/MapPage";
import IncidentsPage from "./pages/Incidents/IncidentsPage";

import ProtectedRoute from "./routes/ProtectedRoute";
import useSocket from "./hooks/useSocket";

import PublicLayout from "./pages/Public/PublicLayout";
import PublicHome from "./pages/Public/PublicHome";
import PublicAlerts from "./pages/Public/PublicAlerts";
import PublicWeather from "./pages/Public/PublicWeather";
import PublicShelters from "./pages/Public/PublicShelters";
import PublicEducation from "./pages/Public/PublicEducation";
import PublicFAQ from "./pages/Public/PublicFAQ";
import PublicMap from "./pages/Public/PublicMap";
import PublicContacts from "./pages/Public/PublicContacts";

function App() {
  useSocket();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route path="/register" element={<RegisterPage />} />

      <Route path="/sos" element={<SOSPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/map"
        element={
          <ProtectedRoute>
            <MapPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/incidents"
        element={
          <ProtectedRoute>
            <IncidentsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/shelters"
        element={
          <ProtectedRoute>
            <ShelterPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/volunteers"
        element={
          <ProtectedRoute>
            <VolunteerPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/resources"
        element={
          <ProtectedRoute>
            <ResourcePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/warehouses"
        element={
          <ProtectedRoute>
            <WarehousePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/delivery"
        element={
          <ProtectedRoute>
            <DeliveryPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/vehicles"
        element={
          <ProtectedRoute>
            <VehiclePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/rescue-teams"
        element={
          <ProtectedRoute>
            <RescueTeamsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/alerts"
        element={
          <ProtectedRoute>
            <WeatherPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/risk"
        element={
          <ProtectedRoute>
            <RiskPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/sensors"
        element={
          <ProtectedRoute>
            <SensorsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ai-decisions"
        element={
          <ProtectedRoute>
            <AIDecisionPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/emergency-dashboard"
        element={
          <ProtectedRoute>
            <EmergencyDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <AnalyticsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/command-center"
        element={
          <ProtectedRoute>
            <CommandCenterPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/audit"
        element={
          <ProtectedRoute>
            <AuditDashboard />
          </ProtectedRoute>
        }
      />

      {/* Citizen Public Portal Routes - Unauthenticated */}
      <Route path="/public" element={<PublicLayout />}>
        <Route index element={<PublicHome />} />
        <Route path="alerts" element={<PublicAlerts />} />
        <Route path="weather" element={<PublicWeather />} />
        <Route path="shelters" element={<PublicShelters />} />
        <Route path="education" element={<PublicEducation />} />
        <Route path="faq" element={<PublicFAQ />} />
        <Route path="map" element={<PublicMap />} />
        <Route path="contacts" element={<PublicContacts />} />
      </Route>
    </Routes>
  );
}

export default App;