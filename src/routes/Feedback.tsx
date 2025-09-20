import React from "react";
import { useNavigate } from "react-router-dom";

/** Build a safe mailto URL */
function mailtoUrl(to: string, subject: string, body: string) {
  const enc = (s: string) => encodeURIComponent(s);
  return `mailto:${encodeURIComponent(to)}?subject=${enc(subject)}&body=${enc(body)}`;
}

export default function Feedback() {
  const navigate = useNavigate();
  const [msg, setMsg] = React.useState("");
  const [email, setEmail] = React.useState("");

  // Optional: analytics that a user opened the feedback page (non-blocking)
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
    if (!msg.trim()) return;

    // 1) fire-and-forget analytics
    trackFeedbackSend();

    // 2) open the user's email client – no backend required
    const to = "feedback@micromath.app"; // TODO: change to your inbox later
    const subject = "MicroMath feedback";
    const body =
      (email ? `From: ${email}\n\n` : "") +
      `Feedback:\n${msg}\n\n---\nDevice: ${navigator.userAgent}`;
    const url = mailtoUrl(to, subject, body);

    window.location.href = url;

    // 3) optional: send them home shortly after launching email app
    setTimeout(() => navigate("/", { replace: false }), 400);
  };

  return (
    <section className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold">Give feedback</h1>
      <p className="mt-2 text-slate-600">
        Tell us what worked and what didn’t. Short and honest is perfect.
      </p>

      <div className="mt-4">
        <label className="block text-sm font-medium mb-1" htmlFor="email">
          Your email (optional)
        </label>
        <input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded border p-3"
        />
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium mb-1" htmlFor="msg">
          Your feedback
        </label>
        <textarea
          id="msg"
          rows={6}
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          className="w-full rounded border p-3"
          placeholder="What should we improve?"
        />
      </div>

      <div className="mt-6 flex gap-2">
        <button
          type="button"
          onClick={onSend}
          disabled={!msg.trim()}
          className="rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
        >
          Send feedback
        </button>
        <button
          type="button"
          onClick={() => navigate("/", { replace: false })}
          className="rounded-md border px-4 py-2"
        >
          Back to Home
        </button>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        “Send feedback” opens your email app with a prefilled message. No login required.
      </p>
    </section>
  );
}
