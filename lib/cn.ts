// lib/cn.ts — class-name merge helper (clsx + tailwind-merge).
// Keeps conditional Tailwind classes conflict-free across the UI.
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
