import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notify } from '../../utils/notify';
import { Save, AlertTriangle } from 'lucide-react';
import { getWhatsAppProfile, updateWhatsAppProfile } from '../../api/whatsappProfileApi';
import type { WhatsAppProfileUpdate } from '../../api/whatsappProfileApi';

const VERTICALS = [
  'UNDEFINED',
  'OTHER',
  'AUTO',
  'BEAUTY',
  'APPAREL',
  'EDU',
  'ENTERTAIN',
  'EVENT_PLAN',
  'FINANCE',
  'GROCERY',
  'GOVT',
  'HOTEL',
  'HEALTH',
  'NONPROFIT',
  'PROF_SERVICES',
  'RETAIL',
  'TRAVEL',
  'RESTAURANT',
  'NOT_A_BIZ',
] as const;

const VERTICAL_LABEL_KEYS: Record<string, string> = {
  UNDEFINED: 'whatsapp.industryUndefined',
  OTHER: 'whatsapp.industryOther',
  AUTO: 'whatsapp.industryAuto',
  BEAUTY: 'whatsapp.industryBeauty',
  APPAREL: 'whatsapp.industryApparel',
  EDU: 'whatsapp.industryEdu',
  ENTERTAIN: 'whatsapp.industryEntertainment',
  EVENT_PLAN: 'whatsapp.industryEventPlan',
  FINANCE: 'whatsapp.industryFinance',
  GROCERY: 'whatsapp.industryGrocery',
  GOVT: 'whatsapp.industryGovt',
  HOTEL: 'whatsapp.industryHotel',
  HEALTH: 'whatsapp.industryHealth',
  NONPROFIT: 'whatsapp.industryNonprofit',
  PROF_SERVICES: 'whatsapp.industryProfServices',
  RETAIL: 'whatsapp.industryRetail',
  TRAVEL: 'whatsapp.industryTravel',
  RESTAURANT: 'whatsapp.industryRestaurant',
  NOT_A_BIZ: 'whatsapp.industryNotBiz',
};

export default function WhatsAppProfilePage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const {
    data: profile,
    isLoading,
    error,
  } = useQuery({
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
      notify.success(t('whatsapp.successUpdate'));
      queryClient.invalidateQueries({ queryKey: ['whatsapp-profile'] });
    },
    onError: (err: Error) => {
      notify.error(err.message || t('whatsapp.errorUpdate'));
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
          <p className="text-red-600">{t('whatsapp.errorLoading')}</p>
          <p className="text-sm text-gray-500 mt-1">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  const isSimulator = !profile?.profile_picture_url && profile?.about === 'Complejo de cabañas en la Patagonia';

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">{t('whatsapp.title')}</h1>

        {isSimulator && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
            <AlertTriangle size={18} className="text-yellow-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-yellow-800">{t('whatsapp.simulatorWarning')}</p>
          </div>
        )}

        {profile?.profile_picture_url && (
          <div className="mb-6 flex items-center gap-4">
            <img
              src={profile.profile_picture_url}
              alt="Foto de perfil"
              className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
            />
            <p className="text-xs text-gray-500">{t('whatsapp.profilePictureInfo')}</p>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-5">
          {/* About */}
          <div>
            <label htmlFor="wa-about" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('whatsapp.aboutLabel')} <span className="text-gray-400 font-normal">({about.length}/139)</span>
            </label>
            <input
              id="wa-about"
              type="text"
              value={about}
              onChange={(e) => setAbout(e.target.value.slice(0, 139))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
              placeholder={t('whatsapp.aboutLabel')}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="wa-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('whatsapp.descriptionLabel')}{' '}
              <span className="text-gray-400 font-normal">({description.length}/512)</span>
            </label>
            <textarea
              id="wa-description"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 512))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white dark:bg-gray-700 dark:text-gray-100"
              placeholder={t('whatsapp.descriptionLabel')}
            />
          </div>

          {/* Address */}
          <div>
            <label htmlFor="wa-address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('whatsapp.addressLabel')} <span className="text-gray-400 font-normal">({address.length}/256)</span>
            </label>
            <input
              id="wa-address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value.slice(0, 256))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
              placeholder={t('whatsapp.addressPlaceholder')}
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="wa-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('whatsapp.emailLabel')}
            </label>
            <input
              id="wa-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
              placeholder={t('whatsapp.emailPlaceholder')}
            />
          </div>

          {/* Websites */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('whatsapp.websitesLabel')}
            </label>
            <div className="space-y-2">
              <input
                id="wa-website1"
                type="url"
                value={website1}
                onChange={(e) => setWebsite1(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                placeholder={t('whatsapp.website1Placeholder')}
              />
              <input
                id="wa-website2"
                type="url"
                value={website2}
                onChange={(e) => setWebsite2(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                placeholder={t('whatsapp.website2Placeholder')}
              />
            </div>
          </div>

          {/* Vertical */}
          <div>
            <label htmlFor="wa-vertical" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('whatsapp.industryLabel')}
            </label>
            <select
              id="wa-vertical"
              value={vertical}
              onChange={(e) => setVertical(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
            >
              {VERTICALS.map((v) => (
                <option key={v} value={v}>
                  {VERTICAL_LABEL_KEYS[v] ? t(VERTICAL_LABEL_KEYS[v]) : v}
                </option>
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
              {mutation.isPending ? t('common.saving') : t('whatsapp.saveChanges')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
