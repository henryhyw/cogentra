import { Bell, FolderOpen, Settings } from "lucide-react";
import { NavLink } from "react-router-dom";
import { reviewerUser } from "../data/mock";
import { cn } from "../lib/cn";
import Avatar from "./Avatar";

const navItems = [
  { label: "Assignments", to: "/assignments", icon: FolderOpen },
  { label: "Notifications", to: "/notifications", icon: Bell },
  { label: "Settings", to: "/settings", icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="flex min-h-screen flex-col border-r border-line bg-paper px-5 py-5">
      <div className="flex items-center gap-3 pb-10">
        <span className="h-2.5 w-2.5 rounded-sm2 bg-forest" />
        <span className="font-serif text-22 text-ink">Congentra</span>
      </div>
      <div className="space-y-4">
        <p className="text-12 uppercase tracking-widest text-mute">Workspace</p>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              className={({ isActive }) =>
                cn(
                  "relative flex h-9 items-center gap-3 rounded-md2 pl-2 pr-3 text-14 text-ink2 transition-colors duration-150 ease-out hover:bg-hover",
                  isActive && "bg-hover font-medium text-ink",
                )
              }
              key={item.to}
              to={item.to}
            >
              {({ isActive }) => (
                <>
                  {isActive ? <span className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-forest" /> : null}
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="mt-auto">
        <button
          className="flex w-full items-center gap-3 rounded-md2 p-2 text-left transition-colors duration-150 ease-out hover:bg-hover"
          type="button"
        >
          <Avatar name={reviewerUser.name} size={28} />
          <div className="min-w-0">
            <p className="truncate text-13 font-medium text-ink">{reviewerUser.name}</p>
            <p className="truncate text-12 text-mute">{reviewerUser.email}</p>
          </div>
        </button>
      </div>
    </aside>
  );
}
