export default function Logo({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false" className={className}>
      <circle cx="16" cy="16" r="14" fill="rgb(var(--accent) / 0.18)" />
      <path d="M16 2a14 14 0 0 1 0 28V2Z" fill="rgb(var(--accent))" />
      <circle cx="16" cy="16" r="5" fill="rgb(var(--bg))" />
    </svg>
  );
}
