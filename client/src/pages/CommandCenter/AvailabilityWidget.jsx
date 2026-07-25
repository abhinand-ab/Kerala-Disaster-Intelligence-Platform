import { Building2, Users, Truck, Boxes, ShieldAlert } from "lucide-react";

const AvailabilityWidget = ({ availability, isLoading }) => {
    if (isLoading) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 animate-pulse">
                <div className="h-6 bg-slate-200 rounded w-1/3"></div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="h-20 bg-slate-200 rounded-xl"></div>
                    <div className="h-20 bg-slate-200 rounded-xl"></div>
                    <div className="h-20 bg-slate-200 rounded-xl"></div>
                    <div className="h-20 bg-slate-200 rounded-xl"></div>
                </div>
            </div>
        );
    }

    const data = availability?.summarizedAvailability || {
        agenciesCount: 0,
        rescueTeams: { total: 0, available: 0, percentage: 0 },
        vehicles: { total: 0, available: 0, percentage: 0 },
        shelters: { total: 0, occupancy: 0, capacity: 0, percentage: 0 }
    };

    return (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    State Agency Resource Pool Availability
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {data.agenciesCount} Registered Agencies
                </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Rescue Teams availability */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-slate-500">
                        <span className="text-xs font-medium">Rescue Teams</span>
                        <Users className="w-4 h-4 text-indigo-500" />
                    </div>
                    <div className="mt-2">
                        <span className="text-2xl font-extrabold text-slate-900">{data.rescueTeams.available}</span>
                        <span className="text-xs text-slate-400"> / {data.rescueTeams.total} ready</span>
                    </div>
                    <div className="mt-2 w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${data.rescueTeams.percentage}%` }}></div>
                    </div>
                </div>

                {/* Fleet Availability */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-slate-500">
                        <span className="text-xs font-medium">Rescue Fleet</span>
                        <Truck className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="mt-2">
                        <span className="text-2xl font-extrabold text-slate-900">{data.vehicles.available}</span>
                        <span className="text-xs text-slate-400"> / {data.vehicles.total} active</span>
                    </div>
                    <div className="mt-2 w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: `${data.vehicles.percentage}%` }}></div>
                    </div>
                </div>

                {/* Shelters Utilization */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-slate-500">
                        <span className="text-xs font-medium">Shelter Spaces</span>
                        <Building2 className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="mt-2">
                        <span className="text-2xl font-extrabold text-slate-900">
                            {data.shelters.capacity - data.shelters.occupancy > 0 ? (data.shelters.capacity - data.shelters.occupancy).toLocaleString() : 0}
                        </span>
                        <span className="text-xs text-slate-400"> beds vacant</span>
                    </div>
                    <div className="mt-2 w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${data.shelters.percentage}%` }}></div>
                    </div>
                </div>

                {/* Warehouse Stocks */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-slate-500">
                        <span className="text-xs font-medium">Supply Depots</span>
                        <Boxes className="w-4 h-4 text-cyan-500" />
                    </div>
                    <div className="mt-2">
                        <span className="text-2xl font-extrabold text-slate-900">{data.warehouses?.total || 0}</span>
                        <span className="text-xs text-slate-400"> inventory nodes</span>
                    </div>
                    <div className="mt-2 w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                        <div className="bg-cyan-500 h-full rounded-full" style={{ width: "100%" }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AvailabilityWidget;
