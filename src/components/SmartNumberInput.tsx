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
  // PHONE-ONLY DETECTION (strict: iPhone or Android Mobile + touch)
  const [isPhone, setIsPhone] = useState(false);
  useEffect(() => {
    const detect = () => {
      try {
        const ua = (navigator.userAgent || "").toLowerCase();
        const hasTouch =
          (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
          ((navigator as any).msMaxTouchPoints && (navigator as any).msMaxTouchPoints > 0) ||
          typeof (window as any).ontouchstart !== "undefined";
        const isIPhone = /iphone/.test(ua);
        const isAndroidPhone = /android/.test(ua) && /mobile/.test(ua);
        // exclude ipads/mac/windows touch laptops by requiring phone UA + touch
        setIsPhone(Boolean(hasTouch && (isIPhone || isAndroidPhone)));
      } catch {
        setIsPhone(false);
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

  // minus toggle (phone only)
  function toggleMinus() {
    if (disabled) return;
    const raw = (value ?? "").trim();
    const next = raw.startsWith("-") ? raw.slice(1) : raw ? `-${raw}` : "-";
    onChange(next);
    focusInput();
  }

  return (
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
          paddingRight: isPhone ? 52 : undefined, // space for the embedded minus
          boxSizing: "border-box",
          position: "relative",
          zIndex: 1,
        }}
      />

      {/* PHONE ONLY: small rectangular minus chip INSIDE the input (no overlap) */}
      {isPhone && (
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
            right: 8,
            transform: "translateY(-50%) translateZ(0)",
            height: 32,        // smaller rectangle
            width: 40,
            minHeight: 32,
            minWidth: 40,
            borderRadius: 6,   // rectangle (not circle)
            border: "1px solid rgba(0,0,0,0.12)",
            background: "#fff",
            color: "#000",
            fontSize: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
            touchAction: "manipulation",
            zIndex: 5,
            pointerEvents: "auto",
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
            style={{ display: "block" }}
          >
            <path
              d="M6 12h12"
              stroke="#000"
              strokeWidth="2.4"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
