const COLORS = [
  'bg-blue-600',
  'bg-emerald-600',
  'bg-purple-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-cyan-600',
  'bg-indigo-600',
  'bg-orange-600',
];

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

interface AvatarProps {
  name: string;
  identifier?: string;
  size?: 'sm' | 'md';
}

export default function Avatar({ name, identifier, size = 'md' }: AvatarProps) {
  const seed = identifier ?? name;
  const color = COLORS[hashCode(seed) % COLORS.length];
  const initials = getInitials(name || '??');
  const sizeClasses = size === 'sm' ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs';

  return (
    <div
      className={`${sizeClasses} ${color} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}
      title={name}
    >
      {initials}
    </div>
  );
}
