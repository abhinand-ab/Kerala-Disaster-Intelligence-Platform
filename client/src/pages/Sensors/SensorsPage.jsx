import { useState, useMemo } from "react";
import MainLayout from "../../components/layout/MainLayout";
import StatCard from "../../components/common/StatCard";
import Card from "../../components/common/Card";
import {
    useSensorsList,
    useSensorAnalytics,
    useRegisterSensor,
    useDeleteSensor,
    useUpdateSensorReading
} from "../../hooks/useSensors";
import {
    Radio,
    Wifi,
    Battery,
    AlertTriangle,
    Search,
    Filter,
    CheckCircle,
    Clock,
    Compass,
    Database,
    Sliders,
    Plus,
    Trash2,
    Cpu,
    MapPin,
    Waves,
    CloudRain,
    Activity,
    Thermometer,
    Gauge
} from "lucide-react";
import { toast } from "react-hot-toast";

const SensorsPage = () => {
    // Query filters state
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [districtFilter, setDistrictFilter] = useState("");

    // Modal / Drawer simulator state
    const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
    const [simSensorId, setSimSensorId] = useState("");
    const [simWaterLevel, setSimWaterLevel] = useState("");
    const [simRainfall, setSimRainfall] = useState("");
    const [simTemp, setSimTemp] = useState("27");
    const [simHumidity, setSimHumidity] = useState("80");
    const [simBattery, setSimBattery] = useState("100");

    // Registration Modal state
    const [isRegOpen, setIsRegOpen] = useState(false);
    const [regId, setRegId] = useState("");
    const [regName, setRegName] = useState("");
    const [regType, setRegType] = useState("RiverGauge");
    const [regDistrict, setRegDistrict] = useState("Kottayam");
    const [regRiver, setRegRiver] = useState("");
    const [regLat, setRegLat] = useState("");
    const [regLon, setRegLon] = useState("");

    const filters = useMemo(() => {
        const f = {};
        if (searchTerm) f.search = searchTerm;
        if (typeFilter) f.type = typeFilter;
        if (statusFilter) f.status = statusFilter;
        if (districtFilter) f.district = districtFilter;
        return f;
    }, [searchTerm, typeFilter, statusFilter, districtFilter]);

    // Queries
    const { data: sensors = [], isLoading: isListLoading, refetch: refetchList } = useSensorsList(filters, { refetchInterval: 5000 });
    const { data: analyticsRes, isLoading: isAnalyticLoading, refetch: refetchAnalytics } = useSensorAnalytics();

    // Mutations
    const registerMutation = useRegisterSensor();
    const deleteMutation = useDeleteSensor();
    const telemetryMutation = useUpdateSensorReading();

    // Core metrics
    const widgets = analyticsRes?.widgets || {
        totalSensors: 0,
        onlineSensors: 0,
        offlineSensors: 0,
        maxWaterLevel: 0,
        maxRainfall: 0,
        avgBattery: 0,
        lowBatteryCount: 0,
    };

    const reports = analyticsRes?.reports || {
        districtStats: {},
        statusSpread: { active: 0, maintenance: 0, offline: 0 },
        uptimePercentage: 100
    };

    // Submit Simulation Reading
    const handleSimulateSubmit = async (e) => {
        e.preventDefault();
        if (!simSensorId) {
            toast.error("Please pick a target sensor to simulate telemetry data.");
            return;
        }

        try {
            const data = {
                temperature: simTemp ? Number(simTemp) : undefined,
                humidity: simHumidity ? Number(simHumidity) : undefined,
                battery: simBattery ? Number(simBattery) : undefined,
            };

            const selectedSensor = sensors.find(s => s.sensorId === simSensorId);
            if (selectedSensor?.sensorType === "RiverGauge" || selectedSensor?.sensorType === "WaterLevelGauge") {
                data.waterLevel = simWaterLevel ? Number(simWaterLevel) : 0;
            }
            if (selectedSensor?.sensorType === "RainfallSensor" || selectedSensor?.sensorType === "WeatherStation") {
                data.rainfall = simRainfall ? Number(simRainfall) : 0;
            }

            await telemetryMutation.mutateAsync({ sensorId: simSensorId, data });
            toast.success(`IoT Telemetry sent successfully for ${simSensorId}!`);
            setIsSimulatorOpen(false);
            refetchAnalytics();
            refetchList();
        } catch (err) {
            toast.error(err || "Failed to trigger live telemetry update.");
        }
    };

    // Create Sensor Definition
    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        if (!regId || !regName || !regLat || !regLon) {
            toast.error("All coordinates and metadata fields are required for node registration.");
            return;
        }

        try {
            await registerMutation.mutateAsync({
                sensorId: regId,
                sensorName: regName,
                sensorType: regType,
                district: regDistrict,
                river: regRiver,
                latitude: Number(regLat),
                longitude: Number(regLon)
            });
            setIsRegOpen(false);
            refetchAnalytics();
            refetchList();
        } catch (err) {
            // toast trigger handled in hook
        }
    };

    const handleDelete = async (sensorId) => {
        if (window.confirm("Are you sure you want to decommission and purge this sensor node and all its historical values?")) {
            try {
                await deleteMutation.mutateAsync(sensorId);
                refetchAnalytics();
                refetchList();
            } catch (err) {
                // Handled in hook
            }
        }
    };

    return (
        <MainLayout>
            <div className="space-y-6 bg-slate-50 min-h-screen p-1">
                {/* Dynamic Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                            <Cpu className="h-8 w-8 text-blue-650 animate-spin-slow" />
                            IoT Telemetry & River Gauge Controls
                        </h1>
                        <p className="text-slate-500 mt-1">
                            Command station for water gauges, weather arrays, rainfall nodes, and real-time warnings threshold analytics.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsSimulatorOpen(true)}
                            className="bg-orange-500 hover:bg-orange-650 text-white text-xs font-black px-4.5 py-2.5 rounded-xl shadow-lg shadow-orange-500/15 flex items-center gap-2 transition cursor-pointer"
                        >
                            <Sliders className="w-4 h-4" /> Simulate Telemetry
                        </button>
                        <button
                            onClick={() => setIsRegOpen(true)}
                            className="bg-blue-650 hover:bg-blue-750 text-white text-xs font-black px-4.5 py-2.5 rounded-xl shadow-lg shadow-blue-500/15 flex items-center gap-2 transition cursor-pointer"
                        >
                            <Plus className="w-4 h-4" /> Register Sensor
                        </button>
                    </div>
                </div>

                {/* Dashboard Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    <StatCard
                        title="Total Cores Mapped"
                        value={`${widgets.totalSensors}`}
                        subtitle="Device inventory count"
                        color="bg-white border-slate-201 text-slate-800"
                        icon={<Cpu className="text-slate-455 w-5 h-5" />}
                    />
                    <StatCard
                        title="Uptime Performance"
                        value={`${reports.uptimePercentage}%`}
                        subtitle={`${widgets.onlineSensors} Online / ${widgets.offlineSensors} Offline`}
                        color="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold"
                        icon={<CheckCircle className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Max River Depth Read"
                        value={`${widgets.maxWaterLevel.toFixed(2)} m`}
                        subtitle="Active river gauge peak"
                        color="bg-blue-55 text-blue-700 border-blue-105 font-bold"
                        icon={<Waves className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Extreme Rainfall Read"
                        value={`${widgets.maxRainfall} mm/h`}
                        subtitle="Active cloud sensor peak"
                        color="bg-cyan-50 text-cyan-700 border-cyan-105 font-bold"
                        icon={<CloudRain className="w-5 h-5" />}
                    />
                </div>

                {/* Grid layout for analytics and main table */}
                <div className="grid grid-cols-12 gap-6">

                    {/* Main Table (Col 8) */}
                    <div className="col-span-12 xl:col-span-8 space-y-6">
                        <Card className="p-6 bg-white border border-slate-205">
                            {/* Search Filters Row */}
                            <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
                                <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
                                    <div className="relative flex-1 md:flex-initial">
                                        <Search className="absolute left-3 top-2.5 text-slate-430 w-4 h-4" />
                                        <input
                                            type="text"
                                            placeholder="Search telemetry ID/name/river..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-9 pr-4 py-2 border border-slate-201 rounded-xl text-xs focus:outline-none focus:border-blue-500 bg-white w-full md:w-56"
                                        />
                                    </div>
                                    <select
                                        value={typeFilter}
                                        onChange={(e) => setTypeFilter(e.target.value)}
                                        className="border border-slate-201 rounded-xl px-3 py-2 text-xs focus:outline-none bg-white font-medium text-slate-650 cursor-pointer"
                                    >
                                        <option value="">All Types</option>
                                        <option value="RiverGauge">River Gauges</option>
                                        <option value="RainfallSensor">Rainfall Gauges</option>
                                        <option value="WeatherStation">Weather Hubs</option>
                                        <option value="WaterLevelGauge">Water Depth Gauges</option>
                                    </select>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="border border-slate-201 rounded-xl px-3 py-2 text-xs focus:outline-none bg-white font-medium text-slate-650 cursor-pointer"
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="Active">Active</option>
                                        <option value="Maintenance">Maintenance</option>
                                        <option value="Offline">Offline</option>
                                    </select>
                                </div>
                            </div>

                            {/* Data Table */}
                            {isListLoading ? (
                                <div className="flex justify-center items-center py-24">
                                    <span className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-650"></span>
                                </div>
                            ) : sensors.length === 0 ? (
                                <div className="text-center py-20 text-slate-400 text-xs italic">
                                    No sensors found matching search criteria.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-150 text-slate-400 font-bold uppercase">
                                                <th className="pb-3 text-left">Sensor node</th>
                                                <th className="pb-3">Type</th>
                                                <th className="pb-3">Monitored District</th>
                                                <th className="pb-3">Last telemetry</th>
                                                <th className="pb-3">Battery</th>
                                                <th className="pb-3">Status</th>
                                                <th className="pb-3 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sensors.map((s) => (
                                                <tr key={s._id} className="border-b border-slate-100 hover:bg-slate-50/70 transition">
                                                    <td className="py-4">
                                                        <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                                                            <Radio className="w-3.5 h-3.5 text-blue-500 scale-90" /> {s.sensorName}
                                                        </div>
                                                        <div className="text-[10px] text-slate-450 mt-0.5 font-semibold">
                                                            ID: {s.sensorId} {s.river ? `| River: ${s.river}` : ""}
                                                        </div>
                                                    </td>
                                                    <td className="py-4">
                                                        <span className="bg-slate-100 text-slate-650 font-bold px-2.5 py-0.5 rounded text-[10px]">
                                                            {s.sensorType.replace(/([A-Z])/g, " $1")}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 font-semibold text-slate-600 flex items-center gap-1 mt-4">
                                                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" /> {s.district}
                                                    </td>
                                                    <td className="py-4 font-black text-slate-800 space-y-0.5">
                                                        {s.lastReading?.waterLevel !== null && s.lastReading?.waterLevel !== undefined && (
                                                            <div className="text-[10px] text-blue-650 flex items-center gap-1">
                                                                <Waves className="w-3 h-3 text-blue-500 scale-90" /> Level: {s.lastReading.waterLevel}m
                                                            </div>
                                                        )}
                                                        {s.lastReading?.rainfall !== null && s.lastReading?.rainfall !== undefined && (
                                                            <div className="text-[10px] text-cyan-650 flex items-center gap-1">
                                                                <CloudRain className="w-3 h-3 text-cyan-500" /> Rain: {s.lastReading.rainfall}mm/h
                                                            </div>
                                                        )}
                                                        {!s.lastReading?.waterLevel && !s.lastReading?.rainfall && (
                                                            <span className="text-[10px] text-slate-400 italic font-medium">No signals ready</span>
                                                        )}
                                                    </td>
                                                    <td className="py-4">
                                                        <div className="flex items-center gap-1">
                                                            <Battery className={`w-3.5 h-3.5 ${s.batteryLevel < 20 ? 'text-rose-500 animate-pulse' : 'text-slate-451'}`} />
                                                            <span className={`font-semibold ${s.batteryLevel < 20 ? 'font-bold text-rose-650' : 'text-slate-655'}`}>
                                                                {s.batteryLevel}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4">
                                                        <span
                                                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${s.status === "Active"
                                                                    ? "bg-emerald-50 text-emerald-650"
                                                                    : s.status === "Maintenance"
                                                                        ? "bg-yellow-50 text-yellow-650"
                                                                        : "bg-red-50 text-red-650"
                                                                }`}
                                                        >
                                                            {s.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 text-right">
                                                        <button
                                                            onClick={() => handleDelete(s.sensorId)}
                                                            className="text-slate-400 hover:text-red-600 transition p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer"
                                                            title="Delete Sensor"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Analytics Reporting Widgets side (Col 4) */}
                    <div className="col-span-12 xl:col-span-4 space-y-6">
                        {/* Status Spread Chart */}
                        <Card className="p-6 bg-white border border-slate-205">
                            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-5 flex items-center gap-1.5">
                                <Activity className="text-blue-500 h-4.5 w-4.5" /> Environmental Sensor Spread
                            </h3>
                            <div className="space-y-4">
                                {/* Active */}
                                <div className="text-xs space-y-1">
                                    <div className="flex justify-between font-bold text-slate-650">
                                        <span>Active Telemetrics</span>
                                        <span>{reports.statusSpread?.active || 0} nodes</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                        <div
                                            className="bg-emerald-500 h-full rounded-full transition-all"
                                            style={{ width: `${Math.round(((reports.statusSpread?.active || 0) / (widgets.totalSensors || 1)) * 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                                {/* Maintenance */}
                                <div className="text-xs space-y-1">
                                    <div className="flex justify-between font-bold text-slate-650">
                                        <span>Maintenance Checks</span>
                                        <span>{reports.statusSpread?.maintenance || 0} nodes</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                        <div
                                            className="bg-amber-500 h-full rounded-full transition-all"
                                            style={{ width: `${Math.round(((reports.statusSpread?.maintenance || 0) / (widgets.totalSensors || 1)) * 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                                {/* Offline */}
                                <div className="text-xs space-y-1">
                                    <div className="flex justify-between font-bold text-slate-650">
                                        <span>Offline warning</span>
                                        <span>{reports.statusSpread?.offline || 0} nodes</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                        <div
                                            className="bg-rose-500 h-full rounded-full transition-all text-white border-rose-500"
                                            style={{ width: `${Math.round(((reports.statusSpread?.offline || 0) / (widgets.totalSensors || 1)) * 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* District Stats */}
                        <Card className="p-6 bg-slate-900 border border-slate-800 text-white relative">
                            <h3 className="font-extrabold text-sm uppercase tracking-wider mb-5 flex items-center gap-1.5 text-blue-400">
                                <Database className="w-4.5 h-4.5 text-blue-400" /> District Node Densities
                            </h3>
                            <div className="space-y-3.5 max-h-[290px] overflow-y-auto pr-1">
                                {Object.entries(reports.districtStats).map(([dist, count]) => {
                                    const max = Math.max(...Object.values(reports.districtStats), 1);
                                    const pct = Math.round((count / max) * 100);
                                    return (
                                        <div key={dist} className="text-xs space-y-1">
                                            <div className="flex justify-between font-bold text-slate-350">
                                                <span>{dist}</span>
                                                <span>{count} nodes</span>
                                            </div>
                                            <div className="w-full bg-slate-850 h-1.5 rounded-full overflow-hidden">
                                                <div className="bg-blue-450 h-full rounded-full" style={{ width: `${pct}%` }}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {Object.keys(reports.districtStats).length === 0 && (
                                    <p className="text-xs text-slate-500 italic">No node allocations indexed.</p>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>

                {/* REGISTRATION MODAL FORM */}
                {isRegOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white rounded-2xl border border-slate-202 p-6 shadow-2xl w-full max-w-md space-y-4">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                                <h3 className="font-extrabold text-base text-slate-905 flex items-center gap-1">
                                    <Cpu className="text-blue-650 w-5 h-5" /> Node Registration Portal
                                </h3>
                                <button
                                    onClick={() => setIsRegOpen(false)}
                                    className="text-slate-400 hover:text-slate-600 transition text-sm font-bold cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>

                            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-slate-505 font-bold mb-1">Sensor ID</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. SEN-007"
                                            value={regId}
                                            onChange={(e) => setRegId(e.target.value)}
                                            className="w-full border border-slate-205 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-505 font-bold mb-1">Sensor Name</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Meenachil Flow Gauge"
                                            value={regName}
                                            onChange={(e) => setRegName(e.target.value)}
                                            className="w-full border border-slate-205 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 bg-white"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-slate-505 font-bold mb-1">Sensor Type</label>
                                        <select
                                            value={regType}
                                            onChange={(e) => setRegType(e.target.value)}
                                            className="w-full border border-slate-205 rounded-xl px-3 py-2 bg-white cursor-pointer"
                                        >
                                            <option value="RiverGauge">River Gauge</option>
                                            <option value="RainfallSensor">Rainfall Sensor</option>
                                            <option value="WeatherStation">Weather Station</option>
                                            <option value="WaterLevelGauge">Water Level Gauge</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-slate-505 font-bold mb-1">Monitored District</label>
                                        <select
                                            value={regDistrict}
                                            onChange={(e) => setRegDistrict(e.target.value)}
                                            className="w-full border border-slate-205 rounded-xl px-3 py-2 bg-white cursor-pointer"
                                        >
                                            {[
                                                "Thiruvananthapuram", "Kollam", "Pathanamthitta", "Alappuzha", "Kottayam",
                                                "Idukki", "Ernakulam", "Thrissur", "Palakkad", "Malappuram", "Kozhikode",
                                                "Wayanad", "Kannur", "Kasaragod"
                                            ].map(d => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-slate-505 font-bold mb-1">Monitored River (Optional)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Periyar"
                                        value={regRiver}
                                        onChange={(e) => setRegRiver(e.target.value)}
                                        className="w-full border border-slate-205 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 bg-white"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-slate-505 font-bold mb-1">Latitude</label>
                                        <input
                                            type="number"
                                            step="any"
                                            required
                                            placeholder="Latitude (e.g. 10.85)"
                                            value={regLat}
                                            onChange={(e) => setRegLat(e.target.value)}
                                            className="w-full border border-slate-205 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-505 font-bold mb-1">Longitude</label>
                                        <input
                                            type="number"
                                            step="any"
                                            required
                                            placeholder="Longitude (e.g. 76.27)"
                                            value={regLon}
                                            onChange={(e) => setRegLon(e.target.value)}
                                            className="w-full border border-slate-205 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 bg-white"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={registerMutation.isPending}
                                    className="w-full bg-blue-650 hover:bg-blue-750 text-white font-black py-2.5 rounded-xl transition cursor-pointer"
                                >
                                    {registerMutation.isPending ? "Adding Node..." : "Provision Node"}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* TELEMETRY SIMULATOR DRAWER MODAL */}
                {isSimulatorOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white rounded-2xl border border-slate-202 p-6 shadow-2xl w-full max-w-md space-y-4">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                                <h3 className="font-extrabold text-base text-slate-905 flex items-center gap-1.5">
                                    <Sliders className="text-orange-500 w-5 h-5" /> Telemetry Simulator Control
                                </h3>
                                <button
                                    onClick={() => setIsSimulatorOpen(false)}
                                    className="text-slate-400 hover:text-slate-600 transition text-sm font-bold cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>

                            <form onSubmit={handleSimulateSubmit} className="space-y-3.5 text-xs">
                                <div>
                                    <label className="block text-slate-505 font-bold mb-1">Select Target Sensor</label>
                                    <select
                                        value={simSensorId}
                                        onChange={(e) => setSimSensorId(e.target.value)}
                                        className="w-full border border-slate-205 rounded-xl px-3 py-2 bg-white cursor-pointer"
                                    >
                                        <option value="">-- Choose registered device --</option>
                                        {sensors.map(s => (
                                            <option key={s._id} value={s.sensorId}>
                                                {s.sensorName} ({s.sensorId} | {s.sensorType})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Show values conditionally depending on selected sensor type */}
                                {(() => {
                                    const selectedSensObj = sensors.find(s => s.sensorId === simSensorId);
                                    const isWaterType = selectedSensObj?.sensorType === "RiverGauge" || selectedSensObj?.sensorType === "WaterLevelGauge";
                                    const isRainType = selectedSensObj?.sensorType === "RainfallSensor" || selectedSensObj?.sensorType === "WeatherStation";

                                    return (
                                        <>
                                            {isWaterType && (
                                                <div>
                                                    <label className="block text-slate-505 font-bold mb-1-5">Water Level Reading (meters)</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        required
                                                        placeholder="e.g. 5.45 (Warning threshold ~ 4.5m)"
                                                        value={simWaterLevel}
                                                        onChange={(e) => setSimWaterLevel(e.target.value)}
                                                        className="w-full border border-slate-205 rounded-xl px-3 py-2 focus:outline-none focus:border-orange-500 bg-white"
                                                    />
                                                </div>
                                            )}

                                            {isRainType && (
                                                <div>
                                                    <label className="block text-slate-505 font-bold mb-1">Rainfall Level (mm/hr)</label>
                                                    <input
                                                        type="number"
                                                        step="1"
                                                        required
                                                        placeholder="e.g. 55 (Danger threshold > 50 mm/hr)"
                                                        value={simRainfall}
                                                        onChange={(e) => setSimRainfall(e.target.value)}
                                                        className="w-full border border-slate-205 rounded-xl px-3 py-2 focus:outline-none focus:border-orange-500 bg-white"
                                                    />
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-slate-505 font-bold mb-1">Ambient Temperature (°C)</label>
                                        <input
                                            type="number"
                                            placeholder="27"
                                            value={simTemp}
                                            onChange={(e) => setSimTemp(e.target.value)}
                                            className="w-full border border-slate-205 rounded-xl px-3 py-2 bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-505 font-bold mb-1">Humidity (%)</label>
                                        <input
                                            type="number"
                                            placeholder="80"
                                            value={simHumidity}
                                            onChange={(e) => setSimHumidity(e.target.value)}
                                            className="w-full border border-slate-205 rounded-xl px-3 py-2 bg-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-slate-505 font-bold mb-1">Mock Battery Charge (%)</label>
                                    <input
                                        type="number"
                                        max="100"
                                        placeholder="100"
                                        value={simBattery}
                                        onChange={(e) => setSimBattery(e.target.value)}
                                        className="w-full border border-slate-205 rounded-xl px-3 py-2 bg-white"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={telemetryMutation.isPending}
                                    className="w-full bg-orange-500 hover:bg-orange-650 text-white font-black py-2.5 rounded-xl transition cursor-pointer"
                                >
                                    {telemetryMutation.isPending ? "Transmitting..." : "Send IoT Packet"}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
};

export default SensorsPage;
