import { DEFAULT_LOCALE } from "./constants";
import { getMessages, makeTranslator } from "./core";
import type { Locale } from "./types";

export async function getLocaleFromCookie(): Promise<Locale> {
  return DEFAULT_LOCALE;
}

export async function getServerMessages() {
  return getMessages();
}

export async function getServerTranslator() {
  return makeTranslator();
}
