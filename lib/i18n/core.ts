import { DEFAULT_LOCALE } from "./constants";
import { arMessages } from "./messages/ar";
import type { Locale, MessageValue, Messages } from "./types";

function isMessagesObject(value: MessageValue | undefined): value is Messages {
  return typeof value === "object" && value !== null;
}

function resolveMessage(messages: Messages, key: string): string | undefined {
  const parts = key.split(".");
  let current: MessageValue | undefined = messages;
  for (const part of parts) {
    if (!isMessagesObject(current)) return undefined;
    current = current[part];
  }
  return typeof current === "string" ? current : undefined;
}

export function normalizeLocale(_raw?: string | null): Locale {
  return DEFAULT_LOCALE;
}

export function getDir(_locale?: Locale): "rtl" {
  return "rtl";
}

export function getMessages(_locale?: Locale): Messages {
  return arMessages;
}

export function makeTranslator(_locale?: Locale) {
  const messages = getMessages();
  return (key: string, fallback?: string): string => {
    return resolveMessage(messages, key) ?? fallback ?? key;
  };
}
