import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatVND = (value: number | string) => {
  if (!value) return "";
  return Number(value).toLocaleString("vi-VN");
};
