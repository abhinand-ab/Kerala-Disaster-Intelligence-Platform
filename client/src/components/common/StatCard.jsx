import Card from "./Card";

const StatCard = ({
  title,
  value,
  icon,
  color,
  subtitle,
}) => {
  return (
    <Card className="hover:shadow-lg transition-all duration-300">

      <div className="flex justify-between items-center">

        <div>

          <p className="text-slate-500 text-sm">
            {title}
          </p>

          <h2 className="text-4xl font-bold mt-2">
            {value}
          </h2>

          <p className="mt-3 text-sm text-slate-400">
            {subtitle}
          </p>

        </div>

        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color}`}
        >
          {icon}
        </div>

      </div>

    </Card>
  );
};

export default StatCard;