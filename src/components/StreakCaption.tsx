import { FEATURE_STREAKS } from "../config/flags.js";

export default function StreakCaption(props: { text: string }) {
  if (!FEATURE_STREAKS) return null; // extra safety
  return <div className="streak-caption">{props.text}</div>;
}
