interface IconProps {
  className?: string;
}

export function ShieldIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 2 4 5v6c0 5 3.4 8.6 8 9 4.6-.4 8-4 8-9V5l-8-3Zm0 2.2 6 2.25V11c0 4-2.6 6.9-6 7.3C8.6 17.9 6 15 6 11V6.45L12 4.2Z" />
    </svg>
  );
}

export function CrossedSwordsIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <line x1="4" y1="4" x2="20" y2="20" />
      <line x1="20" y1="4" x2="4" y2="20" />
      <line x1="3" y1="7" x2="7" y2="3" />
      <line x1="17" y1="21" x2="21" y2="17" />
      <line x1="21" y1="7" x2="17" y2="3" />
      <line x1="7" y1="21" x2="3" y2="17" />
    </svg>
  );
}

export function HexagonIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="28"
      height="28"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8 3h8l5 9-5 9H8l-5-9 5-9Z" />
    </svg>
  );
}

export function ChevronIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="28"
      height="28"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 15l8-6 8 6M4 9l8-6 8 6" />
    </svg>
  );
}
