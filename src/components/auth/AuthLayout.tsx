import type { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-sky-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 px-4">
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/60 dark:border-gray-700/60 w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="mb-3">
            <img
              src="/logo.jpg"
              alt="Las Grutas Departamentos"
              className="h-16 w-auto object-contain"
            />
          </div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Panel de Agentes</h1>
        </div>

        {children}
      </div>

      {/* Footer */}
      <p className="absolute bottom-4 text-xs text-gray-300">
        lasgrutasdepartamentos.com
      </p>
    </div>
  );
}
