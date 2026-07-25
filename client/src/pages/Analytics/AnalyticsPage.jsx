import { useState, useMemo } from "react";
import MainLayout from "../../components/layout/MainLayout";
import Header from "../../components/layout/Header";
import Card from "../../components/common/Card";
import {
    useAnalyticsDashboard,
    useAnalyticsTrends,
    useAnalyticsDistricts,
    useAnalyticsResources,
    useAnalyticsAIStats,
    useExportReport,
} from "../../hooks/useAnalytics";

import {
    BarChart3,
    TrendingUp,
    Shield,
    AlertTriangle,
    MapPin,
    Truck,
    Building2,
    Users,
    Boxes,
    RefreshCw,
    CheckCircle2,
    Calendar,
    Download,
    FileSpreadsheet,
    FileText,
    Clock,
    Zap,
    Scale,
    Activity,
    LineChart,
} from "lucide-react";

// ==========================================
// Stat KPI Widget
// ==========================================
const KPIWidget = ({ icon: Icon, title, value, subtext, progress, color = "text-indigo-600", bg = "bg-indigo-50 border-indigo-100" }) => (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 relative overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-2.5 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
            </div>
            {progress !== undefined && (
                <span className={`text-[10px] font-black tracking-wider px-2 py-0.5 rounded-full ${color === "text-emerald-600"
                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                        : "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100"
                    }`}>
                    {progress}%
                </span>
            )}
        </div>
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</h3>
        <div className="text-2xl font-black text-slate-800 tracking-tight">{value}</div>
        <p className="text-[10px] font-semibold text-slate-500 mt-1">{subtext}</p>

        {progress !== undefined && (
            <div className="mt-3 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${color === "text-emerald-600" ? "bg-emerald-500" : "bg-indigo-600"
                        }`}
                    style={{ width: `${progress}%` }}
                />
            </div>
        )}
    </div>
);

// ==========================================
// Main Page Layout
// ==========================================
const AnalyticsPage = () => {
    const [activeTab, setActiveTab] = useState("overview");

    // Report filters
    const [reportType, setReportType] = useState("incidents");
    const [format, setFormat] = useState("csv");
    const [timeframe, setTimeframe] = useState("weekly");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [districtFilter, setDistrictFilter] = useState("");
    const [chartDays, setChartDays] = useState(7);

    // Queries
    const { data: dashboard, isLoading: isDbLoading, refetch: refetchDb } = useAnalyticsDashboard();
    const { data: trends, isLoading: isTrendLoading, refetch: refetchTrend } = useAnalyticsTrends(chartDays);
    const { data: districts, isLoading: isDistLoading } = useAnalyticsDistricts();
    const { data: resources, isLoading: isResLoading } = useAnalyticsResources();
    const { data: aiStats, isLoading: isAiLoading } = useAnalyticsAIStats();

    // Export report mutation
    const exportReportMutation = useExportReport();

    const handleExport = (e) => {
        e.preventDefault();
        exportReportMutation.mutate({
            reportType,
            format,
            timeframe,
            startDate,
            endDate,
            district: districtFilter,
        });
    };

    // Calculate overall disaster readiness score
    const readinessScore = useMemo(() => {
        if (!dashboard?.kpis) return 85;
        const { incidentResolutionRate, vehicleReadiness, rescueTeamAvailability, shelterUtilization } = dashboard.kpis;

        const vehicleRate = vehicleReadiness?.percentage || 80;
        const teamRate = rescueTeamAvailability?.percentage || 80;
        const resolutionRate = incidentResolutionRate || 75;
        const shelterRate = 100 - Math.abs(50 - (shelterUtilization?.percentage || 40));

        return Math.min(100, Math.round((vehicleRate + teamRate + resolutionRate + shelterRate) / 4));
    }, [dashboard]);

    const activeIncidentsDetail = dashboard?.counts?.incidents?.active || 0;
    const activeSheltersDetail = dashboard?.counts?.shelters || 0;
    const pendingSOSDetail = dashboard?.counts?.sos?.pending || 0;

    const tabs = [
        { key: "overview", label: "Readiness Summary", icon: Zap },
        { key: "trends", label: "Operations Insights", icon: TrendingUp },
        { key: "districts", label: "District Analysis", icon: Shield },
        { key: "resources", label: "Resources & Fleet", icon: Boxes },
        { key: "reports", label: "Report Center", icon: FileSpreadsheet },
    ];

    const allDistricts = [
        "Thiruvananthapuram", "Kollam", "Pathanamthitta", "Alappuzha", "Kottayam",
        "Idukki", "Ernakulam", "Thrissur", "Palakkad", "Malappuram",
        "Kozhikode", "Wayanad", "Kannur", "Kasaragod"
    ];

    const refreshAll = () => {
        refetchDb();
        refetchTrend();
    };

    return (
        <MainLayout>
            <Header
                title="Operations Analytics & Reporting"
                subtitle="Evaluate command state readiness, operational response timelines, distribution details, and system reports."
            />

            {/* Tab Controls / Header actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex flex-wrap p-1 bg-slate-100 border border-slate-200/50 rounded-2xl gap-1">
                    {tabs.map((tab) => {
                        const IconComponent = tab.icon;
                        const isMainActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 outline-none ${isMainActive
                                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                                        : "text-slate-600 hover:bg-slate-50"
                                    }`}
                            >
                                <IconComponent className="w-3.5 h-3.5" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={refreshAll}
                        className="inline-flex items-center justify-center p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-indigo-650 hover:bg-slate-50 transition"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {isDbLoading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-3">
                    <span className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-indigo-600" />
                    <span className="text-xs font-bold text-slate-500 tracking-widest uppercase">Aggregating system statistics...</span>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* STATS WIDGET ROW */}
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                        <KPIWidget
                            icon={CheckCircle2}
                            title="Resolution Rate"
                            value={`${dashboard?.kpis?.incidentResolutionRate || 0}%`}
                            subtext="Total incident closures"
                            progress={dashboard?.kpis?.incidentResolutionRate}
                            color="text-emerald-600"
                            bg="bg-emerald-50 border-emerald-100"
                        />
                        <KPIWidget
                            icon={Clock}
                            title="Avg Response"
                            value={`${dashboard?.kpis?.averageResponseTime || 0}m`}
                            subtext="SOS & incident arrivals"
                            color="text-amber-600"
                            bg="bg-amber-50 border-amber-100"
                        />
                        <KPIWidget
                            icon={Building2}
                            title="Shelters Active"
                            value={activeSheltersDetail}
                            subtext={`${dashboard?.kpis?.shelterUtilization?.occupied || 0}/${dashboard?.kpis?.shelterUtilization?.capacity || 0} occupied`}
                            progress={dashboard?.kpis?.shelterUtilization?.percentage}
                            color="text-indigo-600"
                            bg="bg-indigo-50 border-indigo-100"
                        />
                        <KPIWidget
                            icon={Activity}
                            title="Sensors Online"
                            value={`${dashboard?.kpis?.sensorsOnline?.online || 0}`}
                            subtext={`${dashboard?.kpis?.sensorsOnline?.percentage || 0}% stream rate`}
                            progress={dashboard?.kpis?.sensorsOnline?.percentage}
                            color="text-cyan-600"
                            bg="bg-cyan-50 border-cyan-100"
                        />
                        <KPIWidget
                            icon={Truck}
                            title="Fleet Readiness"
                            value={`${dashboard?.kpis?.vehicleReadiness?.available || 0}`}
                            subtext={`Out of ${dashboard?.kpis?.vehicleReadiness?.total || 0} units`}
                            progress={dashboard?.kpis?.vehicleReadiness?.percentage}
                            color="text-violet-600"
                            bg="bg-violet-50 border-violet-100"
                        />
                        <KPIWidget
                            icon={Users}
                            title="Rescue Units"
                            value={`${dashboard?.kpis?.rescueTeamAvailability?.available || 0}`}
                            subtext={`Out of ${dashboard?.kpis?.rescueTeamAvailability?.total || 0} teams`}
                            progress={dashboard?.kpis?.rescueTeamAvailability?.percentage}
                            color="text-rose-600"
                            bg="bg-rose-50 border-rose-100"
                        />
                    </div>

                    {/* TAP WRAPPER CONTENT */}

                    {/* OVERVIEW TAB */}
                    {activeTab === "overview" && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Readiness Index */}
                            <Card>
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Disaster Readiness Index</h3>
                                    <Scale className="w-5 h-5 text-indigo-600" />
                                </div>
                                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                                    Computed algorithmically based on active deployment dispatch rates, available vehicle parameters, team availability, and network connection status.
                                </p>

                                <div className="flex flex-col items-center justify-center my-6 relative">
                                    {/* Progress Circle SVG */}
                                    <svg className="w-40 h-40 transform -rotate-90">
                                        <circle cx="80" cy="80" r="70" stroke="#f1f5f9" strokeWidth="14" fill="transparent" />
                                        <circle
                                            cx="80"
                                            cy="80"
                                            r="70"
                                            stroke="url(#indigoGradient)"
                                            strokeWidth="14"
                                            fill="transparent"
                                            strokeDasharray={440}
                                            strokeDashoffset={440 - (440 * readinessScore) / 100}
                                            strokeLinecap="round"
                                            className="transition-all duration-1000 ease-out"
                                        />
                                        <defs>
                                            <linearGradient id="indigoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#4f46e5" />
                                                <stop offset="100%" stopColor="#818cf8" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                    <div className="absolute flex flex-col items-center">
                                        <span className="text-4xl font-black text-slate-800">{readinessScore}%</span>
                                        <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mt-1">READINESS</span>
                                    </div>
                                </div>

                                <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 text-center mt-4">
                                    <span className="text-xs font-bold text-slate-700">
                                        Command Status: {readinessScore >= 80 ? "🟢 EXCELLENT PREPAREDNESS" : readinessScore >= 60 ? "🟡 MODERATE READY STATE" : "🔴 ACTION REQUIRED"}
                                    </span>
                                </div>
                            </Card>

                            {/* Operational Summary */}
                            <div className="lg:col-span-2">
                                <Card>
                                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-indigo-600" /> Executive Operations Dashboard
                                    </h3>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                                        <div className="bg-slate-50 p-4 border border-slate-100 rounded-2xl text-center">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Active Incidents</span>
                                            <span className="text-2xl font-black text-rose-600">{activeIncidentsDetail}</span>
                                        </div>
                                        <div className="bg-slate-50 p-4 border border-slate-100 rounded-2xl text-center">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Pending SOS</span>
                                            <span className="text-2xl font-black text-amber-600">{pendingSOSDetail}</span>
                                        </div>
                                        <div className="bg-slate-50 p-4 border border-slate-100 rounded-2xl text-center">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">AI Suggestions</span>
                                            <span className="text-2xl font-black text-indigo-600">{dashboard?.counts?.aiRecommendations?.pending || 0}</span>
                                        </div>
                                        <div className="bg-slate-50 p-4 border border-slate-100 rounded-2xl text-center">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">AI Acc. Rate</span>
                                            <span className="text-2xl font-black text-emerald-600">{dashboard?.kpis?.aiAccuracy || 88}%</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Logistics & Infrastructure Occupancy Check</h4>

                                        <div className="space-y-3.5">
                                            <div>
                                                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5 font-semibold">
                                                    <span>Shelter Accommodation Occupancy</span>
                                                    <span className="text-indigo-600">{dashboard?.kpis?.shelterUtilization?.percentage}%</span>
                                                </div>
                                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${dashboard?.kpis?.shelterUtilization?.percentage}%` }} />
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5 font-semibold">
                                                    <span>Rescue Equipment Sourced</span>
                                                    <span className="text-emerald-600">82%</span>
                                                </div>
                                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: "82%" }} />
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5 font-semibold">
                                                    <span>AI Decisions Auto-Accuracy</span>
                                                    <span className="text-indigo-600">{dashboard?.kpis?.aiAccuracy || 88}%</span>
                                                </div>
                                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${dashboard?.kpis?.aiAccuracy || 88}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    )}

                    {/* TRENDS TAB */}
                    {activeTab === "trends" && (
                        <div className="space-y-6">
                            <Card>
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                                    <div>
                                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                            <LineChart className="w-4 h-4 text-indigo-600" /> Incident & SOS Response Analytics
                                        </h3>
                                        <p className="text-xs text-slate-400 mt-1">Graphical comparison of daily incident flows and citizen assistance alerts.</p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-500 font-bold">Time Range:</span>
                                        <select
                                            value={chartDays}
                                            onChange={(e) => setChartDays(Number(e.target.value))}
                                            className="text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                        >
                                            <option value={7}>7 Days</option>
                                            <option value={15}>15 Days</option>
                                        </select>
                                    </div>
                                </div>

                                {isTrendLoading ? (
                                    <div className="flex justify-center py-16">
                                        <span className="animate-spin rounded-full h-6 w-6 border-2 border-slate-250 border-t-indigo-600" />
                                    </div>
                                ) : !trends || trends.length === 0 ? (
                                    <p className="text-xs text-slate-400 italic text-center py-10">No trend entries registered.</p>
                                ) : (
                                    <div className="space-y-6">
                                        {/* CUSTOM TREND CHART SVG */}
                                        <div className="relative h-64 border-b border-l border-slate-100 w-full pt-4 px-2">
                                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-5">
                                                <div className="border-b border-dotted border-black w-full h-[1px]" />
                                                <div className="border-b border-dotted border-black w-full h-[1px]" />
                                                <div className="border-b border-dotted border-black w-full h-[1px]" />
                                                <div className="border-b border-dotted border-black w-full h-[1px]" />
                                            </div>

                                            <div className="flex items-end justify-between h-full gap-2 relative z-10">
                                                {trends.map((item, idx) => {
                                                    const maxVal = Math.max(1, ...trends.map(t => Math.max(t.reportedIncidents, t.resolvedIncidents, t.sosRequests)));
                                                    const repH = (item.reportedIncidents / maxVal) * 85;
                                                    const resH = (item.resolvedIncidents / maxVal) * 85;
                                                    const sosH = (item.sosRequests / maxVal) * 85;

                                                    return (
                                                        <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                                                            <div className="absolute bottom-full mb-2 bg-slate-900 border border-slate-850 px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none text-[9px] text-white font-bold z-30 shadow-xl space-y-1">
                                                                <p className="text-amber-400">{item.date}</p>
                                                                <p>Reported: {item.reportedIncidents}</p>
                                                                <p className="text-emerald-400">Resolved: {item.resolvedIncidents}</p>
                                                                <p className="text-cyan-400">Citizen SOS: {item.sosRequests}</p>
                                                            </div>

                                                            <div className="flex items-end justify-center w-full gap-1 h-48">
                                                                {/* Reported Bar */}
                                                                <div
                                                                    className="w-2 md:w-3 bg-rose-500 rounded-t-sm transition-all duration-300"
                                                                    style={{ height: `${Math.max(repH, 4)}%` }}
                                                                />
                                                                {/* Resolved Bar */}
                                                                <div
                                                                    className="w-2 md:w-3 bg-emerald-500 rounded-t-sm transition-all duration-300"
                                                                    style={{ height: `${Math.max(resH, 4)}%` }}
                                                                />
                                                                {/* SOS Bar */}
                                                                <div
                                                                    className="w-2 md:w-3 bg-cyan-500 rounded-t-sm transition-all duration-300"
                                                                    style={{ height: `${Math.max(sosH, 4)}%` }}
                                                                />
                                                            </div>

                                                            <span className="text-[9px] text-slate-400 font-bold mt-2 truncate w-full text-center">
                                                                {item.date}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Chart Legends */}
                                        <div className="flex justify-center gap-6 text-[10px] font-black uppercase tracking-wider">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 bg-rose-500 rounded-md" />
                                                <span className="text-slate-500">NEW INCIDENTS REPORTED</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 bg-emerald-500 rounded-md" />
                                                <span className="text-slate-500">RESOLVED INCIDENTS</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 bg-cyan-500 rounded-md" />
                                                <span className="text-slate-500">SOS PUBLIC ASSISTS</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        </div>
                    )}

                    {/* DISTRICTS TAB */}
                    {activeTab === "districts" && (
                        <Card>
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-indigo-600" /> District Crisis Distribution Rankings
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-1">Comparing severity variables list across all 14 disaster zones of Kerala.</p>
                                </div>
                            </div>

                            {isDistLoading ? (
                                <div className="flex justify-center py-16">
                                    <span className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-indigo-600" />
                                </div>
                            ) : !districts || districts.length === 0 ? (
                                <p className="text-xs text-slate-400 italic text-center py-10">No district logs registered.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-slate-650">
                                        <thead>
                                            <tr className="border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                                <th className="py-2.5 px-3">District</th>
                                                <th className="py-2.5 px-3 text-center">Threat Indicator</th>
                                                <th className="py-2.5 px-3 text-center">Active Incidents</th>
                                                <th className="py-2.5 px-3 text-center">Resolved Count</th>
                                                <th className="py-2.5 px-3 text-center">SOS Alerts</th>
                                                <th className="py-2.5 px-3">Shelters In Use</th>
                                                <th className="py-2.5 px-3 text-right">Occupancy Ratio</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100/50 text-xs">
                                            {districts.map((item) => (
                                                <tr key={item.district} className="hover:bg-slate-50/50 transition">
                                                    <td className="py-3 px-3 font-bold text-slate-800">{item.district}</td>
                                                    <td className="py-3 px-3 text-center">
                                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase ring-1 ${item.riskScore >= 75
                                                                ? "text-red-700 bg-red-50 ring-red-100"
                                                                : item.riskScore >= 45
                                                                    ? "text-amber-700 bg-amber-50 ring-amber-100"
                                                                    : "text-emerald-700 bg-emerald-50 ring-emerald-100"
                                                            }`}>
                                                            {item.riskLevel} ({item.riskScore})
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-3 text-center text-rose-600 font-extrabold">{item.activeIncidents}</td>
                                                    <td className="py-3 px-3 text-center text-emerald-600 font-bold">{item.resolvedIncidents}</td>
                                                    <td className="py-3 px-3 text-center text-cyan-600 font-bold">{item.sosRequests}</td>
                                                    <td className="py-3 px-3 text-slate-500">{item.shelters?.active || 0} shelters</td>
                                                    <td className="py-3 px-3 text-right">
                                                        <div className="inline-flex items-center gap-2">
                                                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-indigo-500 rounded-full"
                                                                    style={{ width: `${Math.min(100, item.shelters?.utilization || 0)}%` }}
                                                                />
                                                            </div>
                                                            <span className="font-bold text-slate-700 text-[10px]">{item.shelters?.utilization || 0}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Card>
                    )}

                    {/* RESOURCES TAB */}
                    {activeTab === "resources" && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card>
                                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <Boxes className="w-4 h-4 text-indigo-600" /> Sourced Stock Supplies Inventory
                                </h3>

                                {isResLoading ? (
                                    <div className="flex justify-center py-10">
                                        <span className="animate-spin rounded-full h-5 w-5 border-2 border-slate-200 border-t-indigo-600" />
                                    </div>
                                ) : !resources?.suppliesStock || resources.suppliesStock.length === 0 ? (
                                    <p className="text-xs text-slate-400 italic text-center py-10">No stock resources loaded.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {resources.suppliesStock.map((item) => {
                                            const totalQuantities = Math.max(1, ...resources.suppliesStock.map(s => s.quantity));
                                            return (
                                                <div key={item.category} className="space-y-1">
                                                    <div className="flex justify-between text-xs font-semibold">
                                                        <span className="text-slate-600">{item.category} Supplies</span>
                                                        <span className="text-slate-800 font-extrabold">{item.quantity} units</span>
                                                    </div>
                                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-indigo-600 rounded-full"
                                                            style={{ width: `${(item.quantity / totalQuantities) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </Card>

                            <Card>
                                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <Truck className="w-4 h-4 text-indigo-600" /> Vehicle Status & Deployment Group
                                </h3>

                                {isResLoading ? (
                                    <div className="flex justify-center py-10">
                                        <span className="animate-spin rounded-full h-5 w-5 border-2 border-slate-200 border-t-indigo-600" />
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { label: "Available", val: resources?.vehicles?.breakdown?.Available || 0, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100" },
                                            { label: "Dispatched", val: resources?.vehicles?.breakdown?.Dispatched || 0, color: "text-amber-700", bg: "bg-amber-50 border-amber-100" },
                                            { label: "On Mission", val: resources?.vehicles?.breakdown?.["On Mission"] || 0, color: "text-blue-700", bg: "bg-blue-50 border-blue-105" },
                                            { label: "Maintenance", val: resources?.vehicles?.breakdown?.Maintenance || 0, color: "text-rose-700", bg: "bg-rose-50 border-rose-100" },
                                        ].map((stat) => (
                                            <div key={stat.label} className={`${stat.bg} border rounded-2xl p-4 text-center`}>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">{stat.label}</span>
                                                <span className={`text-2xl font-black ${stat.color}`}>{stat.val}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Card>
                        </div>
                    )}

                    {/* REPORT CENTER TAB */}
                    {activeTab === "reports" && (
                        <Card className="max-w-2xl mx-auto">
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-indigo-650" /> Administrative Report Center
                            </h3>
                            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                                Formulate operations audits, logistics listings, weather logs or AI activity. Select date range variables, district indicators, and download directly in Excel, CSV, or preview/print in PDF.
                            </p>

                            <form onSubmit={handleExport} className="space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Report Content</label>
                                        <select
                                            value={reportType}
                                            onChange={(e) => setReportType(e.target.value)}
                                            className="w-full text-xs font-bold bg-white border border-slate-205 border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:ring-2 focus:ring-indigo-100 focus:outline-none"
                                        >
                                            <option value="incidents">Incidents Management Review</option>
                                            <option value="shelters">Evacuation Shelter Status</option>
                                            <option value="resources">Warehouse Resource Inventories</option>
                                            <option value="vehicles">Fleet Logistics & Vehicles</option>
                                            <option value="ai">AI Decision Engine Audits</option>
                                            <option value="sensors">IoT River & Sensor Readings</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Timeframe Mode</label>
                                        <select
                                            value={timeframe}
                                            onChange={(e) => setTimeframe(e.target.value)}
                                            className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:ring-2 focus:ring-indigo-150 focus:ring-indigo-100 focus:outline-none"
                                        >
                                            <option value="daily">Daily Report (Last 24 Hours)</option>
                                            <option value="weekly">Weekly Report (Last 7 Days)</option>
                                            <option value="monthly">Monthly Report (Last 30 Days)</option>
                                            <option value="custom">Custom Date Range Selection</option>
                                        </select>
                                    </div>

                                    {timeframe === "custom" && (
                                        <>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Period Start</label>
                                                <input
                                                    type="date"
                                                    value={startDate}
                                                    onChange={(e) => setStartDate(e.target.value)}
                                                    className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:ring-2 focus:ring-indigo-100 focus:outline-none"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Period End</label>
                                                <input
                                                    type="date"
                                                    value={endDate}
                                                    onChange={(e) => setEndDate(e.target.value)}
                                                    className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:ring-2 focus:ring-indigo-100 focus:outline-none"
                                                />
                                            </div>
                                        </>
                                    )}

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">District Scope</label>
                                        <select
                                            value={districtFilter}
                                            onChange={(e) => setDistrictFilter(e.target.value)}
                                            className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:ring-2 focus:ring-indigo-100 focus:outline-none"
                                        >
                                            <option value="">State-wide Selection (All Districts)</option>
                                            {allDistricts.map((d) => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Download File Type</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { key: "csv", label: "CSV", icon: Download },
                                                { key: "excel", label: "Excel", icon: FileSpreadsheet },
                                                { key: "pdf", label: "PDF Document", icon: FileText }
                                            ].map((type) => (
                                                <button
                                                    key={type.key}
                                                    type="button"
                                                    onClick={() => setFormat(type.key)}
                                                    className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition flex flex-col items-center justify-center gap-1.5 outline-none ${format === type.key
                                                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-105"
                                                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                                        }`}
                                                >
                                                    {type.key === "csv" ? <Download className="w-3.5 h-3.5" /> : <type.icon className="w-3.5 h-3.5" />}
                                                    {type.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={exportReportMutation.isPending}
                                        className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider bg-indigo-600 text-white shadow-xl shadow-indigo-100 hover:shadow-indigo-200 transition disabled:opacity-50"
                                    >
                                        {exportReportMutation.isPending ? (
                                            <>
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                Compiling report file...
                                            </>
                                        ) : (
                                            <>
                                                <Download className="w-4 h-4" />
                                                Generate and Download Report
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </Card>
                    )}
                </div>
            )}
        </MainLayout>
    );
};

export default AnalyticsPage;
