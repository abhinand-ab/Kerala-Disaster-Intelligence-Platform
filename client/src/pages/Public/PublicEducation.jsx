import { useState } from "react";
import {
    BookOpen,
    Waves,
    Mountain,
    Wind,
    HeartHandshake,
    Briefcase,
    CheckSquare,
    LogOut,
    Eye,
    Shield
} from "lucide-react";

const guides = [
    {
        id: "flood",
        title: "Flood Safety",
        icon: Waves,
        color: "text-blue-400 bg-blue-500/10",
        steps: [
            "Monitor local news channels or radio warnings for flood indexes.",
            "Turn off main gas switches and electric mains immediately.",
            "Evacuate towards concrete multi-story buildings or designated high shelters.",
            "Do not walk or drive through flowing water streams. Just 6 inches of water can knock you down.",
            "Keep clean drinking water sealed in bottles to avoid contamination vector infections."
        ]
    },
    {
        id: "landslide",
        title: "Landslide Guides",
        icon: Mountain,
        color: "text-amber-500 bg-amber-500/10",
        steps: [
            "Check for tilted trees, cracked walls or new soil bulges in hillside terrains.",
            "Listen for high mountain rumble noises that signify debris torrents.",
            "Get out of path of landslide or mudflow. Evacuate valleys immediately.",
            "If stuck or unable to escape, curl into a tight ball and protect your head.",
            "Report land slides immediately to local district controls."
        ]
    },
    {
        id: "cyclone",
        title: "Cyclone Prep",
        icon: Wind,
        color: "text-indigo-400 bg-indigo-500/10",
        steps: [
            "Board up glass windows and secure lose outdoor objects.",
            "Keep emergency flashlight and secondary cell phone batteries fully charged.",
            "Identify internal windowless rooms in your house to stay in.",
            "Remain inside until civil engineers announce weather clearance.",
            "Avoid touch lines of hanging electric wires."
        ]
    },
    {
        id: "firstaid",
        title: "First Aid Basics",
        icon: HeartHandshake,
        color: "text-rose-500 bg-rose-500/10",
        steps: [
            "Control bleedings by applying firm, direct pressure on wounds.",
            "Flush superficial burns with cold water for 10 minutes. Do not apply ice.",
            "Immobilize suspected bone fractures. Avoid moving the spine.",
            "Check breathing and perform chest compressions (CPR) if certified.",
            "Wash muddy wounds immediately with antiseptic fluid to prevent tetanus."
        ]
    },
    {
        id: "kit",
        title: "Family Survival Kit",
        icon: Briefcase,
        color: "text-teal-400 bg-teal-500/10",
        steps: [
            "Dry food resources (canned beans, biscuits, nuts) to last 3 days.",
            "Potable clean water cylinders (at least 3 liters per person per day).",
            "Functional flashlight with multiple reserve batteries.",
            "Portable pocket AM/FM radio receiver.",
            "Basic medications, waterproof bandages, and sanitizers."
        ]
    },
    {
        id: "checklist",
        title: "Emergency Checklist",
        icon: CheckSquare,
        color: "text-emerald-400 bg-emerald-500/10",
        hasCheckboxes: true,
        steps: [
            "Verify all family identification papers are sealed in a plastic folder.",
            "Locate coordinates of the closest two shelters in your town.",
            "Agree on a meeting point if family members get separated.",
            "Backup critical phone numbers on a physical note.",
            "Secure heavy cupboards to the walls to prevent tip-overs."
        ]
    },
    {
        id: "evacuation",
        title: "Evacuation Steps",
        icon: LogOut,
        color: "text-pink-400 bg-pink-500/10",
        steps: [
            "Lock all doors and windows before exiting.",
            "Carry your designated Family Emergency Kit and essential documentation.",
            "Observe warning signs on evacuation paths. Do not take shortcuts.",
            "Register your arrival details with relief camp coordinators immediately.",
            "Do not return to hazarded areas until official agency approvals."
        ]
    }
];

const PublicEducation = () => {
    const [activeTab, setActiveTab] = useState("flood");

    // Interactive checked state for checklists
    const [checkedItems, setCheckedItems] = useState({});

    const activeGuide = guides.find(g => g.id === activeTab) || guides[0];

    const toggleChecked = (idx) => {
        setCheckedItems(prev => ({
            ...prev,
            [`${activeTab}_${idx}`]: !prev[`${activeTab}_${idx}`]
        }));
    };

    return (
        <div className="space-y-6 pb-12">

            {/* Header */}
            <div className="border-b border-slate-800 pb-4">
                <h1 className="text-2xl font-black text-white flex items-center gap-2">
                    <BookOpen className="text-cyan-400 w-6 h-6" /> Disaster Preparedness Guides
                </h1>
                <p className="text-xs text-slate-400 font-medium">Citizen response manuals, immediate home evacuation checklists, and first aid tips.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Tabs navigation */}
                <div className="lg:col-span-4 flex flex-col gap-2">
                    {guides.map(g => {
                        const Icon = g.icon;
                        const isActive = activeTab === g.id;
                        return (
                            <button
                                key={g.id}
                                onClick={() => setActiveTab(g.id)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition border text-left ${isActive
                                        ? "bg-slate-900 border-slate-700 text-white shadow-xl"
                                        : "bg-slate-950/25 border-slate-900 text-slate-450 hover:bg-slate-900/40 hover:text-white"
                                    }`}
                            >
                                <div className={`p-2 rounded-lg ${g.color}`}>
                                    <Icon size={16} />
                                </div>
                                <span>{g.title}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Guide content area */}
                <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative">
                    <div className="absolute top-6 right-6 p-2 bg-slate-950/40 border border-slate-800 rounded-xl text-slate-500">
                        <Shield className="w-5 h-5" />
                    </div>

                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block">Operational Manual</span>
                        <h2 className="text-xl font-extrabold text-white">{activeGuide.title} Instructions</h2>
                    </div>

                    <div className="space-y-4 pt-2">
                        {activeGuide.steps.map((step, idx) => {
                            const isCheckedKey = `${activeTab}_${idx}`;
                            const isChecked = !!checkedItems[isCheckedKey];

                            return (
                                <div
                                    key={idx}
                                    onClick={() => activeGuide.hasCheckboxes && toggleChecked(idx)}
                                    className={`p-4 bg-slate-950/40 border border-slate-850 rounded-2xl flex items-start gap-3 transition-colors ${activeGuide.hasCheckboxes ? "cursor-pointer hover:bg-slate-950" : ""
                                        }`}
                                >
                                    {activeGuide.hasCheckboxes ? (
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => { }} // handled by click container
                                            className="mt-1 h-4 w-4 rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900 focus:ring-2 accent-cyan-500"
                                        />
                                    ) : (
                                        <div className="h-6 w-6 shrink-0 rounded-full bg-cyan-550/15 border border-cyan-500/30 flex items-center justify-center text-xs font-bold text-cyan-400">
                                            {idx + 1}
                                        </div>
                                    )}

                                    <p className={`text-xs text-slate-350 leading-relaxed font-sans font-medium transition ${isChecked ? "line-through text-slate-600" : ""
                                        }`}>
                                        {step}
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    {activeGuide.hasCheckboxes && (
                        <div className="text-[11px] text-slate-550 text-right italic pt-2">
                            Select items to mark completed as you pack your home kit.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PublicEducation;
