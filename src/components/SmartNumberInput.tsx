import React, { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  value: string;
  onChange: (val: string) => void;
  allowDecimal?: boolean;
  className?: string; // include "answer-input"
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
  // Mobile-only detection (no viewport heuristic to avoid desktop false-positives)
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const detect = () => {
      try {
        const ua = (navigator.userAgent || "").toLowerCase();
        const touchCap =
          (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
          // old iOS
          ((navigator as any).msMaxTouchPoints && (navigator as any).msMaxTouchPoints > 0) ||
          typeof (window as any).ontouchstart !== "undefined";
        const uaMobile = /iphone|ipad|ipod|android/.test(ua);
        setIsMobile(!!(touchCap || uaMobile));
      } catch {
        setIsMobile(false);
      }
    };
    detect();
    window.addEventListener("orientationchange", detect);
    return () => window.removeEventListener("orientationchange", detect);
  }, []);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const inputClass = useMemo(() => {
    const hasAnswer = (className || "").split(/\s+/).includes("answer-input");
    return hasAnswer ? className : `${className ? className + " " : ""}answer-input`;
  }, [className]);

  // sanitize keyboard input
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

  // single minus toggle
  function toggleMinus() {
    if (disabled) return;
    const raw = (value ?? "").trim();
    const next = raw.startsWith("-") ? raw.slice(1) : raw ? `-${raw}` : "-";
    onChange(next);
    focusInput();
  }

  return (
    // container establishes stacking context for iOS; minus chip overlays inside input
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 240,
        display: "inline-block",
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
        style={{
          width: "100%",
          paddingRight: isMobile ? 56 : undefined, // room for embedded minus chip
          boxSizing: "border-box",
          position: "relative",
          zIndex: 1, // ensure overlay can sit above on iOS
        }}
      />

      {/* Mobile-only minus chip INSIDE the input (iOS-safe overlay) */}
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
          style={{
            position: "absolute",
            top: "50%",
            right: 6,
            transform: "translateY(-50%) translateZ(0)", // iOS layer promotion
            WebkitTransform: "translateY(-50%) translateZ(0)",
            height: 44,
            width: 44,
            minHeight: 44,
            minWidth: 44,
            borderRadius: 9999,
            border: "1px solid rgba(0,0,0,0.12)",
            background: "#fff",
            color: "#000",
            fontSize: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
            touchAction: "manipulation",
            zIndex: 5, // sit above input on mobile Safari
            pointerEvents: "auto",
          }}
        >
          <svg
            width="20"
            height="20"
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
