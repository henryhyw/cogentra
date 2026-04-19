import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function AppLayout() {
  return (
    <div className="grid min-h-screen grid-cols-[248px_minmax(0,1fr)] bg-paper">
      <Sidebar />
      <div className="min-w-0">
        <Topbar />
        <main className="min-h-[calc(100vh-56px)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
