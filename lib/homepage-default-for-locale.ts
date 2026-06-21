/** Use admin/DB text when set; otherwise fall back to the Arabic i18n message. */
export function homepageDefaultForLocale(
  raw: string,
  _arCanonical: string,
  messageKey: string,
  t: (key: string, fallback?: string) => string,
  fallback: string,
): string {
  return raw || t(messageKey, fallback);
}
