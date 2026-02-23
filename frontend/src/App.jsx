import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import AuthContext, { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminAnalytics from './pages/admin/Analytics';
import ZoneManagement from './pages/admin/ZoneManagement';
import WorkerManagement from './pages/admin/WorkerManagement';
import Profile from './pages/Profile';

// Worker Pages
import WorkerDashboard from './pages/worker/WorkerDashboard';
import WorkerTaskDetails from './pages/worker/TaskDetails';
import WorkHistory from './pages/worker/WorkHistory';

// Citizen Pages
import CitizenHome from './pages/citizen/CitizenHome';
import RaiseComplaint from './pages/citizen/RaiseComplaint';
import SchedulePickup from './pages/citizen/SchedulePickup';
import MyRequests from './pages/citizen/MyRequests';
import TrackStatus from './pages/citizen/TrackStatus';
import Notifications from './pages/citizen/Notifications';
import ReportProblem from './pages/citizen/ReportProblem';

// Public Pages
import LandingPage from './pages/LandingPage';

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Admin Routes */}
          <Route path="/admin" element={
            <PrivateRoute roles={['admin']}>
              <AdminDashboard />
            </PrivateRoute>
          } />
          <Route path="/admin/analytics" element={
            <PrivateRoute roles={['admin']}>
              <AdminAnalytics />
            </PrivateRoute>
          } />
          <Route path="/admin/zones" element={
            <PrivateRoute roles={['admin']}>
              <ZoneManagement />
            </PrivateRoute>
          } />
          <Route path="/admin/workers" element={
            <PrivateRoute roles={['admin']}>
              <WorkerManagement />
            </PrivateRoute>
          } />
          <Route path="/admin/profile" element={
            <PrivateRoute roles={['admin']}>
              <Profile />
            </PrivateRoute>
          } />

          <Route path="/worker" element={
            <PrivateRoute roles={['worker']}>
              <WorkerDashboard />
            </PrivateRoute>
          } />
          <Route path="/worker/task/:id" element={
            <PrivateRoute roles={['worker']}>
              <WorkerTaskDetails />
            </PrivateRoute>
          } />
          <Route path="/worker/profile" element={
            <PrivateRoute roles={['worker']}>
              <Profile />
            </PrivateRoute>
          } />
          <Route path="/worker/history" element={
            <PrivateRoute roles={['worker']}>
              <WorkHistory />
            </PrivateRoute>
          } />

          {/* Citizen Routes */}
          <Route path="/citizen" element={
            <PrivateRoute roles={['citizen']}>
              <CitizenHome />
            </PrivateRoute>
          } />
          <Route path="/citizen/raise-complaint" element={
            <PrivateRoute roles={['citizen']}>
              <RaiseComplaint />
            </PrivateRoute>
          } />
          <Route path="/citizen/report-problem" element={
            <PrivateRoute roles={['citizen']}>
              <ReportProblem />
            </PrivateRoute>
          } />
          <Route path="/citizen/schedule-pickup" element={
            <PrivateRoute roles={['citizen']}>
              <SchedulePickup />
            </PrivateRoute>
          } />
          <Route path="/citizen/my-requests" element={
            <PrivateRoute roles={['citizen']}>
              <MyRequests />
            </PrivateRoute>
          } />
          <Route path="/citizen/track/:id" element={
            <PrivateRoute roles={['citizen']}>
              <TrackStatus />
            </PrivateRoute>
          } />
          <Route path="/citizen/notifications" element={
            <PrivateRoute roles={['citizen']}>
              <Notifications />
            </PrivateRoute>
          } />
          <Route path="/citizen/profile" element={
            <PrivateRoute roles={['citizen']}>
              <Profile />
            </PrivateRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
