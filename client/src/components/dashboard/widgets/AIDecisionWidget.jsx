import { useAIRecommendations, useAIPredictions } from "../../../hooks/useAIRecommendations";
import Card from "../../common/Card";
import { Brain, Sparkles, AlertTriangle, TrendingUp, ChevronRight, Shield } from "lucide-react";
import { Link } from "react-router-dom";

const priorityDots = {
    Critical: "bg-rose-500 animate-pulse",
    High: "bg-amber-500",
    Medium: "bg-blue-500",
    Low: "bg-slate-400",
};

const AIDecisionWidget = () => {
    const { data: recsRes, isLoading: isRecsLoading } = useAIRecommendations(
        { status: "Pending", limit: 5 },
        { refetchInterval: 15000 }
    );
    const { data: predsRes, isLoading: isPredsLoading } = useAIPredictions({ refetchInterval: 30000 });

    const recs = recsRes?.data || [];
    const stats = recsRes?.stats || {};
    const preds = predsRes?.data || [];
    const critPreds = preds.filter((p) => p.severity === "Critical" || p.severity === "High");

    const isLoading = isRecsLoading || isPredsLoading;

    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-1.5">
                    <Brain className="h-5 w-5 text-indigo-650 animate-pulse" />
                    <h3 className="font-semibold text-slate-800">AI Intelligence</h3>
                </div>
                <Link to="/ai-decisions" className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-0.5">
                    Full Dashboard <ChevronRight className="w-3 h-3" />
                </Link>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center py-6">
                    <span className="animate-spin rounded-full h-5 w-5 border-2 border-slate-200 border-t-indigo-600"></span>
                </div>
            ) : (
                <div className="space-y-4 text-xs">
                    {/* Quick Metrics */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-2">
                            <span className="text-[9px] font-bold text-indigo-600 uppercase block mb-0.5">Pending</span>
                            <span className="text-sm font-extrabold text-indigo-800">{stats.pending || 0}</span>
                        </div>
                        <div className="bg-rose-50 border border-rose-100 rounded-xl p-2">
                            <span className="text-[9px] font-bold text-rose-600 uppercase block mb-0.5">Critical</span>
                            <span className={`text-sm font-extrabold ${stats.critical > 0 ? "text-rose-700 animate-pulse" : "text-slate-500"}`}>
                                {stats.critical || 0}
                            </span>
                        </div>
                        <div className="bg-violet-50 border border-violet-100 rounded-xl p-2">
                            <span className="text-[9px] font-bold text-violet-600 uppercase block mb-0.5">Predictions</span>
                            <span className="text-sm font-extrabold text-violet-800">{preds.length}</span>
                        </div>
                    </div>

                    {/* Critical Predictions Alert */}
                    {critPreds.length > 0 && (
                        <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 space-y-1.5">
                            <span className="text-[9px] font-black text-rose-600 uppercase tracking-wider flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> High-Priority Predictions
                            </span>
                            {critPreds.slice(0, 2).map((p, i) => (
                                <div key={i} className="text-[10px] text-rose-700 leading-relaxed font-medium">
                                    📍 {p.district}: {p.prediction.slice(0, 100)}…
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Recent Recommendations List */}
                    <div className="space-y-1.5 border-t border-slate-100 pt-3">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                            Latest Recommendations
                        </span>
                        {recs.length === 0 ? (
                            <p className="text-[10px] text-slate-400 italic text-center py-2">No pending recommendations.</p>
                        ) : (
                            <div className="space-y-1 max-h-[100px] overflow-y-auto pr-1">
                                {recs.map((rec) => (
                                    <div key={rec._id} className="flex items-start gap-2 py-1 hover:bg-slate-50 rounded px-1 transition">
                                        <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${priorityDots[rec.priority] || "bg-slate-400"}`} />
                                        <p className="text-[10px] text-slate-700 leading-relaxed font-medium line-clamp-2 font-sans">
                                            {rec.recommendation}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Card>
    );
};

export default AIDecisionWidget;
