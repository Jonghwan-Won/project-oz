import s from './ProjectTag.module.css';

export function ProjectTag({
  label,
  onRemove,
  removeLabel,
  className = '',
  role,
}: {
  label: string;
  onRemove?: () => void;
  removeLabel?: string;
  className?: string;
  role?: string;
}) {
  return (
    <span className={`${s.tag} ${className}`} role={role}>
      {label}
      {onRemove && (
        <button
          type="button"
          aria-label={removeLabel ?? `${label} 제거`}
          onClick={onRemove}
        >
          ×
        </button>
      )}
    </span>
  );
}
