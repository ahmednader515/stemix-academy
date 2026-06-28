import { Almarai, Cairo, Tajawal } from "next/font/google";

export const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["600", "700", "800", "900"],
  display: "swap",
});

export const almarai = Almarai({
  variable: "--font-almarai",
  subsets: ["arabic"],
  weight: ["700", "800"],
  display: "swap",
});

export const fontVariableClasses = `${tajawal.variable} ${cairo.variable} ${almarai.variable}`;
