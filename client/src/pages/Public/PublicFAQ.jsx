import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { HelpCircle, ChevronDown, ChevronUp, Search, Info } from "lucide-react";
import { getFAQs } from "../../services/publicService";
import { toast } from "react-hot-toast";

const PublicFAQ = () => {
    const [searchParams] = useSearchParams();
    const [faqs, setFaqs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
    const [openIndex, setOpenIndex] = useState(null);

    useEffect(() => {
        const fetchFAQs = async () => {
            try {
                const data = await getFAQs();
                setFaqs(data || []);
            } catch (err) {
                console.error(err);
                toast.error("Failed to load FAQs data.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchFAQs();
    }, []);

    const toggleAccordion = (idx) => {
        setOpenIndex(openIndex === idx ? null : idx);
    };

    const filteredFAQs = faqs.filter(f => {
        return f.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
            f.answer.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <div className="space-y-6 pb-12 max-w-4xl mx-auto">

            {/* Header */}
            <div className="text-center space-y-2 border-b border-slate-800 pb-6">
                <div className="inline-flex p-3 bg-cyan-500/10 text-cyan-400 rounded-full mb-2">
                    <HelpCircle size={28} />
                </div>
                <h1 className="text-2xl font-black text-white">Frequently Asked Questions</h1>
                <p className="text-xs text-slate-400 max-w-md mx-auto">Verified answers relating to Kerala disaster alerts, shelter distributions and support networks.</p>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                    type="text"
                    placeholder="Search FAQ questions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-slate-900 border border-slate-800 focus:border-cyan-500 w-full pl-10 pr-3 py-2.5 rounded-xl text-xs outline-none text-white transition"
                />
            </div>

            {/* Accordion List */}
            {isLoading ? (
                <div className="py-12 text-center text-xs text-slate-500 animate-pulse">
                    Retrieving FAQs index...
                </div>
            ) : filteredFAQs.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500 border border-slate-850 bg-slate-950/20 rounded-2xl">
                    No FAQs match your search terms.
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredFAQs.map((faq, idx) => {
                        const isOpen = openIndex === idx;
                        return (
                            <div
                                key={idx}
                                className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden hover:border-slate-700 transition"
                            >
                                <button
                                    onClick={() => toggleAccordion(idx)}
                                    className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left text-xs font-bold text-white"
                                >
                                    <span>{faq.question}</span>
                                    {isOpen ? <ChevronUp size={16} className="text-cyan-400" /> : <ChevronDown size={16} className="text-slate-500" />}
                                </button>

                                {isOpen && (
                                    <div className="px-5 pb-4 border-t border-slate-850/80 pt-3 bg-slate-950/20 animate-slide-down">
                                        <p className="text-xs text-slate-350 leading-relaxed font-sans font-medium">
                                            {faq.answer}
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default PublicFAQ;
