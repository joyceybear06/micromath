import React from "react";

type Props = {
  value: string;
  onChange: (raw: string) => void;

  /* existing optional props you were already using */
  className?: string;
  placeholder?: string;
  allowDecimal?: boolean;              // default false
  autoFocus?: boolean;
  inputMode?: "decimal" | "numeric";

  /* NEW: allow consumers (App.tsx) to handle Enter, etc. */
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
};

export default function SmartNumberInput({
  value,
  onChange,
  className,
  placeholder,
  allowDecimal = false,
  autoFocus,
  inputMode = "decimal",
  onKeyDown, // <-- NEW
}: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;

    // Normalize minus and decimal characters users might type/paste
    raw = raw.replace(/[–—−]/g, "-").replace(",", ".");

    // Keep only digits, one optional leading "-", and (optionally) one "."
    raw = raw.replace(/[^0-9.\-]/g, "");      // strip non numeric
    raw = raw.replace(/(?!^)-/g, "");         // only one leading minus
    if (!allowDecimal) {
      raw = raw.replace(/\./g, "");           // no decimals if not allowed
    } else {
      raw = raw.replace(/(\..*)\./g, "$1");   // only one decimal point
    }

    onChange(raw);
  };

  return (
    <input
      type="text"
      className={className}
      placeholder={placeholder}
      inputMode={inputMode}
      autoFocus={autoFocus}
      value={value}
      onChange={handleChange}
      onKeyDown={onKeyDown}   // <-- NEW: forward to the real <input>
      autoComplete="off"
      enterKeyHint="done"
    />
  );
}
