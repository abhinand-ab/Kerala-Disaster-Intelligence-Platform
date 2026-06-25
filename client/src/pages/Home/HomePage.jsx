import MainLayout from "../../components/layout/MainLayout";

const HomePage = () => {
  return (
    <MainLayout>
      <h1 className="text-3xl font-bold mb-6">
        Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          Active Incidents
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          Flood Alerts
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          Drivers Online
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          AQI Status
        </div>
      </div>
    </MainLayout>
  );
};

export default HomePage;