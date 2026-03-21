import { AlertTriangle } from 'lucide-react';
import { useHealth, getCriticalFailures } from '../../hooks/useHealth';

export default function ServiceBanner() {
  const health = useHealth();
  const failures = getCriticalFailures(health);

  if (failures.length === 0) return null;

  return (
    <div className="bg-red-600 text-white px-4 py-2 flex items-center gap-2 text-sm">
      <AlertTriangle size={16} className="flex-shrink-0" />
      <span>
        <strong>Servicio{failures.length > 1 ? 's' : ''} con problemas:</strong>{' '}
        {failures.join(', ')}
      </span>
    </div>
  );
}
