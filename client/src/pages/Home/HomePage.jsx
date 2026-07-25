import MainLayout from "../../components/layout/MainLayout";
import Header from "../../components/layout/Header";
import StatCard from "../../components/common/StatCard";
import MapSection from "../../components/dashboard/MapSection";
import RightPanel from "../../components/dashboard/RightPanel";
import RecentIncidents from "../../components/dashboard/RecentIncidents";
import QuickActions from "../../components/dashboard/QuickActions";
import useDashboard from "../../hooks/useDashboard";

import {
  TriangleAlert,
  CloudRain,
  Truck,
  Wind,
} from "lucide-react";

const HomePage = () => {
  const { data, isLoading, error } = useDashboard();

  return (
    <MainLayout>
      <Header
        title="Dashboard"
        subtitle="Real-time overview of Kerala disaster and delivery operations"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

        <StatCard
          title="Active Incidents"
          value={isLoading || error ? "--" : data?.activeIncidents ?? 0}
          subtitle="+8 today"
          color="bg-red-100"
          icon={<TriangleAlert className="text-red-600" />}
        />

        <StatCard
          title="Flood Alerts"
          value={isLoading || error ? "--" : data?.floodIncidents ?? 0}
          subtitle="2 Critical"
          color="bg-blue-100"
          icon={<CloudRain className="text-blue-600" />}
        />

        <StatCard
          title="Drivers Online"
          value="58"
          subtitle="Live Tracking"
          color="bg-emerald-100"
          icon={<Truck className="text-emerald-600" />}
        />

        <StatCard
          title="Average AQI"
          value="72"
          subtitle="Moderate"
          color="bg-amber-100"
          icon={<Wind className="text-amber-600" />}
        />

      </div>
      <div className="grid grid-cols-12 gap-6 mt-8">

        <div className="col-span-12 lg:col-span-8">

          <MapSection />

        </div>

        <div className="col-span-12 lg:col-span-4">

          <RightPanel />

        </div>

      </div>

      <div className="grid grid-cols-12 gap-6 mt-6">

        <div className="col-span-12 lg:col-span-8">

          <RecentIncidents />

        </div>

        <div className="col-span-12 lg:col-span-4">

          <QuickActions />

        </div>

      </div>
    </MainLayout>
  );
};

export default HomePage;