import React from "react";
import { useNavigate } from "react-router-dom";

/** Build a safe mailto URL */
function mailtoUrl(to: string, subject: string, body: string) {
  const enc = (s: string) => encodeURIComponent(s);
  return `mailto:${encodeURIComponent(to)}?subject=${enc(subject)}&body=${enc(body)}`;
}

/** Light/dark palette identical to your modal */
function usePanelColors() {
  const isDark =
    typeof document !== "undefined" &&
    (document.body.getAttribute("data-theme") === "dark" ||
      document.body.classList.contains("dark") ||
      document.documentElement.classList.contains("dark"));

  return {
    isDark,
    panelBg: isDark ? "#1f2937" : "#ffffff",
    panelBorder: isDark ? "#334155" : "#e5e7eb",
    panelText: isDark ? "#f8fafc" : "#111827",
    subText: isDark ? "#e5e7eb" : "#374151",
    helperText: isDark ? "#94a3b8" : "#64748b",
    inputBg: isDark ? "#0f172a" : "#ffffff",
  };
}

export default function Feedback() {
  const navigate = useNavigate();
  const [msg, setMsg] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const { panelBg, panelBorder, panelText, subText, helperText, inputBg } = usePanelColors();

  // analytics: page opened
  React.useEffect(() => {
    try {
      void fetch("/api/track", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ event: "feedback_open", ts: Date.now() }),
        keepalive: true,
      });
    } catch {}
  }, []);

  function trackFeedbackSend() {
    try {
      void fetch("/api/track", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          event: "feedback_send_click",
          from: email || null,
          length: msg.length,
          ts: Date.now(),
        }),
        keepalive: true,
      });
    } catch {}
  }

  const onSend = () => {
    if (msg.trim().length < 3 || sending) return;

    trackFeedbackSend();
    setSending(true);

    // Compose the email
    const to = "feedback@micromath.app"; // change to your inbox later
    const subject = "MicroMath feedback";
    const body =
      (email ? `From: ${email}\n\n` : "") +
      `Feedback:\n${msg}\n\n---\nDevice: ${navigator.userAgent}`;
    const url = mailtoUrl(to, subject, body);

    // Open mail client (no backend required)
    window.location.href = url;

    // Navigate home shortly after
    setTimeout(() => {
      setSending(false);
      navigate("/", { replace: false });
    }, 400);
  };

  const canSend = msg.trim().length >= 3 && !sending;
  const counter = `${Math.min(msg.length, 500)}/500`;

  return (
    <div
      style={{
        // Centered layout + mobile gutters
        maxWidth: "100%",
        padding: "16px",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <section
        aria-label="Give feedback"
        style={{
          width: "100%",
          maxWidth: 560, // ✅ desktop cap
          background: panelBg,
          color: panelText,
          border: `1px solid ${panelBorder}`,
          borderRadius: 12,
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          padding: 20, // ✅ comfortable on mobile
        }}
      >
        {/* Title + subtext */}
        <div style={{ marginBottom: 10 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Give feedback</h1>
          <p style={{ margin: "6px 0 0", color: subText }}>
            Tell us what worked and what didn’t. Short and honest is perfect.
          </p>
        </div>

        {/* Email (optional) */}
        <label
          htmlFor="fb-email"
          style={{ display: "block", fontSize: 14, fontWeight: 600, marginTop: 6, marginBottom: 6 }}
        >
          Your email <span style={{ fontWeight: 400, color: helperText }}>(optional, for reply)</span>
        </label>
        <input
          id="fb-email"
          type="email"
          value={email}
          inputMode="email"
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 8,
            border: `1px solid ${panelBorder}`,
            background: inputBg,
            color: panelText,
            outline: "none",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              // Move focus to textarea for fast flow
              const t = document.getElementById("fb-msg") as HTMLTextAreaElement | null;
              t?.focus();
            }
          }}
        />

        {/* Feedback text */}
        <label
          htmlFor="fb-msg"
          style={{
            display: "block",
            fontSize: 14,
            fontWeight: 600,
            marginTop: 14,
            marginBottom: 6,
          }}
        >
          Your feedback
        </label>
        <textarea
          id="fb-msg"
          rows={7}
          value={msg}
          onChange={(e) => setMsg(e.target.value.slice(0, 500))}
          placeholder="What should we improve?"
          aria-describedby="fb-helper fb-count"
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 8,
            border: `1px solid ${panelBorder}`,
            background: inputBg,
            color: panelText,
            outline: "none",
            lineHeight: 1.5,
            resize: "vertical",
            minHeight: 120,
          }}
        />

        {/* helper + counter */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginTop: 6,
            marginBottom: 10,
            color: helperText,
            fontSize: 12,
          }}
        >
          <span id="fb-helper">A few words are enough.</span>
          <span id="fb-count">{counter}</span>
        </div>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={onSend}
            disabled={!canSend}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "none",
              background: canSend ? "#2563eb" : "rgba(37,99,235,0.5)",
              color: "white",
              cursor: canSend ? "pointer" : "not-allowed",
              fontWeight: 700,
            }}
            aria-label="Send feedback (opens your email app)"
          >
            {sending ? "Opening…" : "Send feedback"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/", { replace: false })}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: `1px solid ${panelBorder}`,
              background: inputBg,
              color: panelText,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Back to Home
          </button>
        </div>

        {/* Footnote */}
        <p style={{ margin: "10px 0 0", color: helperText, fontSize: 12 }}>
          “Send feedback” opens your email app with a prefilled message. No login required.
        </p>
      </section>
    </div>
  );
}
