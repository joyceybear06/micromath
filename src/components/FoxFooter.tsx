import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import FoxMascot from "../assets/mascot-fox.png";

type Size = "sm" | "same" | "lg";

/**
 * Bottom-center decorative fox rendered via portal into <body>.
 * - position: fixed (sticks to viewport, not the page flow)
 * - very high z-index to sit above headers/footers/modals
 * - pointerEvents: none so it never blocks taps or clicks
 * - uses iOS safe-area inset to avoid the browser bar overlap
 * - defaults to a slightly smaller size ("sm")
 */
export default function FoxFooter({
  size = "sm",
  bottom = 28,                 // px offset from bottom edge
  zIndex = 2147483647,         // max 32-bit int to "win" any stacking context
  debug = false,               // set true to outline the container while testing
}: {
  size?: Size;
  bottom?: number;
  zIndex?: number;
  debug?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const [imgOk, setImgOk] = useState(true);

  useEffect(() => setMounted(true), []);

  // Responsive sizes (match your header scale but slightly smaller by default)
  const sizeClamp =
    size === "sm"
      ? "clamp(44px, 6.2vw, 68px)"  // smaller (recommended for footer)
      : size === "lg"
      ? "clamp(64px, 8vw, 96px)"    // hero
      : "clamp(54px, 7vw, 80px)";   // same as header

  // Respect iOS safe-area and add your requested offset
  const bottomStyle = `calc(env(safe-area-inset-bottom, 0px) + ${bottom}px)`;

  const node = (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        left: "50%",
        bottom: bottomStyle,
        transform: "translateX(-50%)",
        zIndex,
        pointerEvents: "none",
        outline: debug ? "1px dashed rgba(255,0,0,0.5)" : "none",
      }}
    >
      {imgOk ? (
        <img
          src={FoxMascot}
          alt=""
          role="presentation"
          loading="lazy"
          decoding="async"
          onError={() => setImgOk(false)}
          style={{
            height: sizeClamp,
            width: sizeClamp,
            objectFit: "contain",
            display: "block",
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.08))",
          }}
        />
      ) : (
        // Fallback so you SEE something if the asset path is wrong
        <div
          style={{
            height: sizeClamp,
            width: sizeClamp,
            display: "grid",
            placeItems: "center",
            background: "rgba(0,0,0,0.05)",
            borderRadius: 12,
            fontSize: "clamp(20px, 3.5vw, 32px)",
          }}
        >
          🦊
        </div>
      )}
    </div>
  );

  // Portal avoids ancestor transforms/overflow clipping issues
  return mounted ? createPortal(node, document.body) : null;
}
