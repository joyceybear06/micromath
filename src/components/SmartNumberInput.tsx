import React from "react";

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

/** Robust iOS detection, including iPadOS 13+ which identifies as "Mac" */
const isIOS =
  typeof navigator !== "undefined" &&
  (/(iPad|iPhone|iPod)/i.test(navigator.userAgent || "") ||
    (navigator.platform === "MacIntel" && (navigator as any).maxTouchPoints > 1));

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
    const inputRef = React.useRef<HTMLInputElement | null>(null);

    // Merge our local ref with the forwarded one
    const setRef = (el: HTMLInputElement | null) => {
      inputRef.current = el;
      if (typeof forwardedRef === "function") forwardedRef(el);
      else if (forwardedRef && "current" in forwardedRef) (forwardedRef as any).current = el;
    };

    const sanitize = (raw: string) => {
      // Normalize exotic minus and decimal comma
      let v = raw.replace(/[–—−]/g, "-").replace(",", ".");
      // Keep digits, optional leading '-', and optionally a single '.'
      v = v.replace(/[^0-9.\-]/g, "");
      v = v.replace(/(?!^)-/g, ""); // only one leading minus
      if (!allowDecimal) v = v.replace(/\./g, "");
      else v = v.replace(/(\..*)\./g, "$1"); // only one dot
      return v;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(sanitize(e.target.value));
    };

    const toggleSign = () => {
      if (disabled) return;
      const cur = (value ?? "").replace(/[–—−]/g, "-");
      const next = cur.startsWith("-")
        ? cur.slice(1)
        : cur.length
        ? `-${cur.replace(/^-/, "")}`
        : "-";
      onChange(next);
      // Keep focus + move caret to end so user continues typing naturally
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

    // Styles are inline and use your CSS variables so they auto-theme
    const wrapStyle: React.CSSProperties = {
      position: "relative",
      display: "inline-block",
    };

    const inputStyle: React.CSSProperties =
      isIOS && !disabled
        ? { paddingLeft: 34 } // make room for the little ± inside the field
        : {};

    const buttonStyle: React.CSSProperties = {
      position: "absolute",
      left: 6,
      top: "50%",
      transform: "translateY(-50%)",
      width: 24,
      height: 24,
      borderRadius: 6,
      border: "1px solid var(--border)",
      background: "var(--card)",
      color: "var(--text)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      lineHeight: 1,
      fontWeight: 700,
      fontSize: 14,
      cursor: "pointer",
      userSelect: "none",
      padding: 0,
    };

    return (
      <div style={wrapStyle}>
        {/* iOS-only minus toggle; hidden elsewhere; also hide when disabled */}
        {isIOS && !disabled && (
          <button
            type="button"
            aria-label="Toggle negative sign"
            title="Toggle negative sign"
            onClick={toggleSign}
            style={buttonStyle}
          >
            ±
          </button>
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
          autoComplete="off"
          enterKeyHint="done"
          style={inputStyle}
        />
      </div>
    );
  }
);

export default SmartNumberInput;
