import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useHealth, getCriticalFailures } from '../../hooks/useHealth';

export default function ServiceBanner() {
  const { t } = useTranslation();
  const health = useHealth();
  const failures = getCriticalFailures(health);

  if (failures.length === 0) return null;

  return (
    <div className="bg-red-600 text-white px-4 py-2 flex items-center gap-2 text-sm">
      <AlertTriangle size={16} className="flex-shrink-0" />
      <span>
        <strong>{failures.length > 1 ? t('app.serviceProblemsPlural') : t('app.serviceProblems')}</strong>{' '}
        {failures.join(', ')}
      </span>
    </div>
  );
}
