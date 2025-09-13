import type { ReactNode } from "react";

/**
 * StickyHeader (transparent version)
 * - Keeps the header/timer pinned while scrolling.
 * - Background is fully transparent so it blends with your theme background.
 * - No border or shadow. We keep safe-area top padding for iOS.
 * - No other layout or logic changes.
 */
export default function StickyHeader({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        // IMPORTANT: remove the painted white surface so it matches theme background
        background: "transparent",
        // no blur/overlay — purely transparent
        backdropFilter: "none",
        // Safari is fine without a prefixed property
        paddingTop: "env(safe-area-inset-top)", // iPhone notch safety
        // avoid any accidental borders/shadows
        border: "none",
        boxShadow: "none",
      }}
    >
      {children}
    </div>
  );
}
