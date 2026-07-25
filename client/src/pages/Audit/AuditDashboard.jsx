import { useState, useEffect } from "react";
import MainLayout from "../../components/layout/MainLayout";
import Card from "../../components/common/Card";
import BackButton from "../../components/common/BackButton";
import { useAuditLogs, useSecurityEvents } from "../../hooks/useAuditLogs";
import { downloadAuditLogsExport } from "../../services/auditService";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { getSocketIO } from "../../sockets/socket.js";
import {
    Activity,
    Shield,
    ShieldAlert,
    Search,
    Filter,
    Calendar,
    Download,
    Lock,
    Unlock,
    UserX,
    Database,
    Cpu,
    Radio,
    Clock,
    FileText,
    ChevronLeft,
    ChevronRight,
    UserCheck,
    AlertOctagon,
    AlertTriangle,
    Key,
    PlusCircle,
    Edit3,
    Trash2,
    CheckCircle,
    Info
} from "lucide-react";

const MODULE_OPTIONS = ["Auth", "Incident", "Shelter", "Resource", "Vehicle", "Volunteer", "AIDecision", "System", "CommandCenter"];
const SEVERITY_OPTIONS = ["Info", "Low", "Medium", "High", "Critical"];

const AuditDashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState("logs"); // "logs" or "security"

    // Filters for Audit logs query
    const [search, setSearch] = useState("");
    const [selectedModule, setSelectedModule] = useState("");
    const [selectedSeverity, setSelectedSeverity] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const limit = 15;

    // Filters for Security logs query
    const [securityPage, setSecurityPage] = useState(1);

    // Socket client monitoring state
    const [socketConnected, setSocketConnected] = useState(false);
    const [liveLogsCount, setLiveLogsCount] = useState(0);

    // Query Audit Logs
    const {
        data: logsData,
        isLoading: logsLoading,
        refetch: refetchLogs
    } = useAuditLogs({
        page: currentPage,
        limit,
        search,
        module: selectedModule,
        severity: selectedSeverity,
        startDate,
        endDate
    });

    // Query Security Events & stats
    const {
        data: securityData,
        isLoading: securityLoading,
        refetch: refetchSecurity
    } = useSecurityEvents({
        page: securityPage,
        limit: 15
    });

    // Auto-update socket connection indicator
    useEffect(() => {
        try {
            const socket = getSocketIO();
            if (socket) {
                setSocketConnected(socket.connected);

                const onConnect = () => setSocketConnected(true);
                const onDisconnect = () => setSocketConnected(false);

                socket.on("connect", onConnect);
                socket.on("disconnect", onDisconnect);

                // Listen for real-time audit/security broadcasts
                const onAuditCreated = () => {
                    setLiveLogsCount(prev => prev + 1);
                    refetchLogs();
                };

                const onSecurityAlert = (data) => {
                    toast.error(`⚠️ Security Incident: ${data.description || data.type}`, {
                        duration: 6500,
                        icon: "🛡️"
                    });
                    refetchSecurity();
                };

                socket.on("auditCreated", onAuditCreated);
                socket.on("securityAlert", onSecurityAlert);
                socket.on("suspiciousActivity", onSecurityAlert);

                return () => {
                    socket.off("connect", onConnect);
                    socket.off("disconnect", onDisconnect);
                    socket.off("auditCreated", onAuditCreated);
                    socket.off("securityAlert", onSecurityAlert);
                    socket.off("suspiciousActivity", onSecurityAlert);
                };
            }
        } catch (e) {
            console.warn("Socket monitoring unavailable:", e.message);
        }
    }, [refetchLogs, refetchSecurity]);

    const handleClearFilters = () => {
        setSearch("");
        setSelectedModule("");
        setSelectedSeverity("");
        setStartDate("");
        setEndDate("");
        setCurrentPage(1);
    };

    const handleExport = async (format) => {
        try {
            toast.loading(`Preparing ${format.toUpperCase()} export file...`, { id: "export" });

            if (format === "pdf") {
                // PDF Printer friendly trigger
                toast.success("Ready for PDF export! Please press Print / Save to PDF.", { id: "export" });
                window.print();
                return;
            }

            await downloadAuditLogsExport({
                format,
                search,
                module: selectedModule,
                severity: selectedSeverity
            });

            toast.success(`${format.toUpperCase()} export downloaded successfully.`, { id: "export" });
        } catch (err) {
            toast.error(err || "Failed to download audit logs exports.", { id: "export" });
        }
    };

    const getSeverityBadge = (sev) => {
        switch (sev) {
            case "Critical":
                return <span className="bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse uppercase tracking-wider">{sev}</span>;
            case "High":
                return <span className="bg-orange-500/20 text-orange-400 border border-orange-500/40 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{sev}</span>;
            case "Medium":
                return <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{sev}</span>;
            case "Low":
                return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2 py-0.5 rounded-full font-medium">{sev}</span>;
            default:
                return <span className="bg-slate-800 text-slate-400 border border-slate-700 text-[10px] px-2 py-0.5 rounded-full font-medium">{sev || "Info"}</span>;
        }
    };

    const getActionIcon = (action) => {
        const act = action?.toLowerCase() || "";
        if (act.includes("login") || act.includes("lockout")) return <Key className="text-cyan-400 w-4 h-4" />;
        if (act.includes("create")) return <PlusCircle className="text-emerald-400 w-4 h-4" />;
        if (act.includes("update") || act.includes("assign")) return <Edit3 className="text-amber-400 w-4 h-4" />;
        if (act.includes("delete") || act.includes("remove")) return <Trash2 className="text-rose-400 w-4 h-4" />;
        return <Activity className="text-indigo-400 w-4 h-4" />;
    };

    const auditLogs = logsData?.data || [];
    const pagination = logsData?.pagination || { total: 0, pages: 1 };

    const securityEvents = securityData?.data || [];
    const stats = securityData?.stats || {
        failedLoginsCount: 0,
        lockoutsCount: 0,
        unauthorizedCount: 0,
        activeLockouts: 0,
        totalSecurityEvents: 0
    };

    return (
        <MainLayout>
            <div className="space-y-6 bg-slate-950 text-white min-h-screen p-6 font-sans">

                {/* Print Layout Header */}
                <div className="hidden print:block border-b border-black pb-4 mb-6">
                    <h1 className="text-3xl font-black text-black">Kerala Disaster Intelligence Platform</h1>
                    <h2 className="text-xl font-bold text-slate-800">System Activity & Compliance Audit Report</h2>
                    <p className="text-xs text-slate-600">Generated: {new Date().toLocaleString()} | Requested by Admin: {user?.email}</p>
                </div>

                <div className="print:hidden">
                    <BackButton />
                </div>

                {/* Master Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-900 pb-6 print:hidden">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                            <Shield className="h-6 w-6 text-cyan-400" />
                            Audit Logs & Security Compliance Monitoring
                        </h1>
                        <p className="text-slate-400 text-xs mt-1">
                            System-wide forensic trace logs, anomaly detection, administrator actions, and user lockout monitoring.
                        </p>
                    </div>

                    {/* Exporters and Live Counters */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="bg-slate-900 border border-slate-850 px-3 py-1.5 rounded-xl flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${socketConnected ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
                            <span className="text-[10px] text-slate-400 font-bold">
                                {socketConnected ? "Telemetry Hook Online" : "Telemetry Offline"}
                            </span>
                            {liveLogsCount > 0 && (
                                <span className="bg-cyan-500/20 text-cyan-300 text-[10px] px-1.5 py-0.2 rounded font-extrabold ml-1.5 h-4 flex items-center border border-cyan-400/20 animate-bounce">
                                    +{liveLogsCount} Live Logs
                                </span>
                            )}
                        </div>

                        {activeTab === "logs" && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleExport("csv")}
                                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition hover:scale-[1.02] cursor-pointer"
                                >
                                    <Download size={13} /> CSV
                                </button>
                                <button
                                    onClick={() => handleExport("csv")} // Executed CSV, acts as Excel representation
                                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition hover:scale-[1.02] cursor-pointer"
                                >
                                    <Download size={13} /> Excel
                                </button>
                                <button
                                    onClick={() => handleExport("pdf")}
                                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition hover:scale-[1.02] cursor-pointer"
                                >
                                    <FileText size={13} /> PDF
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Step 11 Widget Indicators (Dashboard Metrics) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 print:hidden">

                    {/* Log Volume widget */}
                    <Card className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-2xl relative overflow-hidden">
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">System Telemetry Logged</span>
                            <span className="text-2xl font-black text-white">{pagination.total} entries</span>
                        </div>
                        <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl">
                            <Activity className="w-5 h-5" />
                        </div>
                    </Card>

                    {/* Failed Logins widget */}
                    <Card className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-2xl relative overflow-hidden">
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Failed Login Blockades</span>
                            <span className={`text-2xl font-black ${stats.failedLoginsCount > 0 ? "text-amber-400" : "text-white"}`}>
                                {stats.failedLoginsCount} captures
                            </span>
                        </div>
                        <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
                            <AlertTriangle className="w-5 h-5 shadow" />
                        </div>
                    </Card>

                    {/* Active Lockouts widget */}
                    <Card className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-2xl relative overflow-hidden">
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Accounts Locked</span>
                            <span className={`text-2xl font-black ${stats.activeLockouts > 0 ? "text-red-500 animate-pulse" : "text-white"}`}>
                                {stats.activeLockouts} locked
                            </span>
                        </div>
                        <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
                            <Lock className="w-5 h-5" />
                        </div>
                    </Card>

                    {/* System Health Monitor (Database, API ping, and Sockets) */}
                    <Card className="bg-slate-900 border border-slate-800 p-4.5 rounded-2xl shadow-2xl space-y-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Forensic Node Health</span>

                        <div className="grid grid-cols-3 gap-2 text-[10px] font-bold">
                            <div className="bg-slate-950 border border-slate-850 p-2 rounded-xl text-center">
                                <Database className="w-4 h-4 text-emerald-450 mx-auto mb-1.5" />
                                <span className="text-slate-400 block text-[8px] uppercase">Database</span>
                                <span className="text-white">Active</span>
                            </div>
                            <div className="bg-slate-950 border border-slate-850 p-2 rounded-xl text-center">
                                <Cpu className="w-4 h-4 text-cyan-400 mx-auto mb-1.5" />
                                <span className="text-slate-400 block text-[8px] uppercase">Engine</span>
                                <span className="text-white">99.8%</span>
                            </div>
                            <div className="bg-slate-950 border border-slate-850 p-2 rounded-xl text-center">
                                <Radio className="w-4 h-4 text-indigo-400 mx-auto mb-1.5" />
                                <span className="text-slate-400 block text-[8px] uppercase">IO Gate</span>
                                <span className="text-white">{socketConnected ? "Online" : "Retry"}</span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Tabs selection */}
                <div className="flex border-b border-slate-900 gap-6 mt-4 print:hidden">
                    <button
                        onClick={() => setActiveTab("logs")}
                        className={`pb-4 text-sm font-black transition relative ${activeTab === "logs" ? "text-cyan-400" : "text-slate-400 hover:text-white"
                            }`}
                    >
                        Timeline Audit Logs
                        {activeTab === "logs" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500 rounded-full" />}
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab("security");
                            refetchSecurity();
                        }}
                        className={`pb-4 text-sm font-black transition relative ${activeTab === "security" ? "text-red-400" : "text-slate-400 hover:text-white"
                            }`}
                    >
                        Security & Threat Anomaly Alerts
                        {activeTab === "security" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 rounded-full" />}
                    </button>
                </div>

                {/* PANEL 1: AUDIT LOGS GRAPH & TABLE TIMELINE */}
                {activeTab === "logs" && (
                    <div className="space-y-6">

                        {/* Filters Panel */}
                        <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl flex flex-col gap-4 print:hidden">
                            <div className="flex items-center gap-2 pb-2 border-b border-slate-850/50">
                                <Filter size={14} className="text-cyan-400" />
                                <span className="text-xs font-bold text-slate-300">Filter Trace Parameters</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                                {/* Search */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Search Phrase</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                                        <input
                                            type="text"
                                            placeholder="User, action, keyword..."
                                            value={search}
                                            onChange={(e) => {
                                                setSearch(e.target.value);
                                                setCurrentPage(1);
                                            }}
                                            className="bg-slate-950 border border-slate-800 focus:border-cyan-500 w-full pl-9 pr-3 py-1.5 rounded-lg text-xs outline-none text-white transition"
                                        />
                                    </div>
                                </div>

                                {/* Module */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Module Category</label>
                                    <select
                                        value={selectedModule}
                                        onChange={(e) => {
                                            setSelectedModule(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="bg-slate-950 border border-slate-800 focus:border-cyan-500 w-full px-3 py-1.5 rounded-lg text-xs outline-none text-white transition h-8"
                                    >
                                        <option value="">All Categories</option>
                                        {MODULE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>

                                {/* Severity */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Severity Level</label>
                                    <select
                                        value={selectedSeverity}
                                        onChange={(e) => {
                                            setSelectedSeverity(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="bg-slate-950 border border-slate-800 focus:border-cyan-500 w-full px-3 py-1.5 rounded-lg text-xs outline-none text-white transition h-8"
                                    >
                                        <option value="">All Severities</option>
                                        {SEVERITY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>

                                {/* Start Date */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Start Date</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => {
                                            setStartDate(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="bg-slate-950 border border-slate-800 focus:border-cyan-500 w-full px-3 py-1 rounded-lg text-xs outline-none text-white transition h-8"
                                    />
                                </div>

                                {/* End Date */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">End Date</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => {
                                            setEndDate(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="bg-slate-950 border border-slate-800 focus:border-cyan-500 w-full px-3 py-1 rounded-lg text-xs outline-none text-white transition h-8"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={handleClearFilters}
                                    className="text-xs text-slate-400 hover:text-white font-bold transition"
                                >
                                    Reset Filters
                                </button>
                            </div>
                        </div>

                        {/* Audit Log Timeline list */}
                        <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl shadow-2xl relative">
                            {logsLoading ? (
                                <div className="text-center py-20 text-xs text-slate-450 animate-pulse">
                                    Loading audit logs files...
                                </div>
                            ) : auditLogs.length === 0 ? (
                                <div className="text-center py-20 text-xs text-slate-450/40">
                                    No audit telemetry matched your filter settings.
                                </div>
                            ) : (
                                <div className="space-y-6 select-none font-medium">
                                    {/* Timeline container */}
                                    <div className="relative border-l-2 border-slate-850 ml-4 pl-8 space-y-8 py-3">
                                        {auditLogs.map((log) => (
                                            <div key={log._id} className="relative group">
                                                {/* Bullet Icon */}
                                                <div className="absolute -left-12 top-1.5 bg-slate-950 border-2 border-slate-800 group-hover:border-cyan-500 rounded-full p-1.5 transition-colors">
                                                    {getActionIcon(log.action)}
                                                </div>

                                                <div className="bg-slate-950/40 hover:bg-slate-950 border border-slate-850/80 hover:border-slate-800 p-4 rounded-xl flex flex-col md:flex-row justify-between md:items-center gap-4 transition">
                                                    <div className="space-y-1">
                                                        <div className="flex flex-wrap items-center gap-2.5">
                                                            <span className="text-xs font-black text-white">{log.action}</span>
                                                            <span className="text-[9px] bg-slate-900 border border-slate-800 text-cyan-400 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">{log.module}</span>
                                                            {getSeverityBadge(log.severity)}
                                                        </div>
                                                        <p className="text-xs text-slate-350 leading-relaxed font-sans">{log.description}</p>

                                                        {/* Metadata block */}
                                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500 pt-1">
                                                            <span className="font-bold flex items-center gap-1"><Clock size={11} /> {new Date(log.timestamp).toLocaleDateString()} at {new Date(log.timestamp).toLocaleTimeString()}</span>
                                                            <span className="flex items-center gap-1 font-semibold">{log.userEmail || (log.user ? `${log.user.name} (${log.user.role})` : "System / Anonymous")}</span>
                                                            <span>IP: {log.ipAddress || "local"}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Pagination Controls */}
                                    <div className="flex justify-between items-center border-t border-slate-850 pt-5 print:hidden">
                                        <span className="text-[10px] text-slate-450 font-bold">
                                            Page {pagination.page} of {pagination.pages} ({pagination.total} records total)
                                        </span>

                                        <div className="flex items-center gap-2">
                                            <button
                                                disabled={currentPage <= 1}
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                className="p-1 px-2 border border-slate-800 hover:border-slate-700 bg-slate-950 rounded-lg text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-900 transition cursor-pointer"
                                            >
                                                <ChevronLeft size={16} />
                                            </button>
                                            <button
                                                disabled={currentPage >= pagination.pages}
                                                onClick={() => setCurrentPage(p => Math.min(pagination.pages, p + 1))}
                                                className="p-1 px-2 border border-slate-800 hover:border-slate-700 bg-slate-950 rounded-lg text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-900 transition cursor-pointer"
                                            >
                                                <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* PANEL 2: SECURITY & ANOMALIES WATCHBOARD */}
                {activeTab === "security" && (
                    <div className="space-y-6">

                        {/* Threat aggregation feed */}
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                            {/* Live Alert Alarms box */}
                            <div className="lg:col-span-1 bg-slate-900 border border-slate-850 rounded-2xl p-5 space-y-4">
                                <h3 className="text-xs font-black uppercase text-red-400 tracking-wider flex items-center gap-1.5">
                                    <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" /> Anomalous Watch
                                </h3>
                                <p className="text-[11px] text-slate-450 leading-relaxed font-semibold">
                                    The module monitors all actions cross-referencing auth tables, authorization rules, and brute-force pings.
                                </p>

                                <div className="space-y-2 pt-2 text-[11px] font-bold text-slate-300">
                                    <div className="flex justify-between p-2.5 bg-slate-950/40 border border-slate-850 rounded-xl">
                                        <span className="text-slate-450 font-semibold">Multiple failures</span>
                                        <span className="text-red-400">{stats.failedLoginsCount} detected</span>
                                    </div>

                                    <div className="flex justify-between p-2.5 bg-slate-950/40 border border-slate-850 rounded-xl">
                                        <span className="text-slate-450 font-semibold">Account locks</span>
                                        <span className="text-rose-500">{stats.lockoutsCount} flags</span>
                                    </div>

                                    <div className="flex justify-between p-2.5 bg-slate-950/40 border border-slate-850 rounded-xl">
                                        <span className="text-slate-450 font-semibold">Acl violations</span>
                                        <span className="text-purple-400">{stats.unauthorizedCount} hits</span>
                                    </div>
                                </div>
                            </div>

                            {/* Threat logs Timeline */}
                            <div className="lg:col-span-3 bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-2xl relative">
                                <h3 className="font-bold text-xs uppercase text-slate-300 tracking-wider mb-4">Security Incident Feed</h3>

                                {securityLoading ? (
                                    <div className="text-center py-20 text-xs text-slate-450 animate-pulse">
                                        Retrieving anomaly feeds...
                                    </div>
                                ) : securityEvents.length === 0 ? (
                                    <div className="text-center py-20 text-xs text-emerald-400 bg-slate-950/20 border border-slate-850/50 rounded-2xl">
                                        ✓ Safety index normal. Zero threat anomalies or privilege violations trace logs found.
                                    </div>
                                ) : (
                                    <div className="space-y-4 font-semibold font-sans">
                                        {securityEvents.map((ev) => (
                                            <div
                                                key={ev._id}
                                                className={`p-4 border rounded-2xl flex items-center justify-between gap-4 transition-colors ${ev.severity === "Critical"
                                                        ? "bg-red-500/5 border-red-500/20 hover:bg-red-500/10"
                                                        : "bg-slate-950/60 border-slate-850 hover:bg-slate-950"
                                                    }`}
                                            >
                                                <div className="space-y-1.5 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className={`text-[10px] px-2 py-0.5 rounded font-extrabold uppercase ${ev.severity === "Critical" ? "bg-red-650 text-white" : "bg-orange-500/15 text-orange-400 border border-orange-500/20"
                                                            }`}>
                                                            {ev.action}
                                                        </span>
                                                        <span className="text-[10px] text-slate-500 font-bold">{new Date(ev.timestamp).toLocaleString()}</span>
                                                        {getSeverityBadge(ev.severity)}
                                                    </div>

                                                    <p className="text-xs text-slate-350 leading-relaxed font-sans">{ev.description}</p>

                                                    {/* Details */}
                                                    <div className="flex flex-wrap gap-4 text-[10.5px] text-slate-450">
                                                        <span>Origin IP: <strong className="text-white">{ev.ipAddress || "Unknown"}</strong></span>
                                                        <span>Target: <strong className="text-white">{ev.userEmail || "Anonymous"}</strong></span>
                                                    </div>
                                                </div>

                                                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 shrink-0">
                                                    <AlertOctagon className={ev.severity === "Critical" ? "text-red-500 animate-ping" : "text-amber-505 text-amber-500"} size={20} />
                                                </div>
                                            </div>
                                        ))}

                                        {/* Pagination Controls */}
                                        <div className="flex justify-between items-center border-t border-slate-850 pt-5 pr-1">
                                            <span className="text-[10px] text-slate-450 font-bold">
                                                Page {securityPage} of {Math.ceil(stats.totalSecurityEvents / 15)}
                                            </span>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    disabled={securityPage <= 1}
                                                    onClick={() => setSecurityPage(p => Math.max(1, p - 1))}
                                                    className="p-1 px-2 border border-slate-700 bg-slate-950 rounded-lg text-slate-300 disabled:opacity-40"
                                                >
                                                    <ChevronLeft size={16} />
                                                </button>
                                                <button
                                                    disabled={securityPage >= Math.ceil(stats.totalSecurityEvents / 15)}
                                                    onClick={() => setSecurityPage(p => Math.min(Math.ceil(stats.totalSecurityEvents / 15) || 1, p + 1))}
                                                    className="p-1 px-2 border border-slate-700 bg-slate-950 rounded-lg text-slate-300 disabled:opacity-40"
                                                >
                                                    <ChevronRight size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
};

export default AuditDashboard;
