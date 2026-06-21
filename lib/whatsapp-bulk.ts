import { isValidEgyptWhatsapp, normalizeEgyptWhatsapp, normalizePhoneDigits } from "@/lib/whatsapp-phone";

export type WhatsappRecipient = {
  id: string;
  name: string;
  whatsappNumber: string;
};

export function buildWhatsappChatUrl(phone: string, message?: string): string | null {
  const normalized = normalizeEgyptWhatsapp(phone) ?? (isValidEgyptWhatsapp(phone) ? normalizePhoneDigits(phone) : null);
  if (!normalized) return null;
  const base = `https://wa.me/${normalized}`;
  const text = message?.trim();
  if (!text) return base;
  return `${base}?text=${encodeURIComponent(text)}`;
}

export function studentsToWhatsappRecipients(
  students: Array<{ id: string; name: string; whatsapp_number?: string | null }>,
): WhatsappRecipient[] {
  const out: WhatsappRecipient[] = [];
  for (const s of students) {
    const raw = s.whatsapp_number?.trim();
    if (!raw) continue;
    const normalized = normalizeEgyptWhatsapp(raw);
    if (!normalized) continue;
    out.push({ id: s.id, name: s.name, whatsappNumber: normalized });
  }
  return out;
}

const OPEN_DELAY_MS = 450;

/** Opens WhatsApp chat tabs sequentially to reduce popup-blocker issues. */
export function openWhatsappChatsSequential(
  recipients: WhatsappRecipient[],
  message: string,
  onEach?: (index: number, recipient: WhatsappRecipient) => void,
): void {
  recipients.forEach((recipient, index) => {
    const url = buildWhatsappChatUrl(recipient.whatsappNumber, message);
    if (!url) return;
    window.setTimeout(() => {
      window.open(url, "_blank", "noopener,noreferrer");
      onEach?.(index, recipient);
    }, index * OPEN_DELAY_MS);
  });
}

export { OPEN_DELAY_MS };
