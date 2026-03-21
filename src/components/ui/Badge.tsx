import i18n from '../../i18n';

const colors: Record<string, string> = {
  green: 'bg-green-100 text-green-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  blue: 'bg-blue-100 text-blue-800',
  red: 'bg-red-100 text-red-800',
  gray: 'bg-gray-100 text-gray-800',
  orange: 'bg-orange-100 text-orange-800',
  cyan: 'bg-cyan-100 text-cyan-800',
  purple: 'bg-purple-100 text-purple-800',
};

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
}

export default function Badge({ children, color = 'gray' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[color] ?? colors.gray}`}
    >
      {children}
    </span>
  );
}

export function estadoColor(estado: string): string {
  switch (estado) {
    case 'bot':
      return 'cyan';
    case 'espera_humano':
      return 'yellow';
    case 'humano_activo':
      return 'green';
    case 'cerrado':
      return 'gray';
    case 'pre_reserva':
      return 'orange';
    case 'confirmada':
      return 'green';
    case 'cancelada':
      return 'red';
    case 'completada':
      return 'purple';
    default:
      return 'gray';
  }
}

export function estadoLabel(estado: string): string {
  switch (estado) {
    case 'bot':
      return i18n.t('status.bot');
    case 'espera_humano':
      return i18n.t('status.waiting');
    case 'humano_activo':
      return i18n.t('status.human');
    case 'cerrado':
      return i18n.t('status.closed');
    case 'pre_reserva':
      return i18n.t('status.preReserva');
    case 'confirmada':
      return i18n.t('status.confirmed');
    case 'cancelada':
      return i18n.t('status.cancelled');
    case 'completada':
      return i18n.t('status.completed');
    default:
      return estado;
  }
}
