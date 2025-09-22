// src/components/Toast.tsx
import { useEffect } from "react";

type ToastProps = {
  message: string;
  visible: boolean;
  onHide: () => void;
  durationMs?: number;
};

/** Accessible toast. Screen readers announced via aria-live="polite". */
export default function Toast({
  message,
  visible,
  onHide,
  durationMs = 1400,
}: ToastProps) {
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(onHide, durationMs);
    return () => clearTimeout(t);
  }, [visible, onHide, durationMs]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: "fixed",
        bottom: 16,
        left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(0,0,0,0.85)",
        color: "#fff",
        padding: "10px 14px",
        borderRadius: 10,
        fontSize: 14,
        zIndex: 1000,
        boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
      }}
    >
      {message}
    </div>
  );
}
