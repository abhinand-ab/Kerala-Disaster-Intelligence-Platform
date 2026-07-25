import { useState, useEffect } from "react";
import { Phone, Search, MapPin, AlertCircle, PhoneCall, Heart } from "lucide-react";
import { getEmergencyContacts } from "../../services/publicService";
import { toast } from "react-hot-toast";

const PublicContacts = () => {
    const [contacts, setContacts] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchDistrict, setSearchDistrict] = useState("");

    useEffect(() => {
        const fetchContacts = async () => {
            try {
                const data = await getEmergencyContacts();
                setContacts(data || null);
            } catch (err) {
                console.error(err);
                toast.error("Failed to query emergency helpline phone numbers.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchContacts();
    }, []);

    // Filter district emergency helplines
    const filteredDistrictsList = contacts?.districtHelplines
        ? Object.entries(contacts.districtHelplines).filter(([district, info]) => {
            return district.toLowerCase().includes(searchDistrict.toLowerCase()) ||
                (info.phone && info.phone.includes(searchDistrict)) ||
                (info.alternate && info.alternate.includes(searchDistrict));
        })
        : [];

    return (
        <div className="space-y-8 pb-12">

            {/* Header */}
            <div className="border-b border-slate-800 pb-4">
                <h1 className="text-2xl font-black text-white flex items-center gap-2">
                    <Phone className="text-cyan-400 w-6 h-6 animate-pulse" /> Citizens Emergency Helpline Contacts
                </h1>
                <p className="text-xs text-slate-400 font-medium">Verified phone lines to reach state logistics coordination teams and district response centers instantly.</p>
            </div>

            {isLoading ? (
                <div className="py-20 text-center text-xs text-slate-500 animate-pulse">
                    Connecting to emergency contacts network...
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left: General Helplines */}
                    <div className="lg:col-span-5 space-y-6">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <Heart className="text-red-500 w-5 h-5" /> State Response Networks
                        </h2>

                        <div className="space-y-3">
                            {contacts?.generalHelplines && Object.entries(contacts.generalHelplines).map(([key, item]) => (
                                <div key={key} className="p-4 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl flex items-center justify-between transition gap-4">
                                    <div className="space-y-0.5">
                                        <h3 className="font-bold text-sm text-white">{item.name}</h3>
                                        <p className="text-xs text-slate-450">{item.desc || "State toll-free helpline number"}</p>
                                    </div>
                                    <a
                                        href={`tel:${item.phone}`}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-red-650 to-orange-650 hover:brightness-110 text-white rounded-xl text-xs font-bold transition shadow"
                                    >
                                        <PhoneCall size={12} /> {item.phone}
                                    </a>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 bg-amber-500/10 border border-amber-500/25 rounded-2xl text-xs text-amber-300 space-y-1.5 flex gap-2">
                            <AlertCircle size={28} className="shrink-0 mt-0.5" />
                            <div>
                                <strong className="block font-bold">Important Notice:</strong>
                                Keep your phone batteries saved. In heavy downpours, cell towers might go out format. Dial local control centers if state lines are busy.
                            </div>
                        </div>
                    </div>

                    {/* Right: District Control Centers */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <MapPin className="text-cyan-400 w-5 h-5" /> District Control Helpline Nodes
                            </h2>

                            {/* Search box for districts */}
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Search district helpline..."
                                    value={searchDistrict}
                                    onChange={(e) => setSearchDistrict(e.target.value)}
                                    className="bg-slate-950 border border-slate-800 focus:border-cyan-500 w-full pl-9 pr-3 py-2 rounded-xl text-xs outline-none text-white transition"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {filteredDistrictsList.length === 0 ? (
                                <div className="col-span-2 text-center py-12 text-xs text-slate-500">
                                    No district helpline matched your query.
                                </div>
                            ) : (
                                filteredDistrictsList.map(([district, info]) => (
                                    <div key={district} className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col justify-between gap-3">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block">District node</span>
                                            <h3 className="font-extrabold text-sm text-white">{district}</h3>
                                        </div>

                                        <div className="space-y-2">
                                            <a
                                                href={`tel:${info.phone}`}
                                                className="w-full flex items-center justify-center gap-1.5 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-xs font-bold text-slate-100 rounded-xl transition"
                                            >
                                                <Phone size={12} className="text-cyan-400" /> Dial: {info.phone}
                                            </a>

                                            {info.alternate && (
                                                <a
                                                    href={`tel:${info.alternate}`}
                                                    className="w-full flex items-center justify-center gap-1.5 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-xs font-bold text-slate-300 rounded-xl transition"
                                                >
                                                    <Phone size={12} className="text-slate-500" /> Alt: {info.alternate}
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PublicContacts;
