// src/utils/shareText.ts
export async function shareText(text: string): Promise<"shared" | "copied"> {
  try {
    if (navigator.share) {
      await navigator.share({ text });
      return "shared";
    }
  } catch {
    // fall through to clipboard
  }
  await navigator.clipboard.writeText(text);
  return "copied";
}
