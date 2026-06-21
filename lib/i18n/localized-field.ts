/** Prefer Arabic content; fall back to English DB value if Arabic is empty. */
export function pickLocalizedText(
  arabicValue: string | null | undefined,
  englishValue?: string | null | undefined,
): string {
  const ar = (arabicValue ?? "").trim();
  const en = (englishValue ?? "").trim();
  return ar || en;
}
