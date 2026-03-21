import { useState, type FormEvent } from 'react';
import { Mail, Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import { login, forgotPassword } from '../../api/authApi';
import AuthLayout from './AuthLayout';

interface LoginPageProps {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      onLogin();
    } catch (err) {
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        setError('No se pudo conectar al servidor. Verifica tu conexion.');
      } else if (err instanceof Error && err.message.includes('Invalid credentials')) {
        setError('Email o contraseña incorrectos.');
      } else {
        setError(err instanceof Error ? err.message : 'Error al iniciar sesion');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot(e: FormEvent) {
    e.preventDefault();
    setForgotError('');
    setForgotMsg('');
    setForgotLoading(true);
    try {
      const res = await forgotPassword(forgotEmail);
      setForgotMsg(res.message);
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : 'Error al enviar el email');
    } finally {
      setForgotLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div className="relative overflow-hidden">
        {/* Login form */}
        <div
          className={`transition-all duration-300 ease-in-out ${
            showForgot
              ? '-translate-x-full opacity-0 absolute inset-0 pointer-events-none'
              : 'translate-x-0 opacity-100'
          }`}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors dark:text-gray-100"
                  placeholder="agente@email.com"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors dark:text-gray-100"
                  placeholder="Tu contraseña"
                  required
                />
              </div>
            </div>
            {error && (
              <p className="text-red-500 text-sm bg-red-50 dark:bg-red-900/30 px-3 py-2 rounded-lg">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-md hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 font-medium shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? 'Ingresando...' : (
                <>Ingresar <ArrowRight size={16} /></>
              )}
            </button>
          </form>
          <button
            onClick={() => { setShowForgot(true); setForgotMsg(''); setForgotError(''); }}
            className="mt-4 w-full text-sm text-gray-400 hover:text-blue-600 transition-colors"
          >
            Olvidé mi contraseña
          </button>
        </div>

        {/* Forgot password form */}
        <div
          className={`transition-all duration-300 ease-in-out ${
            showForgot
              ? 'translate-x-0 opacity-100'
              : 'translate-x-full opacity-0 absolute inset-0 pointer-events-none'
          }`}
        >
          <form onSubmit={handleForgot} className="space-y-4">
            <p className="text-sm text-gray-500">
              Ingresá tu email y te enviaremos un enlace para restablecer tu contraseña.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors dark:text-gray-100"
                  placeholder="agente@email.com"
                  required
                />
              </div>
            </div>
            {forgotMsg && (
              <p className="text-green-600 text-sm bg-green-50 px-3 py-2 rounded-lg">{forgotMsg}</p>
            )}
            {forgotError && (
              <p className="text-red-500 text-sm bg-red-50 dark:bg-red-900/30 px-3 py-2 rounded-lg">{forgotError}</p>
            )}
            <button
              type="submit"
              disabled={forgotLoading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-md hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 font-medium shadow-md shadow-blue-500/20 transition-all"
            >
              {forgotLoading ? 'Enviando...' : 'Enviar enlace'}
            </button>
          </form>
          <button
            onClick={() => setShowForgot(false)}
            className="mt-4 w-full text-sm text-gray-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-1"
          >
            <ArrowLeft size={14} /> Volver al login
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}
