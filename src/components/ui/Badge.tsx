const colors: Record<string, string> = {
  green: 'bg-green-100 text-green-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  blue: 'bg-blue-100 text-blue-800',
  red: 'bg-red-100 text-red-800',
  gray: 'bg-gray-100 text-gray-800',
  orange: 'bg-orange-100 text-orange-800',
};

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
}

export default function Badge({ children, color = 'gray' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[color] ?? colors.gray}`}>
      {children}
    </span>
  );
}

export function estadoColor(estado: string): string {
  switch (estado) {
    case 'bot': return 'blue';
    case 'espera_humano': return 'yellow';
    case 'humano_activo': return 'green';
    case 'cerrado': return 'gray';
    case 'pre_reserva': return 'orange';
    case 'confirmada': return 'green';
    case 'cancelada': return 'red';
    case 'completada': return 'blue';
    default: return 'gray';
  }
}

export function estadoLabel(estado: string): string {
  switch (estado) {
    case 'bot': return 'Bot';
    case 'espera_humano': return 'En espera';
    case 'humano_activo': return 'Humano';
    case 'cerrado': return 'Cerrado';
    case 'pre_reserva': return 'Validar transferencia';
    case 'confirmada': return 'Confirmada';
    case 'cancelada': return 'Cancelada';
    case 'completada': return 'Completada';
    default: return estado;
  }
}
