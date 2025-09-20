type ResetButtonProps = {
  onClick: () => void;
  className?: string;
};

export default function ResetButton({ onClick, className }: ResetButtonProps) {
  return (
    <button
      type="button"
      aria-label="Reset to Home"
      onClick={onClick}
      className={className ?? "btn btn--outline"}
    >
      Reset
    </button>
  );
}
