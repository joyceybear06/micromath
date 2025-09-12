import React, { useMemo, useRef } from "react";

type Props = {
  value: string;
  onChange: (raw: string) => void;

  className?: string;
  placeholder?: string;
  allowDecimal?: boolean;              // default false
  autoFocus?: boolean;
  inputMode?: "decimal" | "numeric";
  disabled?: boolean;

  // Allow parent (App.tsx) to handle Enter → next, etc.
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
};

/** Robust mobile detection (touch + UA) */
function detectMobile() {
  if (typeof navigator === "undefined" || typeof window === "undefined") {
    return { isIOS: false, isAndroid: false, isTouch: false };
  }
  const ua = navigator.userAgent || "";
  const isIOS =
    /(iPad|iPhone|iPod)/i.test(ua) ||
    (navigator.platform === "MacIntel" && (navigator as any).maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const isTouch = window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
  return { isIOS, isAndroid, isTouch };
}

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
      disabled = false,
      onKeyDown,
    },
    forwardedRef
  ) => {
    const { isIOS, isAndroid, isTouch } = useMemo(detectMobile, []);
    const showPM = isTouch && (isIOS || isAndroid) && !disabled;

    const inputRef = useRef<HTMLInputElement | null>(null);

    // Merge local + forwarded ref
    const setRef = (el: HTMLInputElement | null) => {
      inputRef.current = el;
      if (typeof forwardedRef === "function") forwardedRef(el);
      else if (forwardedRef && "current" in forwardedRef) (forwardedRef as any).current = el;
    };

    const sanitize = (raw: string) => {
      // Normalize weird minus + decimal comma → dot
      let v = raw.replace(/[–—−‒]/g, "-").replace(",", ".");
      // Keep digits, leading '-', and (optionally) one '.'
      v = v.replace(/[^0-9.\-]/g, "");
      v = v.replace(/(?!^)-/g, ""); // only one leading minus
      if (!allowDecimal) v = v.replace(/\./g, "");
      else v = v.replace(/(\..*)\./g, "$1"); // only one dot
      return v;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(sanitize(e.target.value));
    };

    const onPaste: React.ClipboardEventHandler<HTMLInputElement> = (e) => {
      const text = e.clipboardData.getData("text");
      onChange(sanitize(text));
      e.preventDefault();
    };

    // Helpers for ± controls
    const focusToEnd = () => {
      requestAnimationFrame(() => {
        const el = inputRef.current;
        if (!el) return;
        el.focus();
        try {
          const l = el.value.length;
          el.setSelectionRange(l, l);
        } catch {}
      });
    };

    const applyPlus = () => {
      const cur = (value ?? "").replace(/[–—−‒]/g, "-");
      const next = cur.startsWith("-") ? cur.slice(1) : cur.replace(/^\+/, "");
      onChange(next);
      focusToEnd();
    };

    const toggleMinus = () => {
      const cur = (value ?? "").replace(/[–—−‒]/g, "-");
      const next = cur.startsWith("-")
        ? cur.slice(1)
        : cur.length
        ? `-${cur.replace(/^-/, "")}`
        : "-";
      onChange(next);
      focusToEnd();
    };

    return (
      <div className="smart-number-wrap">
        {/* Touch-mobile (iOS/Android) only: small + / − buttons */}
        {showPM && (
          <div className="pm-wrap" aria-hidden="false">
            <button
              type="button"
              className="pm-btn"
              onClick={applyPlus}
              aria-label="Make positive"
              title="Make positive"
            >
              +
            </button>
            <button
              type="button"
              className="pm-btn"
              onClick={toggleMinus}
              aria-label="Toggle minus"
              title="Toggle minus"
            >
              −
            </button>
          </div>
        )}

        <input
          ref={setRef}
          type="text"
          className={className}
          placeholder={placeholder}
          inputMode={inputMode}
          autoFocus={autoFocus}
          disabled={disabled}
          value={value}
          onChange={handleChange}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          autoComplete="off"
          enterKeyHint="done"
        />
      </div>
    );
  }
);

export default SmartNumberInput;
