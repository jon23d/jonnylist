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
        handle: {
          title: 'Home',
        },
      },
      {
        path: '/tasks',
        element: <TasksPage />,
        handle: {
          title: 'Tasks',
        },
      },
      {
        path: '/reports/due',
        element: <ReportsDuePage />,
        handle: {
          title: 'Due Tasks Report',
        },
      },
      {
        path: '/reports/in-progress',
        element: <ReportsInProgressPage />,
        handle: {
          title: 'In Progress Report',
        },
      },
      {
        path: '/reports/open-projects',
        element: <ReportsOpenProjectsPage />,
        handle: {
          title: 'Open Projects Report',
        },
      },
      {
        path: '/settings',
        element: <SettingsPage />,
        handle: {
          title: 'Settings',
        },
      },
    ],
  },
]);

export function Router() {
  return <RouterProvider router={router} />;
}
