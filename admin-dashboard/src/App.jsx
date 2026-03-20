import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { useAuthStore } from './lib/store';
import Layout from './components/Dashboard/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PipelinePage from './pages/PipelinePage';
import ClientDetailPage from './pages/ClientDetailPage';
import CalendarPage from './pages/CalendarPage';
import TasksPage from './pages/TasksPage';
import FinancePage from './pages/FinancePage';
import AgentsPage from './pages/AgentsPage';
import PortalsPage from './pages/PortalsPage';
import PortalEditorPage from './pages/PortalEditorPage';

const queryClient = new QueryClient();

function ProtectedRoute({ children }) {
  const token = useAuthStore(s => s.token);
  return token ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="pipeline" element={<PipelinePage />} />
            <Route path="clients/:id" element={<ClientDetailPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="finance" element={<FinancePage />} />
            <Route path="agents" element={<AgentsPage />} />
            <Route path="portals" element={<PortalsPage />} />
            <Route path="portals/:portalId/edit" element={<PortalEditorPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
