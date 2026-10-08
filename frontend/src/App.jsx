import { lazy, Suspense } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { useAuth } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import AppShell from './components/AppShell.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

const Home = lazy(() => import('./pages/Home.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const CameraTask = lazy(() => import('./pages/CameraTask.jsx'));
const HazardMap = lazy(() => import('./pages/HazardMap.jsx'));
const HazardReport = lazy(() => import('./pages/HazardReport.jsx'));
const VolunteerPage = lazy(() => import('./pages/VolunteerPage.jsx'));
const CallRoom = lazy(() => import('./pages/CallRoom.jsx'));
const NavigationPage = lazy(() => import('./pages/NavigationPage.jsx'));
const KnowledgePage = lazy(() => import('./pages/KnowledgePage.jsx'));
const TrustedContactsPage = lazy(() => import('./pages/SosPage.jsx'));
const SosPage = lazy(() => import('./pages/SosPage.jsx').then((module) => ({ default: module.SosPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage.jsx'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage.jsx'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard.jsx'));
const LoginPage = lazy(() => import('./pages/AuthPages.jsx').then((module) => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import('./pages/AuthPages.jsx').then((module) => ({ default: module.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('./pages/AuthPages.jsx').then((module) => ({ default: module.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/AuthPages.jsx').then((module) => ({ default: module.ResetPasswordPage })));

function SocketApp() {
  return <SocketProvider><AppShell /></SocketProvider>;
}

function RoleDashboard() {
  const { user } = useAuth();
  return user?.role === 'VOLUNTEER' ? <VolunteerPage /> : <Dashboard />;
}

function NotFound() {
  return <main className="not-found"><div className="brand-mark" aria-hidden="true"><Eye size={22} /></div><h1>We couldn't find that page.</h1><p>Let's get you back to a familiar place.</p><Link className="button button-dark" to="/app">Go to your BALA space</Link></main>;
}

export default function App() {
  return (
    <Suspense fallback={<main className="loading-screen" aria-live="polite">Loading your BALA space…</main>}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<SocketApp />}>
            <Route path="/app" element={<RoleDashboard />} />
            <Route path="/app/scene" element={<CameraTask type="scene" />} />
            <Route path="/app/obstacles" element={<CameraTask type="obstacles" />} />
            <Route path="/app/document" element={<CameraTask type="document" />} />
            <Route path="/app/currency" element={<CameraTask type="currency" />} />
            <Route path="/app/volunteers" element={<VolunteerPage />} />
            <Route path="/app/calls/:id" element={<CallRoom />} />
            <Route path="/app/map" element={<HazardMap />} />
            <Route path="/app/hazards" element={<HazardReport />} />
            <Route path="/app/navigation" element={<NavigationPage />} />
            <Route path="/app/learn" element={<KnowledgePage />} />
            <Route path="/app/sos" element={<SosPage />} />
            <Route path="/app/contacts" element={<TrustedContactsPage />} />
            <Route path="/app/notifications" element={<NotificationsPage />} />
            <Route path="/app/settings" element={<SettingsPage />} />
            <Route element={<ProtectedRoute roles={['ADMIN']} />}>
              <Route path="/app/admin" element={<AdminDashboard />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
