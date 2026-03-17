import { useState } from 'react';
import { isAuthenticated } from './api/authApi';
import LoginPage from './components/auth/LoginPage';
import ResetPasswordPage from './components/auth/ResetPasswordPage';
import Header from './components/layout/Header';
import ChatList from './components/chat/ChatList';
import ChatWindow from './components/chat/ChatWindow';
import GuestCard from './components/guests/GuestCard';
import ReservaList from './components/reservas/ReservaList';
import ComplejoList from './components/complejos/ComplejoList';
import WhatsAppProfilePage from './components/whatsapp/WhatsAppProfilePage';
import BotConfigPage from './components/bot/BotConfigPage';
import WhatsAppSimulator from './components/simulator/WhatsAppSimulator';
import EmptyState from './components/ui/EmptyState';
import type { Conversacion } from '@shared/types/conversacion';

type View = 'chat' | 'reservas' | 'complejos' | 'whatsapp' | 'bot';

export default function App() {
  const [authed, setAuthed] = useState(isAuthenticated());
  const [view, setView] = useState<View>('chat');
  const [selectedConv, setSelectedConv] = useState<Conversacion | null>(null);

  // Handle /reset-password?token=xxx route
  const urlParams = new URLSearchParams(window.location.search);
  const resetToken = urlParams.get('token');
  if (window.location.pathname === '/reset-password' && resetToken) {
    return (
      <ResetPasswordPage
        token={resetToken}
        onBack={() => {
          window.history.pushState({}, '', '/');
          window.location.reload();
        }}
      />
    );
  }

  if (!authed) {
    return <LoginPage onLogin={() => setAuthed(true)} />;
  }

  return (
    <div className="h-screen flex flex-col">
      <Header view={view} onViewChange={setView} />

      {view === 'chat' ? (
        <div className="flex-1 flex overflow-hidden">
          {/* Chat List — hidden on mobile when conv selected */}
          <div className={`w-full md:w-80 border-r border-gray-200 bg-white flex-shrink-0 ${selectedConv ? 'hidden md:block' : ''}`}>
            <ChatList
              selectedId={selectedConv?.id ?? null}
              onSelect={setSelectedConv}
            />
          </div>

          {/* Chat Window — hidden on mobile when no conv */}
          <div className={`flex-1 flex flex-col min-w-0 ${!selectedConv ? 'hidden md:flex' : ''}`}>
            {selectedConv ? (
              <>
                <button
                  onClick={() => setSelectedConv(null)}
                  className="md:hidden px-4 py-2 text-sm text-blue-600 border-b border-gray-200 bg-white flex items-center gap-1"
                  aria-label="Volver a la lista de conversaciones"
                >
                  &larr; Volver
                </button>
                <ChatWindow conversacion={selectedConv} onConversacionUpdate={setSelectedConv} />
              </>
            ) : (
              <EmptyState title="Selecciona una conversacion" description="Elige una conversacion de la lista para ver los mensajes" />
            )}
          </div>

          {/* Guest Sidebar — hidden below lg */}
          {selectedConv && (
            <div className="hidden lg:block w-72 border-l border-gray-200 bg-white flex-shrink-0 overflow-y-auto">
              <GuestCard huespedId={selectedConv.huespedId} />
            </div>
          )}

          {/* Simulator */}
          <div className="fixed bottom-4 right-4 z-50">
            <SimulatorToggle />
          </div>
        </div>
      ) : view === 'reservas' ? (
        <ReservaList />
      ) : view === 'complejos' ? (
        <ComplejoList />
      ) : view === 'bot' ? (
        <BotConfigPage />
      ) : (
        <WhatsAppProfilePage />
      )}
    </div>
  );
}

function SimulatorToggle() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <div className="mb-2">
          <WhatsAppSimulator />
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="bg-green-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-green-700 text-sm font-medium"
      >
        {open ? 'Cerrar simulador' : 'Simulador WA'}
      </button>
    </>
  );
}
