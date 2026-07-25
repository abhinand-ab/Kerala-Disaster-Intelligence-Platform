import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const BackButton = ({ label = "Back" }) => {
    const navigate = useNavigate();
    return (
        <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
            <ArrowLeft size={16} />
            {label}
        </button>
    );
};

export default BackButton;
