import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from 'sonner';
import '@/App.css';

import AppLayout from './components/layout/AppLayout';

// Lazy-loaded pages
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/student/Dashboard'));
const Assignments = lazy(() => import('./pages/student/Assignments'));
const Attendance = lazy(() => import('./pages/student/Attendance'));
const Results = lazy(() => import('./pages/student/Results'));
const DPP = lazy(() => import('./pages/student/DPP'));
const Leaderboard = lazy(() => import('./pages/student/Leaderboard'));
const TodoList = lazy(() => import('./pages/student/TodoList'));
const Profile = lazy(() => import('./pages/student/Profile'));
const Timeline = lazy(() => import('./pages/student/Timeline'));
const Studycast = lazy(() => import('./pages/student/Studycast'));
const Payments = lazy(() => import('./pages/student/Payments'));
const Chat = lazy(() => import('./pages/student/Chat'));
const AICompanion = lazy(() => import('./pages/student/AICompanion'));
const LearningCompass = lazy(() => import('./pages/student/LearningCompass'));
const TeacherDashboard = lazy(() => import('./pages/teacher/TeacherDashboard'));
const AssignmentManager = lazy(() => import('./pages/teacher/AssignmentManager'));
const TeacherAttendance = lazy(() => import('./pages/teacher/TeacherAttendance'));

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#080c17] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 animate-pulse" />
        <p className="text-slate-400 text-sm font-mono">Loading workspace...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children, allowedRoles = null, redirectTo = '/login' }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (Array.isArray(allowedRoles) && !allowedRoles.includes(user.role)) {
    return <Navigate to={redirectTo} replace />;
  }
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.role === 'teacher' ? '/teacher/dashboard' : '/dashboard'} replace /> : <Suspense fallback={<LoadingScreen />}><Login /></Suspense>} />

      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Suspense fallback={<LoadingScreen />}><Dashboard /></Suspense>} />
        <Route
          path="/assignments"
          element={
            <ProtectedRoute allowedRoles={['student']} redirectTo="/teacher/assignments">
              <Suspense fallback={<LoadingScreen />}><Assignments /></Suspense>
            </ProtectedRoute>
          }
        />
        <Route path="/attendance" element={<Suspense fallback={<LoadingScreen />}><Attendance /></Suspense>} />
        <Route path="/results" element={<Suspense fallback={<LoadingScreen />}><Results /></Suspense>} />
        <Route path="/dpp" element={<Suspense fallback={<LoadingScreen />}><DPP /></Suspense>} />
        <Route path="/leaderboard" element={<Suspense fallback={<LoadingScreen />}><Leaderboard /></Suspense>} />
        <Route path="/todos" element={<Suspense fallback={<LoadingScreen />}><TodoList /></Suspense>} />
        <Route path="/profile" element={<Suspense fallback={<LoadingScreen />}><Profile /></Suspense>} />
        <Route path="/timeline" element={<Suspense fallback={<LoadingScreen />}><Timeline /></Suspense>} />
        <Route path="/studycast" element={<Suspense fallback={<LoadingScreen />}><Studycast /></Suspense>} />
        <Route path="/payments" element={<Suspense fallback={<LoadingScreen />}><Payments /></Suspense>} />
        <Route path="/chat" element={<Suspense fallback={<LoadingScreen />}><Chat /></Suspense>} />
        <Route path="/ai-companion" element={<Suspense fallback={<LoadingScreen />}><AICompanion /></Suspense>} />
        <Route path="/learning-compass" element={<Suspense fallback={<LoadingScreen />}><LearningCompass /></Suspense>} />

        {/* Teacher routes */}
        <Route
          path="/teacher/dashboard"
          element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']} redirectTo="/dashboard">
              <Suspense fallback={<LoadingScreen />}><TeacherDashboard /></Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/assignments"
          element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']} redirectTo="/dashboard">
              <Suspense fallback={<LoadingScreen />}><AssignmentManager /></Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/attendance"
          element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']} redirectTo="/dashboard">
              <Suspense fallback={<LoadingScreen />}><TeacherAttendance /></Suspense>
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'rgba(15, 22, 40, 0.94)',
                border: '1px solid rgba(148, 163, 184, 0.18)',
                color: '#f8fafc',
                backdropFilter: 'blur(12px)',
              },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </MotionConfig>
  );
}

export default App;
