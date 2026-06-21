export function BeSectionTitle({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2 className={`be-section-title text-xl font-bold text-[var(--be-navy)] sm:text-2xl ${className}`}>
      {children}
    </h2>
  );
}
