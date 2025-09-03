import React from "react";

type Props = {
  value: string;
  onChange: (raw: string) => void;

  className?: string;
  placeholder?: string;
  allowDecimal?: boolean;              // default false
  autoFocus?: boolean;
  inputMode?: "decimal" | "numeric";

  // NEW: allow consumers (App.tsx) to handle Enter, etc.
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
};

// forwardRef so the parent can focus after toggling ±
const SmartNumberInput = React.forwardRef<HTMLInputElement, Props>(
  (
    {
      value,
      onChange,
      className,
      placeholder,
      allowDecimal = false,
      autoFocus,
      inputMode = "decimal",
      onKeyDown,
    },
    ref
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let raw = e.target.value;

      // Normalize minus/decimal variants users might type/paste
      raw = raw.replace(/[–—−]/g, "-").replace(",", ".");

      // Keep only digits, optional leading '-', and (optionally) one '.'
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
        ref={ref}
        type="text"
        className={className}
        placeholder={placeholder}
        inputMode={inputMode}
        autoFocus={autoFocus}
        value={value}
        onChange={handleChange}
        onKeyDown={onKeyDown}   // ← NEW: forwarded to the real <input>
        autoComplete="off"
        enterKeyHint="done"
      />
    );
  }
);

export default SmartNumberInput;
