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
  // PHONE-ONLY (strict: iPhone or Android phone + touch)
  const [isPhone, setIsPhone] = useState(false);
  useEffect(() => {
    const detect = () => {
      try {
        const ua = (navigator.userAgent || "").toLowerCase();
        const isIPhone = /iphone/.test(ua);
        const isAndroidPhone = /android/.test(ua) && /mobile/.test(ua);
        const hasTouch =
          (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
          ((navigator as any).msMaxTouchPoints && (navigator as any).msMaxTouchPoints > 0) ||
          typeof (window as any).ontouchstart !== "undefined";
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

  // Clean keyboard input
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

  // Toggle negative
  function toggleMinus() {
    if (disabled) return;
    const raw = (value ?? "").trim();
    const next = raw.startsWith("-") ? raw.slice(1) : raw ? `-${raw}` : "-";
    onChange(next);
    focusInput();
  }

  // UI constants (compact rectangular chip)
  const CHIP_W = 40;
  const CHIP_H = 28;
  const CHIP_RIGHT = 8;

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
          boxSizing: "border-box",
          // reserve space for the embedded chip ONLY on phones
          paddingRight: isPhone ? CHIP_W + CHIP_RIGHT + 4 : undefined,
          position: "relative",
          zIndex: 1,
        }}
      />

      {/* PHONE ONLY: minimal rectangular minus chip inside the input (no overlap, subtle UI) */}
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
            right: CHIP_RIGHT,
            transform: "translateY(-50%)",
            height: CHIP_H,
            width: CHIP_W,
            minHeight: CHIP_H,
            minWidth: CHIP_W,
            borderRadius: 6, // rectangle
            border: "1px solid rgba(0,0,0,0.12)",
            background: "#F6F8FF", // soft pill look that blends with your UI
            color: "#000",
            fontSize: 0, // icon-only
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 1px 1px rgba(0,0,0,0.04)",
            touchAction: "manipulation",
            zIndex: 5,
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
            style={{ display: "block" }}
          >
            <path
              d="M7 12h10"
              stroke="#1F2937"
              strokeWidth="2.2"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
