import { useState, useEffect, type ReactNode } from 'react';
import { Building2 } from 'lucide-react';
import { getPublicLogo } from '../../api/botConfigApi';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoLoaded, setLogoLoaded] = useState(false);

  useEffect(() => {
    getPublicLogo().then((url) => {
      setLogoUrl(url);
      setLogoLoaded(true);
    }).catch(() => setLogoLoaded(true));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-sky-100 px-4">
      <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/60 w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="mb-3">
            {logoLoaded && logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                className="h-16 w-auto object-contain"
              />
            ) : (
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center shadow-lg">
                <Building2 className="text-white" size={32} />
              </div>
            )}
          </div>
          <h1 className="text-xl font-bold text-gray-800">Panel de Agentes</h1>
          <p className="text-xs text-gray-400 mt-0.5">Las Grutas Departamentos</p>
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
