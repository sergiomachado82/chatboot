import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Save, AlertTriangle } from 'lucide-react';
import { getWhatsAppProfile, updateWhatsAppProfile } from '../../api/whatsappProfileApi';
import type { WhatsAppProfileUpdate } from '../../api/whatsappProfileApi';

const VERTICALS = [
  'UNDEFINED', 'OTHER', 'AUTO', 'BEAUTY', 'APPAREL', 'EDU', 'ENTERTAIN',
  'EVENT_PLAN', 'FINANCE', 'GROCERY', 'GOVT', 'HOTEL', 'HEALTH',
  'NONPROFIT', 'PROF_SERVICES', 'RETAIL', 'TRAVEL', 'RESTAURANT', 'NOT_A_BIZ',
] as const;

const VERTICAL_LABELS: Record<string, string> = {
  UNDEFINED: 'Sin definir',
  OTHER: 'Otro',
  AUTO: 'Automotriz',
  BEAUTY: 'Belleza',
  APPAREL: 'Indumentaria',
  EDU: 'Educacion',
  ENTERTAIN: 'Entretenimiento',
  EVENT_PLAN: 'Organizacion de eventos',
  FINANCE: 'Finanzas',
  GROCERY: 'Supermercado',
  GOVT: 'Gobierno',
  HOTEL: 'Hotel / Alojamiento',
  HEALTH: 'Salud',
  NONPROFIT: 'Sin fines de lucro',
  PROF_SERVICES: 'Servicios profesionales',
  RETAIL: 'Comercio minorista',
  TRAVEL: 'Viajes',
  RESTAURANT: 'Restaurante',
  NOT_A_BIZ: 'No es un negocio',
};

export default function WhatsAppProfilePage() {
  const queryClient = useQueryClient();
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['whatsapp-profile'],
    queryFn: getWhatsAppProfile,
  });

  const [about, setAbout] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [website1, setWebsite1] = useState('');
  const [website2, setWebsite2] = useState('');
  const [vertical, setVertical] = useState('UNDEFINED');

  useEffect(() => {
    if (profile) {
      setAbout(profile.about);
      setDescription(profile.description);
      setAddress(profile.address);
      setEmail(profile.email);
      setWebsite1(profile.websites[0] ?? '');
      setWebsite2(profile.websites[1] ?? '');
      setVertical(profile.vertical);
    }
  }, [profile]);

  const mutation = useMutation({
    mutationFn: (data: WhatsAppProfileUpdate) => updateWhatsAppProfile(data),
    onSuccess: () => {
      toast.success('Perfil actualizado correctamente');
      queryClient.invalidateQueries({ queryKey: ['whatsapp-profile'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Error al actualizar el perfil');
    },
  });

  function handleSave() {
    const websites = [website1, website2].filter(Boolean);
    mutation.mutate({ about, description, address, email, websites, vertical });
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-2 text-red-500" size={32} />
          <p className="text-red-600">Error al cargar el perfil de WhatsApp</p>
          <p className="text-sm text-gray-500 mt-1">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  const isSimulator = !profile?.profile_picture_url && profile?.about === 'Complejo de cabañas en la Patagonia';

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Perfil de WhatsApp Business</h2>

        {isSimulator && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
            <AlertTriangle size={18} className="text-yellow-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-yellow-800">
              Modo simulador activo. Los datos mostrados son de ejemplo. Los cambios no se envian a Meta.
            </p>
          </div>
        )}

        {profile?.profile_picture_url && (
          <div className="mb-6 flex items-center gap-4">
            <img
              src={profile.profile_picture_url}
              alt="Foto de perfil"
              className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
            />
            <p className="text-xs text-gray-500">La foto de perfil solo se puede cambiar desde Meta Business Manager</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 space-y-5">
          {/* About */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Acerca de <span className="text-gray-400 font-normal">({about.length}/139)</span>
            </label>
            <input
              type="text"
              value={about}
              onChange={(e) => setAbout(e.target.value.slice(0, 139))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Texto breve de 'Acerca de'"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripcion <span className="text-gray-400 font-normal">({description.length}/512)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 512))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder="Descripcion del negocio"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Direccion <span className="text-gray-400 font-normal">({address.length}/256)</span>
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value.slice(0, 256))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Direccion fisica"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email de contacto</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="contacto@ejemplo.com"
            />
          </div>

          {/* Websites */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sitios web (max 2)</label>
            <div className="space-y-2">
              <input
                type="url"
                value={website1}
                onChange={(e) => setWebsite1(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://www.ejemplo.com"
              />
              <input
                type="url"
                value={website2}
                onChange={(e) => setWebsite2(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://www.otro-sitio.com (opcional)"
              />
            </div>
          </div>

          {/* Vertical */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Industria</label>
            <select
              value={vertical}
              onChange={(e) => setVertical(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              {VERTICALS.map((v) => (
                <option key={v} value={v}>{VERTICAL_LABELS[v] ?? v}</option>
              ))}
            </select>
          </div>

          {/* Save */}
          <div className="pt-2">
            <button
              onClick={handleSave}
              disabled={mutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              <Save size={16} />
              {mutation.isPending ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
