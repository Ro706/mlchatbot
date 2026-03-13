import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/authContext";
import LandingPage from "./pages/LandingPage";
import AIAssistantPage from "./pages/AIAssistantPage";
import PublicComplaintPage from "./pages/PublicComplaintPage";
import TrackComplaintPage from "./pages/TrackComplaintPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ComplaintsListPage from "./pages/ComplaintsListPage";
import ComplaintDetailPage from "./pages/ComplaintDetailPage";
import NewComplaintPage from "./pages/NewComplaintPage";
import ClustersPage from "./pages/ClustersPage";
import KnowledgeGraphPage from "./pages/KnowledgeGraphPage";
import IntelligencePage from "./pages/IntelligencePage";
import AnomalyDetectionPage from "./pages/AnomalyDetectionPage";
import IncidentCommanderPage from "./pages/IncidentCommanderPage";
import AppLayout from "./components/AppLayout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  return <AppLayout>{children}</AppLayout>;
};

const AdminLoginRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">Loading...</div>;
  if (isAuthenticated) return <Navigate to="/admin/dashboard" replace />;
  return <LoginPage />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/ai-assistant" element={<AIAssistantPage />} />
            <Route path="/raise-complaint" element={<PublicComplaintPage />} />
            <Route path="/track-complaint" element={<TrackComplaintPage />} />
            <Route path="/admin/login" element={<AdminLoginRoute />} />

            {/* Admin protected routes */}
            <Route path="/admin/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/admin/complaints" element={<ProtectedRoute><ComplaintsListPage /></ProtectedRoute>} />
            <Route path="/admin/complaints/new" element={<ProtectedRoute><NewComplaintPage /></ProtectedRoute>} />
            <Route path="/admin/complaints/:id" element={<ProtectedRoute><ComplaintDetailPage /></ProtectedRoute>} />
            <Route path="/admin/clusters" element={<ProtectedRoute><ClustersPage /></ProtectedRoute>} />
            <Route path="/admin/anomalies" element={<ProtectedRoute><AnomalyDetectionPage /></ProtectedRoute>} />
            <Route path="/admin/knowledge-graph" element={<ProtectedRoute><KnowledgeGraphPage /></ProtectedRoute>} />
            <Route path="/admin/intelligence" element={<ProtectedRoute><IntelligencePage /></ProtectedRoute>} />
            <Route path="/admin/incident-commander" element={<ProtectedRoute><IncidentCommanderPage /></ProtectedRoute>} />

            {/* Redirects for old routes */}
            <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/complaints" element={<Navigate to="/admin/complaints" replace />} />
            <Route path="/complaints/:id" element={<Navigate to="/admin/complaints/:id" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
