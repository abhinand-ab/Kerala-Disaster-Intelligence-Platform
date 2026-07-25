import { useState, useMemo } from "react";
import MainLayout from "../../components/layout/MainLayout";
import Header from "../../components/layout/Header";
import Card from "../../components/common/Card";
import {
    useAIRecommendations,
    useAIPredictions,
    useAIRiskSummary,
    useAIResourceOptimization,
    useAIAnalytics,
    useRunAnalysis,
    useAcceptRecommendation,
    useRejectRecommendation,
} from "../../hooks/useAIRecommendations";

import {
    Brain,
    Sparkles,
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
    XCircle,
    Clock,
    BarChart3,
    Zap,
    ChevronDown,
    ChevronRight,
    Gauge,
    Target,
    Layers,
    ArrowUpRight,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════════
//  PRIORITY / TYPE BADGES
// ═══════════════════════════════════════════════════════════════════════════════

const priorityStyles = {
    Critical: "bg-rose-100 text-rose-700 ring-rose-200",
    High: "bg-amber-100 text-amber-707 ring-amber-200",
    Medium: "bg-blue-105 text-blue-700 ring-blue-200",
    Low: "bg-slate-100 text-slate-600 ring-slate-200",
};

const typeIcons = {
    EvacuationShelter: Building2,
    RescueTeamDeploy: Users,
    VehicleDispatch: Truck,
    WarehouseSelection: Boxes,
    IncidentPrioritization: AlertTriangle,
    HighRiskAlert: Shield,
    FloodPrediction: TrendingUp,
    ShelterOvercrowding: Building2,
    ResourceShortage: Boxes,
    DemandForecast: BarChart3,
    ResourceAllocation: Boxes,
    EvacuationPlanning: MapPin,
    RouteSuggestion: MapPin,
    LandslidePrediction: AlertTriangle,
};

const typeLabels = {
    EvacuationShelter: "Evacuation",
    RescueTeamDeploy: "Rescue Team",
    VehicleDispatch: "Vehicle",
    WarehouseSelection: "Warehouse",
    IncidentPrioritization: "Incident Priority",
    HighRiskAlert: "High Risk Alert",
    FloodPrediction: "Flood Prediction",
    ShelterOvercrowding: "Shelter Overflow",
    ResourceShortage: "Resource Gap",
    DemandForecast: "Demand Forecast",
    ResourceAllocation: "Resources",
    EvacuationPlanning: "Evacuation Plan",
    RouteSuggestion: "Route",
    LandslidePrediction: "Landslide",
};

// ═══════════════════════════════════════════════════════════════════════════════
//  HELPER: Confidence Bar
// ═══════════════════════════════════════════════════════════════════════════════
const ConfidenceBar = ({ score }) => {
    const color =
        score >= 85 ? "bg-emerald-500" : score >= 65 ? "bg-blue-500" : score >= 45 ? "bg-amber-500" : "bg-rose-500";
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${score}%` }} />
            </div>
            <span className="text-[10px] font-bold text-slate-500">{score}%</span>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  STAT CARD
// ═══════════════════════════════════════════════════════════════════════════════
const AIStat = ({ icon: Icon, label, value, accent, subtitle }) => (
    <div className={`rounded-2xl border p-4 ${accent || "bg-white border-slate-200 text-slate-800"}`}>
        <div className="flex items-center gap-2 mb-2">
            <Icon className="w-4 h-4 opacity-70" />
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{label}</span>
        </div>
        <div className="text-2xl font-extrabold">{value}</div>
        {subtitle && <p className="text-[11px] mt-1 opacity-60">{subtitle}</p>}
    </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
//  RECOMMENDATION CARD
// ═══════════════════════════════════════════════════════════════════════════════

const RecommendationCard = ({ rec, onAccept, onReject, isAccepting, isRejecting }) => {
    const [expanded, setExpanded] = useState(false);
    const Icon = typeIcons[rec.recommendationType] || Sparkles;
    const priorityClass = priorityStyles[rec.priority] || priorityStyles.Medium;

    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="h-9 w-9 shrink-0 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-indigo-650" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase ring-1 ${priorityClass}`}>
                                {rec.priority}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-full">
                                {typeLabels[rec.recommendationType] || rec.recommendationType}
                            </span>
                            <span className="text-[9px] text-slate-400">
                                📍 {rec.district}
                            </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800 leading-relaxed">{rec.recommendation}</p>
                    </div>
                </div>

                <button onClick={() => setExpanded(!expanded)} className="shrink-0 p-1 hover:bg-slate-100 rounded-lg transition">
                    {expanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                </button>
            </div>

            {/* Confidence */}
            <div className="mt-3 px-12">
                <ConfidenceBar score={rec.confidenceScore} />
            </div>

            {/* Expanded Details */}
            {expanded && (
                <div className="mt-3 px-12 space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
                    {rec.reasoning && (
                        <p className="text-[11px] text-slate-500 italic leading-relaxed">
                            <span className="font-bold text-slate-600">Reasoning: </span>
                            {rec.reasoning}
                        </p>
                    )}
                    <div className="text-[10px] text-slate-400 flex flex-wrap gap-3">
                        <span>Generated: {new Date(rec.generatedAt).toLocaleString()}</span>
                        <span>Status: <span className="font-bold uppercase text-slate-707">{rec.status}</span></span>
                        {rec.generatedFor && <span>Source: {rec.generatedFor}</span>}
                    </div>
                </div>
            )}

            {/* Action Buttons for Pending */}
            {rec.status === "Pending" && (
                <div className="mt-3 flex justify-end gap-2 px-12">
                    <button
                        onClick={() => onReject(rec._id)}
                        disabled={isRejecting}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 transition disabled:opacity-50"
                    >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                    <button
                        onClick={() => onAccept(rec._id)}
                        disabled={isAccepting}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-emerald-707 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 transition disabled:opacity-50"
                    >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Accept
                    </button>
                </div>
            )}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  PREDICTION CARD
// ═══════════════════════════════════════════════════════════════════════════════
const PredictionCard = ({ pred }) => {
    const Icon = typeIcons[pred.type] || TrendingUp;
    const sevClass = priorityStyles[pred.severity] || priorityStyles.Medium;

    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
                <div className="h-9 w-9 shrink-0 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-violet-605" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase ring-1 ${sevClass}`}>
                            {pred.severity}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400">{pred.district}</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-850 leading-relaxed">{pred.prediction}</p>
                    <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${pred.probability >= 80 ? "bg-rose-500" : pred.probability >= 60 ? "bg-amber-500" : "bg-blue-500"
                                    }`}
                                style={{ width: `${pred.probability}%` }}
                            />
                        </div>
                        <span className="text-[10px] font-black text-slate-500">{pred.probability}%</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  RISK RANKING TABLE
// ═══════════════════════════════════════════════════════════════════════════════
const RiskRankingTable = ({ data }) => {
    if (!data || data.length === 0) return <p className="text-xs text-slate-400 italic">No risk data available.</p>;

    const levelColors = {
        Extreme: "text-rose-600 bg-rose-50",
        High: "text-amber-600 bg-amber-50",
        Moderate: "text-blue-600 bg-blue-50",
        Low: "text-emerald-700 bg-emerald-50",
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-xs">
                <thead>
                    <tr className="border-b border-slate-100">
                        <th className="text-left py-2 px-2 font-bold text-slate-500 text-[10px] uppercase tracking-wider">#</th>
                        <th className="text-left py-2 px-2 font-bold text-slate-500 text-[10px] uppercase tracking-wider">District</th>
                        <th className="text-center py-2 px-2 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Score</th>
                        <th className="text-center py-2 px-2 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Level</th>
                        <th className="text-center py-2 px-2 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Type</th>
                        <th className="text-center py-2 px-2 font-bold text-slate-505 text-[10px] uppercase tracking-wider">Rain</th>
                        <th className="text-center py-2 px-2 font-bold text-slate-505 text-[10px] uppercase tracking-wider">River</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((d, i) => (
                        <tr key={d.district} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                            <td className="py-2 px-2 font-extrabold text-slate-400">{i + 1}</td>
                            <td className="py-2 px-2 font-bold text-slate-707">{d.district}</td>
                            <td className="py-2 px-2 text-center">
                                <span className="font-black text-slate-808">{d.riskScore}</span>
                            </td>
                            <td className="py-2 px-2 text-center">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black ${levelColors[d.riskLevel] || "text-slate-500 bg-slate-50"}`}>
                                    {d.riskLevel}
                                </span>
                            </td>
                            <td className="py-2 px-2 text-center text-slate-505">{d.riskType}</td>
                            <td className="py-2 px-2 text-center text-slate-505">{d.rainfall?.toFixed(1)}mm</td>
                            <td className="py-2 px-2 text-center text-slate-505">{d.riverLevel?.toFixed(2)}mm</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  RESOURCE CHART (simple bars)
// ═══════════════════════════════════════════════════════════════════════════════
const ResourceUtilBar = ({ label, used, total, color }) => {
    const pct = total > 0 ? Math.round((used / total) * 100) : 0;
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-[10px]">
                <span className="font-bold text-slate-600">{label}</span>
                <span className="font-black text-slate-500">{used}/{total} ({pct}%)</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
const AIDecisionPage = () => {
    const [activeTab, setActiveTab] = useState("recommendations");
    const [typeFilter, setTypeFilter] = useState("");
    const [priorityFilter, setPriorityFilter] = useState("");

    const { data: recsRes, isLoading: isRecsLoading } = useAIRecommendations(
        {
            ...(typeFilter && { type: typeFilter }),
            ...(priorityFilter && { priority: priorityFilter }),
            limit: 100,
        },
        { refetchInterval: 15000 }
    );

    const { data: predsRes, isLoading: isPredsLoading } = useAIPredictions({ refetchInterval: 20000 });
    const { data: riskRes, isLoading: isRiskLoading } = useAIRiskSummary({ refetchInterval: 30000 });
    const { data: optRes, isLoading: isOptLoading } = useAIResourceOptimization({ refetchInterval: 30000 });
    const { data: analyticsRes, isLoading: isAnalyticsLoading } = useAIAnalytics({ refetchInterval: 60000 });

    const { mutate: runAnalysis, isPending: isRunning } = useRunAnalysis();
    const { mutate: acceptRec, isPending: isAccepting } = useAcceptRecommendation();
    const { mutate: rejectRec, isPending: isRejecting } = useRejectRecommendation();

    const recs = recsRes?.data || [];
    const stats = recsRes?.stats || {};
    const predictions = predsRes?.data || [];
    const riskSummary = riskRes?.data || [];
    const optimization = optRes?.data || {};
    const analytics = analyticsRes?.data || {};

    const criticalPreds = useMemo(() => predictions.filter((p) => p.severity === "Critical" || p.severity === "High"), [predictions]);

    const tabs = [
        { key: "recommendations", label: "Recommendations", icon: Sparkles },
        { key: "predictions", label: "Predictions", icon: TrendingUp },
        { key: "risk", label: "Risk Ranking", icon: Shield },
        { key: "resources", label: "Resource Optimization", icon: Boxes },
        { key: "analytics", label: "Analytics", icon: BarChart3 },
    ];

    return (
        <MainLayout>
            <Header
                title="AI Decision Intelligence"
                subtitle="Smart recommendations, predictive analytics, and resource optimization powered by the AI engine"
            />

            {/* ── Stat Row ────────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
                <AIStat
                    icon={Brain}
                    label="Total Recs"
                    value={stats.total || analytics?.overview?.total || 0}
                    accent="bg-indigo-50 border-indigo-100 text-indigo-805"
                />
                <AIStat
                    icon={Clock}
                    label="Pending"
                    value={stats.pending || analytics?.overview?.pending || 0}
                    accent="bg-amber-50 border-amber-100 text-amber-808"
                />
                <AIStat
                    icon={CheckCircle2}
                    label="Accepted"
                    value={stats.accepted || analytics?.overview?.accepted || 0}
                    accent="bg-emerald-50 border-emerald-100 text-emerald-808"
                />
                <AIStat
                    icon={AlertTriangle}
                    label="Critical"
                    value={stats.critical || analytics?.overview?.critical || 0}
                    accent="bg-rose-50 border-rose-100 text-rose-800"
                />
                <AIStat
                    icon={Gauge}
                    label="Avg Confidence"
                    value={`${stats.avgConfidence || 0}%`}
                    accent="bg-blue-50 border-blue-100 text-blue-800"
                />
                <AIStat
                    icon={Target}
                    label="Acceptance Rate"
                    value={`${analytics?.overview?.acceptanceRate || 0}%`}
                    accent="bg-violet-50 border-violet-100 text-violet-800"
                />
            </div>

            {/* ── Controls ────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <div className="flex flex-wrap gap-2">
                    {tabs.map((tab) => {
                        const TabIcon = tab.icon;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === tab.key
                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                                    }`}
                            >
                                <TabIcon className="w-3.5 h-3.5" /> {tab.label}
                            </button>
                        );
                    })}
                </div>
                <button
                    onClick={() => runAnalysis()}
                    disabled={isRunning}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-200 hover:shadow-xl transition disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${isRunning ? "animate-spin" : ""}`} />
                    {isRunning ? "Running Analysis…" : "Run AI Analysis"}
                </button>
            </div>

            {/* ═══════════ TAB CONTENT ═══════════ */}

            {/* ── RECOMMENDATIONS ──────────────────────────────────── */}
            {activeTab === "recommendations" && (
                <div className="space-y-4">
                    {/* Filters */}
                    <div className="flex gap-3 flex-wrap">
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-707 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        >
                            <option value="">All Types</option>
                            {Object.entries(typeLabels).map(([k, v]) => (
                                <option key={k} value={k}>{v}</option>
                            ))}
                        </select>
                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-707 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        >
                            <option value="">All Priorities</option>
                            <option value="Critical">Critical</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </select>
                    </div>

                    {isRecsLoading ? (
                        <div className="flex justify-center py-16">
                            <span className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-indigo-600" />
                        </div>
                    ) : recs.length === 0 ? (
                        <Card>
                            <div className="text-center py-12">
                                <Brain className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                <p className="text-sm font-semibold text-slate-500">No recommendations yet.</p>
                                <p className="text-xs text-slate-400 mt-1">Run the AI Analysis to generate intelligent recommendations.</p>
                            </div>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {recs.map((rec) => (
                                <RecommendationCard
                                    key={rec._id}
                                    rec={rec}
                                    onAccept={acceptRec}
                                    onReject={rejectRec}
                                    isAccepting={isAccepting}
                                    isRejecting={isRejecting}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── PREDICTIONS ──────────────────────────────────────── */}
            {activeTab === "predictions" && (
                <div className="space-y-4">
                    {isPredsLoading ? (
                        <div className="flex justify-center py-16">
                            <span className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-violet-605" />
                        </div>
                    ) : predictions.length === 0 ? (
                        <Card>
                            <div className="text-center py-12">
                                <TrendingUp className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                <p className="text-sm font-semibold text-slate-500">No predictions computed.</p>
                                <p className="text-xs text-slate-400 mt-1">Predictions are generated from current sensor, weather, and risk data.</p>
                            </div>
                        </Card>
                    ) : (
                        <>
                            {criticalPreds.length > 0 && (
                                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-4">
                                    <h3 className="text-xs font-black text-rose-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                                        <Zap className="w-4 h-4" /> Critical & High-Priority Predictions
                                    </h3>
                                    <div className="space-y-3">
                                        {criticalPreds.map((p, i) => (
                                            <PredictionCard key={i} pred={p} />
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                {predictions
                                    .filter((p) => p.severity !== "Critical" && p.severity !== "High")
                                    .map((p, i) => (
                                        <PredictionCard key={i} pred={p} />
                                    ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ── RISK RANKING ─────────────────────────────────────── */}
            {activeTab === "risk" && (
                <Card>
                    <div className="flex items-center gap-2 mb-4">
                        <Shield className="w-5 h-5 text-indigo-650" />
                        <h3 className="font-bold text-slate-800">District Risk Intelligence Ranking</h3>
                    </div>
                    {isRiskLoading ? (
                        <div className="flex justify-center py-16">
                            <span className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-indigo-600" />
                        </div>
                    ) : (
                        <RiskRankingTable data={riskSummary} />
                    )}
                </Card>
            )}

            {/* ── RESOURCE OPTIMIZATION ────────────────────────────── */}
            {activeTab === "resources" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Layers className="w-4 h-4 text-blue-600" /> Fleet & Team Utilization
                        </h3>
                        {isOptLoading ? (
                            <div className="flex justify-center py-8">
                                <span className="animate-spin rounded-full h-5 w-5 border-2 border-slate-200 border-t-blue-600" />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <ResourceUtilBar
                                    label="Rescue Teams"
                                    used={(optimization.totalTeams || 0) - (optimization.availableTeams || 0)}
                                    total={optimization.totalTeams || 0}
                                    color="bg-indigo-500"
                                />
                                <ResourceUtilBar
                                    label="Vehicles"
                                    used={(optimization.totalVehicles || 0) - (optimization.availableVehicles || 0)}
                                    total={optimization.totalVehicles || 0}
                                    color="bg-emerald-500"
                                />
                            </div>
                        )}
                    </Card>

                    <Card>
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600" /> Underserved High-Risk Districts
                        </h3>
                        {isOptLoading ? (
                            <div className="flex justify-center py-8">
                                <span className="animate-spin rounded-full h-5 w-5 border-2 border-slate-200 border-t-amber-600" />
                            </div>
                        ) : (optimization.underservedDistricts || []).length === 0 ? (
                            <p className="text-xs text-slate-400 italic py-4 text-center">All districts have adequate coverage.</p>
                        ) : (
                            <div className="space-y-2">
                                {(optimization.underservedDistricts || []).slice(0, 6).map((d) => (
                                    <div key={d.district} className="flex justify-between items-center py-2 px-3 bg-slate-50 rounded-xl">
                                        <div>
                                            <span className="text-xs font-bold text-slate-750">{d.district}</span>
                                            <span className="text-[10px] text-slate-400 ml-2">Risk: {d.riskScore}</span>
                                        </div>
                                        <div className="flex gap-3 text-[10px]">
                                            <span className="font-bold text-indigo-600">{d.teamsAvailable} teams</span>
                                            <span className="font-bold text-emerald-600">{d.vehiclesAvailable} vehicles</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    <Card className="lg:col-span-2">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-rose-600" /> Shelter Capacity Analysis
                        </h3>
                        {isOptLoading ? (
                            <div className="flex justify-center py-8">
                                <span className="animate-spin rounded-full h-5 w-5 border-2 border-slate-200 border-t-rose-600" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {(optimization.shelterAnalysis || []).slice(0, 9).map((s, i) => (
                                    <div key={i} className={`rounded-xl border p-3 ${s.status === "NearFull"
                                        ? "bg-rose-50 border-rose-200"
                                        : s.status === "Filling"
                                            ? "bg-amber-50 border-amber-200"
                                            : "bg-white border-slate-200"
                                        }`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-bold text-slate-700 truncate max-w-[140px]">{s.name}</span>
                                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full ${s.status === "NearFull"
                                                ? "bg-rose-100 text-rose-700"
                                                : s.status === "Filling"
                                                    ? "bg-amber-100 text-amber-707"
                                                    : "bg-emerald-100 text-emerald-700"
                                                }`}>
                                                {s.status}
                                            </span>
                                        </div>
                                        <ResourceUtilBar label="" used={s.occupancy} total={s.capacity} color={
                                            s.status === "NearFull" ? "bg-rose-500" : s.status === "Filling" ? "bg-amber-500" : "bg-emerald-500"
                                        } />
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            )}

            {/* ── ANALYTICS ────────────────────────────────────────── */}
            {activeTab === "analytics" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-indigo-650" /> Recommendation Overview
                        </h3>
                        {isAnalyticsLoading ? (
                            <div className="flex justify-center py-8">
                                <span className="animate-spin rounded-full h-5 w-5 border-2 border-slate-200 border-t-indigo-600" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: "Total", value: analytics?.overview?.total || 0, color: "text-slate-707" },
                                    { label: "Accepted", value: analytics?.overview?.accepted || 0, color: "text-emerald-600" },
                                    { label: "Rejected", value: analytics?.overview?.rejected || 0, color: "text-rose-600" },
                                    { label: "Pending", value: analytics?.overview?.pending || 0, color: "text-amber-600" },
                                    { label: "Expired", value: analytics?.overview?.expired || 0, color: "text-slate-400" },
                                    { label: "Acc. Rate", value: `${analytics?.overview?.acceptanceRate || 0}%`, color: "text-indigo-600" },
                                ].map((item) => (
                                    <div key={item.label} className="bg-slate-50 rounded-xl p-3 text-center">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">{item.label}</span>
                                        <span className={`text-lg font-extrabold ${item.color}`}>{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    <Card>
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-violet-605" /> By Recommendation Type
                        </h3>
                        {isAnalyticsLoading ? (
                            <div className="flex justify-center py-8">
                                <span className="animate-spin rounded-full h-5 w-5 border-2 border-slate-200 border-t-violet-600" />
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {(analytics?.byType || []).map((item) => {
                                    const maxCount = Math.max(...(analytics?.byType || []).map((t) => t.count), 1);
                                    return (
                                        <div key={item._id} className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-slate-600 w-32 truncate">
                                                {typeLabels[item._id] || item._id}
                                            </span>
                                            <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                                                <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" style={{ width: `${(item.count / maxCount) * 100}%` }} />
                                            </div>
                                            <span className="text-[10px] font-black text-slate-500 w-6 text-right">{item.count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Card>

                    <Card className="lg:col-span-2">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <ArrowUpRight className="w-4 h-4 text-emerald-600" /> 7-Day Trend
                        </h3>
                        {isAnalyticsLoading ? (
                            <div className="flex justify-center py-8">
                                <span className="animate-spin rounded-full h-5 w-5 border-2 border-slate-200 border-t-emerald-600" />
                            </div>
                        ) : (analytics?.recentTrend || []).length === 0 ? (
                            <p className="text-xs text-slate-400 italic text-center py-4">No trend data available yet.</p>
                        ) : (
                            <div className="flex items-end gap-2 h-32 px-2">
                                {(analytics?.recentTrend || []).map((day) => {
                                    const maxH = Math.max(...(analytics?.recentTrend || []).map((d) => d.count), 1);
                                    const heightPct = (day.count / maxH) * 100;
                                    return (
                                        <div key={day._id} className="flex-1 flex flex-col items-center gap-1">
                                            <span className="text-[9px] font-bold text-slate-500">{day.count}</span>
                                            <div className="w-full rounded-t-lg bg-gradient-to-t from-indigo-500 to-violet-400 transition-all duration-300" style={{ height: `${Math.max(heightPct, 4)}%` }} />
                                            <span className="text-[8px] text-slate-400 font-bold">
                                                {new Date(day._id).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Card>
                </div>
            )}
        </MainLayout>
    );
};

export default AIDecisionPage;
