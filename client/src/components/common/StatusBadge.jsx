const statusStyles = {
	Pending: "bg-yellow-100 text-yellow-700",
	Assigned: "bg-blue-100 text-blue-700",
	"In Progress": "bg-purple-100 text-purple-700",
	Resolved: "bg-green-100 text-green-700",
};

const StatusBadge = ({ status }) => {
	const badgeStyle = statusStyles[status] || "bg-gray-100 text-gray-600";

	return (
		<span className={`rounded-full px-3 py-1 text-xs font-medium ${badgeStyle}`}>
			{status}
		</span>
	);
};

export default StatusBadge;
