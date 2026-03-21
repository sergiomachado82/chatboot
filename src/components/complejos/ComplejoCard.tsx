import { useTranslation } from 'react-i18next';
import { Pencil, Image } from 'lucide-react';
import Badge from '../ui/Badge';
import { formatCurrency } from '../../utils/format';
import type { Complejo } from '@shared/types/complejo';

interface ComplejoCardProps {
  complejo: Complejo;
  onEdit: () => void;
}

export default function ComplejoCard({ complejo, onEdit }: ComplejoCardProps) {
  const { t } = useTranslation();
  const mainImage = complejo.media[0]?.url;
  const precioMinimo = complejo.tarifas.length > 0 ? Math.min(...complejo.tarifas.map((tar) => tar.precioNoche)) : null;

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={onEdit}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onEdit();
        }
      }}
    >
      {/* Image */}
      <div className="h-36 bg-gray-100 dark:bg-gray-700 relative">
        {mainImage ? (
          <img src={mainImage} alt={complejo.nombre} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <Image size={40} />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Badge color={complejo.activo ? 'green' : 'gray'}>
            {complejo.activo ? t('common.active') : t('common.inactive')}
          </Badge>
        </div>
        {complejo.media.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-full">
            {complejo.media.length} {t('complejos.photos')}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">{complejo.nombre}</h3>
            {complejo.tipo && <p className="text-xs text-gray-500 dark:text-gray-400">{complejo.tipo}</p>}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1 text-gray-400 hover:text-blue-600"
            aria-label={t('complejos.editProperty')}
          >
            <Pencil size={14} />
          </button>
        </div>

        <div className="mt-2 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span>
            {complejo.cantidadUnidades}{' '}
            {complejo.cantidadUnidades > 1 ? t('complejos.unitsPlural') : t('complejos.unitsSingular')}
          </span>
          <span>
            {complejo.capacidad} {t('complejos.capacityLabel')}
          </span>
          <span>
            {complejo.dormitorios} {t('complejos.bedroomsLabel')}
          </span>
          <span>
            {complejo.banos} {complejo.banos > 1 ? t('complejos.bathroomsPlural') : t('complejos.bathroomsSingular')}
          </span>
        </div>

        {precioMinimo !== null && (
          <p className="mt-2 text-sm font-medium text-green-700">
            {t('complejos.priceFrom')} {formatCurrency(precioMinimo)}
            {t('complejos.pricePerNight')}
          </p>
        )}
      </div>
    </div>
  );
}
