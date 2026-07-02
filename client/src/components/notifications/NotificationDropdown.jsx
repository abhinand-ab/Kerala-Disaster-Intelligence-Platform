import { formatDistanceToNow } from "date-fns";
import {
	Bell,
	CheckCheck,
	Loader2,
	Trash2,
	X,
} from "lucide-react";
import useNotifications from "../../features/notifications/hooks/useNotifications.js";

const NotificationDropdown = ({ isOpen, setIsOpen }) => {
	const {
		notifications,
		isLoading,
		unreadCount,
		markAsRead,
		markAllAsRead,
		deleteNotification,
	} = useNotifications();

	if (!isOpen) {
		return null;
	}

	const handleClose = () => {
		setIsOpen(false);
	};

	return (
		<div className="absolute right-0 top-full z-50 mt-3 w-[22rem] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
			<div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
				<div>
					<h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
					{unreadCount > 0 && (
						<p className="mt-0.5 text-xs text-slate-500">
							{unreadCount} unread notification{unreadCount === 1 ? "" : "s"}
						</p>
					)}
				</div>

				<div className="flex items-center gap-2">
					{unreadCount > 0 && (
						<button
							type="button"
							onClick={() => markAllAsRead()}
							className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50"
						>
							<CheckCheck size={14} />
							Mark All Read
						</button>
					)}

					<button
						type="button"
						onClick={handleClose}
						className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
						aria-label="Close notifications"
					>
						<X size={16} />
					</button>
				</div>
			</div>

			<div className="max-h-[28rem] overflow-y-auto">
				{isLoading ? (
					<div className="flex items-center justify-center px-4 py-10 text-slate-500">
						<Loader2 className="animate-spin" size={22} />
					</div>
				) : notifications.length === 0 ? (
					<div className="flex flex-col items-center justify-center px-6 py-12 text-center">
						<div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
							<Bell size={22} />
						</div>
						<p className="text-sm font-medium text-slate-900">No notifications yet</p>
						<p className="mt-1 text-xs text-slate-500">You will see updates here when something changes.</p>
					</div>
				) : (
					<div className="divide-y divide-slate-100">
						{notifications.map((notification) => {
							const isUnread = !notification.isRead;

							return (
								<div
									key={notification._id}
									className={`px-4 py-4 transition-colors ${
										isUnread ? "bg-blue-50/60" : "bg-white"
									}`}
								>
									<div className="flex gap-3">
										{isUnread && (
											<span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500" />
										)}

										<div className="min-w-0 flex-1">
											<div className="flex items-start justify-between gap-3">
												<div className="min-w-0 flex-1">
													<h4 className="truncate text-sm font-semibold text-slate-900">
														{notification.title}
													</h4>
													<p className="mt-1 text-sm leading-6 text-slate-600">
														{notification.message}
													</p>
												</div>

												<div className="flex shrink-0 items-center gap-1">
													{isUnread && (
														<button
															type="button"
															onClick={() => markAsRead(notification._id)}
															className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100"
														>
															Mark as Read
														</button>
													)}

													<button
														type="button"
														onClick={() => deleteNotification(notification._id)}
														className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
														aria-label="Delete notification"
													>
														<Trash2 size={14} />
													</button>
												</div>
											</div>

											</div>

										<div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-500">
											<span>
												{formatDistanceToNow(new Date(notification.createdAt), {
													addSuffix: true,
												})}
											</span>
											<span className="rounded-full bg-slate-100 px-2 py-1 capitalize text-slate-500">
												{notification.type}
											</span>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
};

export default NotificationDropdown;
