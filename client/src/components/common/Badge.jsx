const colors = {
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
  info: "bg-blue-100 text-blue-700",
};

const Badge = ({ children, color = "info" }) => {
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[color]}`}
    >
      {children}
    </span>
  );
};

export default Badge;