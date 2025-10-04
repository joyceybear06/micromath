import React, { useMemo, useRef, useCallback, useEffect, useState } from "react";

type Props = {
  value: string;
  onChange: (val: string) => void;
  allowDecimal?: boolean;
  className?: string; // should include "answer-input"
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
  // --- MOBILE-ONLY MINUS BUTTON VISIBILITY (robust detection after mount) ---
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const detect = () => {
      try {
        const w = window as any;
        const coarse = !!(w.matchMedia && w.matchMedia("(pointer: coarse)").matches);
        const touch =
          "ontouchstart" in w ||
          (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
          ((navigator as any).msMaxTouchPoints && (navigator as any).msMaxTouchPoints > 0);
        const ua = (navigator.userAgent || "").toLowerCase();
        const uaMobile = /iphone|ipad|ipod|android|mobile/.test(ua);
        const narrow = Math.min(window.innerWidth, window.innerHeight) <= 900;
        setIsMobile(coarse || touch || uaMobile || narrow);
      } catch {
        setIsMobile(false);
      }
    };
    detect();
    window.addEventListener("resize", detect);
    window.addEventListener("orientationchange", detect);
    return () => {
      window.removeEventListener("resize", detect);
      window.removeEventListener("orientationchange", detect);
    };
  }, []);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const inputClass = useMemo(() => {
    const hasAnswer = (className || "").split(/\s+/).includes("answer-input");
    return hasAnswer ? className : `${className ? className + " " : ""}answer-input`;
  }, [className]);

  // --- SANITIZE TYPING ---
  function sanitize(raw: string): string {
    const trimmed = raw.replace(/\s+/g, "");
    if (trimmed === "-") return "-";
    let sign = "";
    let rest = trimmed;
    if (rest.startsWith("-")) {
      sign = "-";
      rest = rest.slice(1);
    }
    if (allowDecimal) {
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
    onChange(sanitize(e.target.value));
  }

  function focusInput() {
    try {
      inputRef.current?.focus({ preventScroll: true });
    } catch {
      inputRef.current?.focus();
    }
  }

  // --- NEGATIVE TOGGLE (single button) ---
  const toggleMinus = useCallback(() => {
    if (disabled) return;
    const raw = (value ?? "").trim();
    const next = raw.startsWith("-") ? raw.slice(1) : raw ? `-${raw}` : "-";
    onChange(next);
    focusInput();
  }, [value, disabled, onChange]);

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        width: "100%",
        maxWidth: 240,
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
        style={{ flex: 1, minWidth: 0 }}
      />

      {/* MOBILE-ONLY: single negative toggle */}
      {isMobile && (
        <button
          type="button"
          aria-label="Toggle negative"
          onPointerDown={(e) => {
            (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
            e.preventDefault();
            toggleMinus();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") toggleMinus();
          }}
          disabled={disabled}
          style={minusBtnStyle}
        >
          {/* Inline SVG ensures glyph is visible regardless of fonts */}
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
            style={{ display: "block" }}
          >
            <path
              d="M5 12h14"
              stroke="#000"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

// 48px circle; explicit colors so the minus is never invisible on mobile themes
const minusBtnStyle: React.CSSProperties = {
  height: 48,
  width: 48,
  borderRadius: 9999,
  border: "1px solid rgba(0,0,0,0.12)",
  background: "#fff",
  color: "#000",
  fontSize: 0, // ignore font overrides; we render SVG
  cursor: "pointer",
  boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
  touchAction: "manipulation",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
