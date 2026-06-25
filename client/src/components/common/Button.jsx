const Button = ({
  children,
  onClick,
  type = "button",
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className="
      bg-blue-600
      hover:bg-blue-700
      text-white
      px-5
      py-2.5
      rounded-xl
      font-medium
      transition-all
      duration-200
      "
    >
      {children}
    </button>
  );
};

export default Button;