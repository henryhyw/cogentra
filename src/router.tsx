import { Navigate, createBrowserRouter } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import MinimalLayout from "./layouts/MinimalLayout";
import StudentLayout from "./layouts/StudentLayout";
import AssignmentWorkspace from "./pages/AssignmentWorkspace";
import Assignments from "./pages/Assignments";
import CaseResult from "./pages/CaseResult";
import CreateAssignment from "./pages/CreateAssignment";
import Login from "./pages/Login";
import Notifications from "./pages/Notifications";
import SessionComplete from "./pages/SessionComplete";
import Settings from "./pages/Settings";
import StudentSession from "./pages/StudentSession";
import Cases from "./pages/assignment/Cases";
import Goals from "./pages/assignment/Goals";
import Materials from "./pages/assignment/Materials";
import Overview from "./pages/assignment/Overview";
import SessionSettings from "./pages/assignment/SessionSettings";
import Submissions from "./pages/assignment/Submissions";
import Understanding from "./pages/assignment/Understanding";

export const router = createBrowserRouter([
  {
    element: <MinimalLayout />,
    children: [{ path: "/login", element: <Login /> }],
  },
  {
    element: <StudentLayout />,
    children: [
      { path: "/s/:token", element: <StudentSession /> },
      { path: "/s/:token/complete", element: <SessionComplete /> },
    ],
  },
  {
    element: <AppLayout />,
    children: [
      { path: "/", element: <Navigate replace to="/assignments" /> },
      { path: "/assignments", element: <Assignments /> },
      { path: "/assignments/new", element: <CreateAssignment /> },
      {
        path: "/assignments/:id",
        element: <AssignmentWorkspace />,
        children: [
          { index: true, element: <Overview /> },
          { path: "materials", element: <Materials /> },
          { path: "understanding", element: <Understanding /> },
          { path: "goals", element: <Goals /> },
          { path: "session-settings", element: <SessionSettings /> },
          { path: "submissions", element: <Submissions /> },
          { path: "cases", element: <Cases /> },
        ],
      },
      { path: "/assignments/:id/cases/:caseId", element: <CaseResult /> },
      { path: "/notifications", element: <Notifications /> },
      { path: "/settings", element: <Settings /> },
    ],
  },
]);
