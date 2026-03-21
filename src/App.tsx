import { useState, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isAuthenticated } from './api/authApi';
import LoginPage from './components/auth/LoginPage';
import ResetPasswordPage from './components/auth/ResetPasswordPage';
import Header from './components/layout/Header';
import ServiceBanner from './components/layout/ServiceBanner';
import ChatList from './components/chat/ChatList';
import ChatWindow from './components/chat/ChatWindow';
import GuestCard from './components/guests/GuestCard';
import EmptyState from './components/ui/EmptyState';
import { useDocumentTitle } from './hooks/useDocumentTitle';
import { useDarkMode } from './hooks/useDarkMode';
import { useNotifications } from './hooks/useNotifications';
import type { Conversacion } from '@shared/types/conversacion';

// Lazy-loaded views for code splitting
const DashboardPage = lazy(() => import('./components/dashboard/DashboardPage'));
const ReservaList = lazy(() => import('./components/reservas/ReservaList'));
const ComplejoList = lazy(() => import('./components/complejos/ComplejoList'));
const WhatsAppProfilePage = lazy(() => import('./components/whatsapp/WhatsAppProfilePage'));
const BotConfigPage = lazy(() => import('./components/bot/BotConfigPage'));
const EmailList = lazy(() => import('./components/emails/EmailList'));
const WhatsAppSimulator = lazy(() => import('./components/simulator/WhatsAppSimulator'));
const IntegrationLogsPage = lazy(() => import('./components/logs/IntegrationLogsPage'));

function ViewSpinner() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(isAuthenticated());
  const { isDark, toggle: toggleDark } = useDarkMode();

  if (!authed) {
    return (
      <Routes>
        <Route path="/reset-password" element={<ResetPasswordRoute />} />
        <Route path="*" element={<LoginPage onLogin={() => setAuthed(true)} />} />
      </Routes>
    );
  }

  return (
    <div className={`h-screen flex flex-col ${isDark ? 'dark' : ''}`}>
      <AuthenticatedApp isDark={isDark} toggleDark={toggleDark} />
    </div>
  );
}

function AuthenticatedApp({ isDark, toggleDark }: { isDark: boolean; toggleDark: () => void }) {
  const location = useLocation();
  const view = locationToView(location.pathname);
  useDocumentTitle(view);
  useNotifications();

  const { t } = useTranslation();

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-3 focus:bg-blue-600 focus:text-white"
      >
        {t('app.skipToContent')}
      </a>
      <Header isDark={isDark} onToggleDark={toggleDark} />
      <ServiceBanner />

      <main id="main-content">
        <Suspense fallback={<ViewSpinner />}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/chat" element={<ChatView />} />
            <Route path="/reservas" element={<ReservaList />} />
            <Route path="/propiedades" element={<ComplejoList />} />
            <Route path="/emails" element={<EmailList />} />
            <Route path="/whatsapp" element={<WhatsAppProfilePage />} />
            <Route path="/bot" element={<BotConfigPage />} />
            <Route path="/logs" element={<IntegrationLogsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
    </>
  );
}

function ChatView() {
  const [selectedConv, setSelectedConv] = useState<Conversacion | null>(null);
  const { t } = useTranslation();

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Chat List — hidden on mobile when conv selected */}
      <div
        className={`w-full md:w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0 ${selectedConv ? 'hidden md:block' : ''}`}
      >
        <ChatList selectedId={selectedConv?.id ?? null} onSelect={setSelectedConv} />
      </div>

      {/* Chat Window — hidden on mobile when no conv */}
      <div className={`flex-1 flex flex-col min-w-0 ${!selectedConv ? 'hidden md:flex' : ''}`}>
        {selectedConv ? (
          <>
            <button
              onClick={() => setSelectedConv(null)}
              className="md:hidden px-4 py-2 text-sm text-blue-600 dark:text-blue-400 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center gap-1"
              aria-label={t('app.chatBackAria')}
            >
              &larr; {t('app.chatBackButton')}
            </button>
            <ChatWindow conversacion={selectedConv} onConversacionUpdate={setSelectedConv} />
          </>
        ) : (
          <EmptyState title={t('app.chatEmptyTitle')} description={t('app.chatEmptyDescription')} illustration="chat" />
        )}
      </div>

      {/* Guest Sidebar — hidden below lg */}
      {selectedConv && (
        <div className="hidden lg:block w-72 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0 overflow-y-auto">
          <GuestCard huespedId={selectedConv.huespedId} />
        </div>
      )}

      {/* Simulator */}
      <div className="fixed bottom-4 right-4 z-50">
        <SimulatorToggle />
      </div>
    </div>
  );
}

function SimulatorToggle() {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      {open && (
        <Suspense fallback={null}>
          <div className="mb-2">
            <WhatsAppSimulator />
          </div>
        </Suspense>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="bg-green-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-green-700 text-sm font-medium"
      >
        {open ? t('app.simulatorClose') : t('app.simulatorOpen')}
      </button>
    </>
  );
}

function ResetPasswordRoute() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  if (!token) return <Navigate to="/" replace />;

  return <ResetPasswordPage token={token} onBack={() => navigate('/')} />;
}

function locationToView(pathname: string): string {
  const path = pathname.replace(/^\//, '') || 'dashboard';
  return path;
}
