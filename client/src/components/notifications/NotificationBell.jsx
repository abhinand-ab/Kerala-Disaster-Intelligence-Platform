import { Bell } from "lucide-react";
import useNotifications from "../../features/notifications/hooks/useNotifications.js";

const NotificationBell = ({ isOpen, setIsOpen }) => {
    const { unreadCount } = useNotifications();

    const handleClick = (e) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none"
            aria-label="Toggle notifications"
        >
            <Bell size={20} className={isOpen ? "text-blue-600" : "text-slate-500"} />

            {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white animate-[bounce_1s_infinite_1.5s]">
                    {unreadCount > 9 ? "9+" : unreadCount}
                </span>
            )}
        </button>
    );
};

export default NotificationBell;