export default function StatusPill({ children, variant = 'neutral' }) {
  return <span className={`status-pill status-${variant}`}>{children}</span>;
}
