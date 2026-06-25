import { Bell, Search, UserCircle2 } from "lucide-react";

const Navbar = () => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      {/* Logo */}
      <div>
        <h1 className="text-2xl font-bold text-blue-600">
         🛡️ Kerala Disaster Intelligence
        </h1>
      </div>

      {/* Search */}
      <div className="hidden md:flex items-center bg-slate-100 rounded-xl px-4 py-2 w-96">
        <Search size={18} className="text-slate-500" />
        <input
          type="text"
          placeholder="Search..."
          className="bg-transparent outline-none ml-3 w-full"
        />
      </div>

      {/* Right */}
      <div className="flex items-center gap-5">
        <Bell className="cursor-pointer text-slate-600" />

        <UserCircle2
          size={34}
          className="text-blue-600 cursor-pointer"
        />
      </div>
    </header>
  );
};

export default Navbar;