import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getHuesped } from '../../api/huespedApi';

interface GuestCardProps {
  huespedId: string;
}

export default function GuestCard({ huespedId }: GuestCardProps) {
  const { t } = useTranslation();
  const { data: huesped, isLoading } = useQuery({
    queryKey: ['huesped', huespedId],
    queryFn: () => getHuesped(huespedId),
  });

  if (isLoading) return <div className="p-4 text-sm text-gray-400 dark:text-gray-500">{t('common.loading')}</div>;
  if (!huesped) return null;

  return (
    <div className="p-4">
      <h3 className="font-semibold text-gray-800 mb-3 dark:text-gray-100">{t('guests.title')}</h3>
      <div className="space-y-2 text-sm">
        <div>
          <span className="text-gray-500 dark:text-gray-400">{t('guests.nameLabel')}</span>
          <span className="ml-2 text-gray-800 dark:text-gray-100">{huesped.nombre ?? '-'}</span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">{t('guests.whatsappLabel')}</span>
          <span className="ml-2 text-gray-800 dark:text-gray-100">{huesped.waId}</span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">{t('guests.phoneLabel')}</span>
          <span className="ml-2 text-gray-800 dark:text-gray-100">{huesped.telefono ?? '-'}</span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">{t('guests.dniLabel')}</span>
          <span className="ml-2 text-gray-800 dark:text-gray-100">{huesped.dni ?? '-'}</span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">{t('guests.emailLabel')}</span>
          <span className="ml-2 text-gray-800 dark:text-gray-100">{huesped.email ?? '-'}</span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">{t('guests.notesLabel')}</span>
          <span className="ml-2 text-gray-800 dark:text-gray-100">{huesped.notas ?? '-'}</span>
        </div>
      </div>

      {huesped.reservas && huesped.reservas.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium text-gray-700 text-sm mb-2 dark:text-gray-300">
            {t('guests.reservasTitle')} ({huesped.reservas.length})
          </h4>
          {(
            huesped.reservas as Array<{
              id: string;
              fechaEntrada: string;
              fechaSalida: string;
              estado: string;
              habitacion: string | null;
            }>
          ).map((r) => (
            <div key={r.id} className="bg-gray-50 rounded-md p-2 mb-1 text-xs dark:bg-gray-700">
              <div>
                {r.habitacion ?? t('guests.noRoom')} | {r.estado}
              </div>
              <div className="text-gray-500 dark:text-gray-400">
                {new Date(r.fechaEntrada).toLocaleDateString('es')} - {new Date(r.fechaSalida).toLocaleDateString('es')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
