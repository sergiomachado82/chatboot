// EmptyState receives all text via props — no hardcoded strings to translate.
type Illustration = 'chat' | 'reservas' | 'emails' | 'complejos';

interface EmptyStateProps {
  title: string;
  description?: string;
  illustration?: Illustration;
}

const illustrations: Record<Illustration, JSX.Element> = {
  chat: (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-gray-300 dark:text-gray-600"
    >
      <rect x="10" y="14" width="44" height="32" rx="6" stroke="currentColor" strokeWidth="2.5" />
      <rect x="26" y="34" width="44" height="32" rx="6" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="24" cy="30" r="2.5" fill="currentColor" />
      <circle cx="32" cy="30" r="2.5" fill="currentColor" />
      <circle cx="40" cy="30" r="2.5" fill="currentColor" />
      <line x1="34" y1="48" x2="58" y2="48" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="34" y1="54" x2="50" y2="54" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  reservas: (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-gray-300 dark:text-gray-600"
    >
      <rect x="12" y="18" width="56" height="48" rx="6" stroke="currentColor" strokeWidth="2.5" />
      <line x1="12" y1="32" x2="68" y2="32" stroke="currentColor" strokeWidth="2" />
      <line x1="28" y1="18" x2="28" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="52" y1="18" x2="52" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="22" y="40" width="8" height="6" rx="1.5" fill="currentColor" />
      <rect x="36" y="40" width="8" height="6" rx="1.5" fill="currentColor" />
      <rect x="50" y="40" width="8" height="6" rx="1.5" fill="currentColor" />
      <rect x="22" y="52" width="8" height="6" rx="1.5" fill="currentColor" />
      <rect x="36" y="52" width="8" height="6" rx="1.5" fill="currentColor" />
    </svg>
  ),
  emails: (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-gray-300 dark:text-gray-600"
    >
      <rect x="10" y="20" width="60" height="40" rx="6" stroke="currentColor" strokeWidth="2.5" />
      <path d="M10 26l30 18 30-18" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  ),
  complejos: (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-gray-300 dark:text-gray-600"
    >
      <rect x="14" y="24" width="52" height="40" rx="4" stroke="currentColor" strokeWidth="2.5" />
      <rect x="24" y="34" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
      <rect x="46" y="34" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
      <rect x="34" y="52" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
      <line x1="40" y1="18" x2="40" y2="24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="34" y1="14" x2="46" y2="14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ),
};

export default function EmptyState({ title, description, illustration }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 py-12 view-transition">
      {illustration && <div className="mb-4">{illustrations[illustration]}</div>}
      <p className="text-lg font-medium">{title}</p>
      {description && <p className="text-sm mt-1">{description}</p>}
    </div>
  );
}
