import React, { useMemo, useRef, useCallback, useState, useEffect } from "react";

type Props = {
  value: string;
  onChange: (val: string) => void;
  allowDecimal?: boolean;
  className?: string;
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
  // Robust mobile detection (post-mount)
  const [showPad, setShowPad] = useState(false);
  useEffect(() => {
    const compute = () => {
      try {
        const w = window as any;
        const coarse = !!(w.matchMedia && w.matchMedia("(pointer: coarse)").matches);
        const hasTouch =
          "ontouchstart" in w ||
          (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
          ((navigator as any).msMaxTouchPoints && (navigator as any).msMaxTouchPoints > 0);
        const ua = (navigator.userAgent || "").toLowerCase();
        const uaMobile = /iphone|ipad|ipod|android|mobile/.test(ua);
        const narrowViewport = Math.min(window.innerWidth, window.innerHeight) <= 900;
        setShowPad(coarse || hasTouch || uaMobile || narrowViewport);
      } catch {
        setShowPad(false);
      }
    };
    compute();
    window.addEventListener("resize", compute);
    window.addEventListener("orientationchange", compute);
    return () => {
      window.removeEventListener("resize", compute);
      window.removeEventListener("orientationchange", compute);
    };
  }, []);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const inputClass = useMemo(() => {
    const hasAnswer = (className || "").split(/\s+/).includes("answer-input");
    return hasAnswer ? className : `${className ? className + " " : ""}answer-input`;
  }, [className]);

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

  const inc = useCallback(() => onPlusClick(), [value, disabled]);
  const dec = useCallback(() => onMinusClick(), [value, disabled]);

  const repeatRef = useRef<number | null>(null);
  const stopRepeat = () => {
    if (repeatRef.current !== null) {
      window.clearInterval(repeatRef.current);
      repeatRef.current = null;
    }
  };
  const startIncrement = (e: React.PointerEvent) => {
    if (disabled) return;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    e.preventDefault();
    inc();
    repeatRef.current = window.setInterval(inc, 180);
  };
  const startDecrement = (e: React.PointerEvent) => {
    if (disabled) return;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    e.preventDefault();
    dec();
    repeatRef.current = window.setInterval(dec, 180);
  };

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

      {showPad && (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            aria-label="Increase"
            onPointerDown={(e) => startIncrement(e)}
            onPointerUp={stopRepeat}
            onPointerCancel={stopRepeat}
            onPointerLeave={stopRepeat}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onPlusClick();
            }}
            disabled={disabled}
            style={btnStyle}
          >
            <PlusIcon />
          </button>
          <button
            type="button"
            aria-label="Decrease"
            onPointerDown={(e) => startDecrement(e)}
            onPointerUp={stopRepeat}
            onPointerCancel={stopRepeat}
            onPointerLeave={stopRepeat}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onMinusClick();
            }}
            disabled={disabled}
            style={btnStyle}
          >
            <MinusIcon />
          </button>
        </div>
      )}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  height: 48,
  width: 48,
  borderRadius: 9999,
  border: "1px solid rgba(0,0,0,0.12)",
  background: "#fff",
  fontSize: 0, // neutralize any global font rules; icon is SVG
  cursor: "pointer",
  boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
  touchAction: "manipulation",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

function PlusIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      style={{ display: "block" }}
    >
      <path
        d="M12 5v14M5 12h14"
        stroke="#000"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function MinusIcon() {
  return (
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
  );
}
