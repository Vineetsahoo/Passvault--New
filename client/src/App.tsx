import React, { useState, useEffect, ErrorInfo } from 'react';
import { Navigate, createBrowserRouter, RouterProvider } from 'react-router-dom';
import Home from './pages/Home';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import Dashboard from './components/Dashboard';
import Features from './pages/Features';
import HowItWorks from './pages/HowItWorks';
import About from './pages/About';
import Pricing from './pages/Pricing';
import FAQ from './pages/FAQ';
import Blog from './pages/Blog';
import Contact from './pages/Contact';
import DownloadNow from './pages/DownloadNow';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import SecureStorage from './pages/features/SecureStorage';
import QrScan from './pages/features/QrScan';
import MultiDevice from './pages/features/MultiDevice';
import Alerts from './pages/features/Alerts';
import Sync from './pages/features/Sync';
import Sharing from './pages/features/Sharing';

import BackUp from './components/dashboard/BackUp';
import Passwords from './components/dashboard/Passwords';
import History from './components/dashboard/History';
import Monitoring from './components/dashboard/Monitoring';
import Settings from './components/dashboard/Settings';
import Notifications from './components/dashboard/Notifications';
import Transactions from './components/dashboard/Transactions';
import UserProfile from './components/dashboard/UserProfile';

/* ─── Error Boundary ───────────────────────────────────────────────────── */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(_: Error) { return { hasError: true }; }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

/* ─── Error Fallback ────────────────────────────────────────────────────── */
const ErrorFallback = () => (
  <div
    className="min-h-screen flex flex-col items-center justify-center"
    style={{
      backgroundColor: '#F9F9F7',
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%23111111' fill-opacity='0.03' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")`,
    }}
  >
    <div className="border-4 border-[#111111] p-12 max-w-md w-full mx-4 text-center">
      <div
        className="text-xs uppercase tracking-widest mb-6 pb-4 border-b border-[#E5E5E0]"
        style={{ fontFamily: "'JetBrains Mono', monospace", color: '#525252' }}
      >
        Error | System Failure
      </div>
      <h2
        className="text-4xl font-black mb-4"
        style={{ fontFamily: "'Playfair Display', serif", color: '#CC0000' }}
      >
        SOMETHING<br />WENT WRONG
      </h2>
      <p
        className="text-sm leading-relaxed mb-8"
        style={{ fontFamily: "'Lora', serif", color: '#525252' }}
      >
        We apologise for the inconvenience. An unexpected error has occurred.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="w-full py-4 bg-[#111111] text-[#F9F9F7] font-bold uppercase text-xs tracking-widest hover:bg-[#CC0000] transition-colors duration-200"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        Reload Page
      </button>
    </div>
  </div>
);

/* ─── Loading Screen ────────────────────────────────────────────────────── */
const LoadingScreen = () => (
  <div
    className="min-h-screen flex flex-col items-center justify-center"
    style={{
      backgroundColor: '#F9F9F7',
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%23111111' fill-opacity='0.03' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")`,
    }}
  >
    <div className="border-2 border-[#111111] p-12 flex flex-col items-center gap-6">
      {/* Spinning border */}
      <div
        className="w-12 h-12 border-t-2 border-r-2 border-[#111111] animate-spin"
        style={{ borderRadius: '0 !important' }}
      />
      <div>
        <p
          className="text-xs uppercase tracking-[0.25em] text-center"
          style={{ fontFamily: "'JetBrains Mono', monospace", color: '#111111' }}
        >
          PassVault
        </p>
        <p
          className="text-[0.6rem] uppercase tracking-widest text-center mt-1"
          style={{ fontFamily: "'JetBrains Mono', monospace", color: '#737373' }}
        >
          Loading Edition…
        </p>
      </div>
    </div>
  </div>
);

/* ─── Protected Route ───────────────────────────────────────────────────── */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = localStorage.getItem('mockAuth') === 'true';
  if (!isAuthenticated) return <Navigate to="/signin" replace />;
  return <>{children}</>;
};

/* ─── Router ────────────────────────────────────────────────────────────── */
const router = createBrowserRouter([
  { path: '/',                       element: <Home /> },
  { path: '/signin',                 element: <SignIn /> },
  { path: '/signup',                 element: <SignUp /> },
  { path: '/how-it-works',           element: <HowItWorks /> },
  { path: '/features',               element: <Features /> },
  { path: '/about',                  element: <About /> },
  { path: '/pricing',                element: <Pricing /> },
  { path: '/faq',                    element: <FAQ /> },
  { path: '/blog',                   element: <Blog /> },
  { path: '/contact',                element: <Contact /> },
  { path: '/download',               element: <DownloadNow /> },
  { path: '/terms',                  element: <Terms /> },
  { path: '/privacy',                element: <Privacy /> },
  { path: '/features/secure-storage',element: <SecureStorage /> },
  { path: '/features/qr-scan',       element: <QrScan /> },
  { path: '/features/multi-device',  element: <MultiDevice /> },
  { path: '/features/alerts',        element: <Alerts /> },
  { path: '/features/sync',          element: <Sync /> },
  { path: '/features/sharing',       element: <Sharing /> },
  {
    path: '/dashboard',
    element: <ProtectedRoute><Dashboard /></ProtectedRoute>,
  },
  {
    path: '/dashboard/backup',
    element: <ProtectedRoute><BackUp /></ProtectedRoute>,
  },
  {
    path: '/dashboard/passwords',
    element: <ProtectedRoute><Passwords /></ProtectedRoute>,
  },
  {
    path: '/dashboard/history',
    element: <ProtectedRoute><History /></ProtectedRoute>,
  },
  {
    path: '/dashboard/monitoring',
    element: <ProtectedRoute><Monitoring /></ProtectedRoute>,
  },
  {
    path: '/dashboard/settings',
    element: <ProtectedRoute><Settings /></ProtectedRoute>,
  },
  {
    path: '/dashboard/notifications',
    element: <ProtectedRoute><Notifications /></ProtectedRoute>,
  },
  {
    path: '/dashboard/transactions',
    element: <ProtectedRoute><Transactions /></ProtectedRoute>,
  },
  {
    path: '/dashboard/user-profile',
    element: <ProtectedRoute><UserProfile /></ProtectedRoute>,
  },
]);

/* ─── App ───────────────────────────────────────────────────────────────── */
const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const loadApp = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 900));
        setIsLoading(false);
      } catch (error) {
        console.error('Error during app initialization:', error);
        setHasError(true);
        setIsLoading(false);
      }
    };
    loadApp();
  }, []);

  if (isLoading) return <LoadingScreen />;
  if (hasError)  return <ErrorFallback />;

  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
};

export default App;