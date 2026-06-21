export function normalizePhoneDigits(input: string): string {
  return input.replace(/\D/g, "");
}

export function isValidEgyptWhatsapp(input: string): boolean {
  const digits = normalizePhoneDigits(input);
  return /^20\d{10}$/.test(digits);
}

export function normalizeEgyptWhatsapp(input: string): string | null {
  const digits = normalizePhoneDigits(input);
  return isValidEgyptWhatsapp(digits) ? digits : null;
}
