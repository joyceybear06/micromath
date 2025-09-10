// src/components/ShareButton.tsx
import { useCallback, useState } from "react";
import Toast from "./Toast";
import { buildShareText, getShareUrl } from "../utils/shareText";

type ShareButtonProps = {
  score: number;      // e.g., 8
  total: number;      // e.g., 8
  elapsedMs: number;  // time taken in milliseconds
  className?: string;
};

export default function ShareButton({
  score,
  total,
  elapsedMs,
  className,
}: ShareButtonProps) {
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState("Copied!");

  const share = useCallback(async () => {
    const text = buildShareText({ score, total, elapsedMs });
    const url = getShareUrl();

    // 1) Mobile native share if available
    if (navigator.share) {
      try {
        await navigator.share({ title: "MicroMath", text, url });
        return;
      } catch {
        // user canceled or failed → continue to clipboard fallback
      }
    }

    // 2) Clipboard fallback (desktop or older phones)
    try {
      await navigator.clipboard.writeText(text);
      setToastMsg("Copied!");
      setToastVisible(true);
      return;
    } catch {
      // 3) Last resort prompt
      const ok = window.prompt("Copy this text:", text);
      if (ok !== null) {
        setToastMsg("Ready to paste!");
        setToastVisible(true);
      }
    }
  }, [elapsedMs, score, total]);

  return (
    <>
      <button
        type="button"
        onClick={share}
        aria-label="Share your perfect MicroMath run"
        className={className}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 14px",
          borderRadius: 10,
          border: "1px solid rgba(0,0,0,0.12)",
          background: "#ffffff",
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        Share
      </button>

      <Toast
        message={toastMsg}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />
    </>
  );
}
