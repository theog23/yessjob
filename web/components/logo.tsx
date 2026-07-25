export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`font-mono text-sm tracking-tight ${className}`}>
      <span className="text-ink-600">[</span>
      <span className="text-ink-0">yess</span>
      <span className="text-ink-500">job</span>
      <span className="text-ink-600">]</span>
    </span>
  );
}
