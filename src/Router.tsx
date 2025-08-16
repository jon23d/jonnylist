import { createHashRouter, RouterProvider } from 'react-router-dom';
import Layout from '@/components/Layout/Layout';
import HomePage from './pages/Home.page';
import ReportsDuePage from './pages/reports/due/index';
import ReportsInProgressPage from './pages/reports/in-progress/index';
import ReportsOpenProjectsPage from './pages/reports/open-projects/index';
import SettingsPage from './pages/settings/index';
import TasksPage from './pages/tasks/index';

const router = createHashRouter([
  {
    element: <Layout />,
    children: [
      {
        path: '/',
        index: true,
        element: <HomePage />,
      },
      {
        path: '/tasks',
        element: <TasksPage />,
      },
      {
        path: '/reports/due',
        element: <ReportsDuePage />,
      },
      {
        path: '/reports/in-progress',
        element: <ReportsInProgressPage />,
      },
      {
        path: '/reports/open-projects',
        element: <ReportsOpenProjectsPage />,
      },
      {
        path: '/settings',
        element: <SettingsPage />,
      },
    ],
  },
]);

export function Router() {
  return <RouterProvider router={router} />;
}
