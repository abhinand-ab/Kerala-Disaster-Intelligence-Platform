import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, Loader2, Trash2, X } from "lucide-react";
import useNotifications from "../../features/notifications/hooks/useNotifications.js";

const NotificationDropdown = ({ isOpen, setIsOpen }) => {
	const navigate = useNavigate();
	const { notifications, isLoading, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

	if (!isOpen) return null;

	const handleClose = () => setIsOpen(false);

	const handleNotificationClick = async (notif, e) => {
		if (e.target.closest("button")) return;
		if (!notif.isRead) {
			try { await markAsRead(notif._id); } catch (err) { console.error("Failed to mark as read on click:", err); }
		}
		setIsOpen(false);
		const msgLower = (notif.message || "").toLowerCase();
		const titleLower = (notif.title || "").toLowerCase();
		if (notif.incident) navigate("/incidents");
		else if (msgLower.includes("vehicle") || titleLower.includes("vehicle")) navigate("/vehicles");
		else if (msgLower.includes("shelter")) navigate("/shelters");
		else if (msgLower.includes("rescue team") || titleLower.includes("rescue team")) navigate("/rescue-teams");
		else if (msgLower.includes("volunteer")) navigate("/volunteers");
		else if (msgLower.includes("delivery") || msgLower.includes("dispatch")) navigate("/delivery");
		else if (msgLower.includes("resource") || msgLower.includes("supply")) navigate("/resources");
		else if (notif.type === "incident") navigate("/incidents");
		else if (notif.type === "assignment") navigate("/volunteers");
		else navigate("/");
	};

	const handleMarkSingleRead = async (id, e) => { e.stopPropagation(); try { await markAsRead(id); } catch (err) { console.error(err); } };
	const handleDeleteSingle = async (id, e) => { e.stopPropagation(); try { await deleteNotification(id); } catch (err) { console.error(err); } };

	return (
		<div className="absolute right-0 top-full z-50 mt-3 w-[24rem] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in slide-in-from-top-1 duration-100">
			{/* Header */}
			<div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50/50">
				<div>
					<h3 className="text-sm font-semibold text-slate-900">Live Notifications</h3>
					{unreadCount > 0 && (
						<p className="mt-0.5 text-xs text-slate-500">
							{unreadCount} unread notification{unreadCount === 1 ? "" : "s"}
						</p>
					)}
				</div>
				<div className="flex items-center gap-2">
					{unreadCount > 0 && (
						<button type="button" onClick={() => markAllAsRead()} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-cyan-600 transition-colors hover:bg-cyan-50">
							<CheckCheck size={14} /> Mark All Read
						</button>
					)}
					<button type="button" onClick={handleClose} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700" aria-label="Close notifications">
						<X size={16} />
					</button>
				</div>
			</div>

			{/* Body */}
			<div className="max-h-[28rem] overflow-y-auto divide-y divide-slate-100">
				{isLoading ? (
					<div className="flex items-center justify-center px-4 py-10 text-slate-500">
						<Loader2 className="animate-spin text-cyan-500" size={22} />
					</div>
				) : notifications.length === 0 ? (
					<div className="flex flex-col items-center justify-center px-6 py-12 text-center">
						<div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
							<Bell size={22} />
						</div>
						<p className="text-sm font-medium text-slate-700">No notifications yet</p>
						<p className="mt-1 text-xs text-slate-500">You will see live updates here when operations change.</p>
					</div>
				) : (
					notifications.map((notification) => {
						const isUnread = !notification.isRead;
						return (
							<div
								key={notification._id}
								onClick={(e) => handleNotificationClick(notification, e)}
								className={`group flex gap-3 px-4 py-3.5 transition-colors cursor-pointer hover:bg-slate-50/70 ${isUnread ? "bg-blue-50/40" : "bg-white"}`}
							>
								<div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-cyan-500 opacity-90 transition-transform group-hover:scale-125" style={{ visibility: isUnread ? "visible" : "hidden" }} />
								<div className="min-w-0 flex-1">
									<div className="flex items-start justify-between gap-3">
										<div className="min-w-0 flex-1">
											<h4 className="text-sm font-semibold text-slate-900 group-hover:text-cyan-700 transition-colors">
												{notification.title}
											</h4>
											<p className="mt-1.5 text-xs leading-normal text-slate-500">
												{notification.message}
											</p>
										</div>
										<div className="flex shrink-0 items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
											{isUnread && (
												<button type="button" onClick={(e) => handleMarkSingleRead(notification._id, e)} className="rounded-lg px-2 py-1 text-[10px] font-bold bg-cyan-50 text-cyan-600 transition-colors hover:bg-cyan-100">
													Read
												</button>
											)}
											<button type="button" onClick={(e) => handleDeleteSingle(notification._id, e)} className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600" aria-label="Delete notification">
												<Trash2 size={13} />
											</button>
										</div>
									</div>
									<div className="mt-2.5 flex items-center justify-between gap-2 text-[10px] text-slate-400 font-medium">
										<span>{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</span>
										<span className="rounded-full bg-slate-100 px-2 py-0.5 capitalize font-semibold tracking-wider text-[9px] text-slate-500">
											{notification.type}
										</span>
									</div>
								</div>
							</div>
						);
					})
				)}
			</div>
		</div>
	);
};

export default NotificationDropdown;
