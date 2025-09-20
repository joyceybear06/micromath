import React, { useMemo, useRef } from "react";

type Props = {
  value: string;
  onChange: (val: string) => void;
  allowDecimal?: boolean;
  className?: string; // should include "answer-input" (your code already passes it)
  disabled?: boolean;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  placeholder?: string;
};

export default function SmartNumberInput({
  value,
  onChange,
  allowDecimal = false,
  className,
  disabled,
  onKeyDown,
  placeholder,
}: Props) {
  // Show pad on touch devices (Android + iOS). Desktop stays input-only.
  const showPad = useMemo(() => {
    try {
      return typeof window !== "undefined" &&
        "matchMedia" in window &&
        window.matchMedia("(pointer: coarse)").matches;
    } catch {
      return false;
    }
  }, []);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const inputClass = useMemo(() => {
    // Ensure the input element itself has "answer-input" for your selectors
    const hasAnswer = (className || "").split(/\s+/).includes("answer-input");
    return hasAnswer ? className : `${className ? className + " " : ""}answer-input`;
  }, [className]);

  // Sanitize keyboard input: keep digits, one optional leading '-', and optional '.' if allowed
  function sanitize(raw: string): string {
    const trimmed = raw.replace(/\s+/g, "");
    if (trimmed === "-") return "-"; // allow bare minus while editing

    let sign = "";
    let rest = trimmed;
    if (rest.startsWith("-")) {
      sign = "-";
      rest = rest.slice(1);
    }

    if (allowDecimal) {
      // allow only first dot
      rest = rest.replace(/[^\d.]/g, "");
      const parts = rest.split(".");
      rest = parts.shift() ?? "";
      if (parts.length > 0) rest += "." + parts.join("");
    } else {
      rest = rest.replace(/\D/g, "");
    }

    return sign + rest;
  }

  function handleNativeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = sanitize(e.target.value);
    onChange(next);
  }

  function focusInput() {
    try {
      inputRef.current?.focus({ preventScroll: true });
    } catch {
      inputRef.current?.focus();
    }
  }

  // Button logic: toggle/set sign, then focus stays in the field
  function onMinusClick() {
    if (disabled) return;
    const raw = (value ?? "").trim();
    let next: string;
    if (raw.startsWith("-")) {
      next = raw.slice(1);
    } else {
      next = raw ? `-${raw}` : "-";
    }
    onChange(next);
    focusInput();
  }

  function onPlusClick() {
    if (disabled) return;
    const raw = (value ?? "").trim();
    const next = raw.startsWith("-") ? raw.slice(1) : raw;
    onChange(next);
    focusInput();
  }

  return (
    <div
      // Inline group so the pad sits "in the same block" as the number field
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        width: "100%",
        maxWidth: 240, // keeps row tidy; adjust if you want wider inputs
      }}
    >
      <input
        ref={inputRef}
        type="tel"
        inputMode={allowDecimal ? "decimal" : "numeric"}
        pattern={allowDecimal ? "[0-9]*[.,]?[0-9]*" : "[0-9-]*"}
        value={value}
        onChange={handleNativeChange}
        className={inputClass}
        disabled={disabled}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        aria-label="Answer"
        // Keep input flexible even with buttons present
        style={{
          flex: 1,
          minWidth: 0,
        }}
      />

      {/* + / − controls render only on touch devices (Android + iOS) */}
      {showPad && (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            aria-label="Plus"
            onClick={onPlusClick}
            disabled={disabled}
            style={btnStyle}
          >
            +
          </button>
          <button
            type="button"
            aria-label="Minus"
            onClick={onMinusClick}
            disabled={disabled}
            style={btnStyle}
          >
            −
          </button>
        </div>
      )}
    </div>
  );
}

// Large, round, platform-consistent buttons (≈48px touch target)
const btnStyle: React.CSSProperties = {
  height: 48,
  width: 48,
  borderRadius: 9999,
  border: "1px solid rgba(0,0,0,0.12)",
  background: "#fff",
  fontSize: 24,
  fontWeight: 700,
  lineHeight: "1",
  cursor: "pointer",
  boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
  touchAction: "manipulation",
};
