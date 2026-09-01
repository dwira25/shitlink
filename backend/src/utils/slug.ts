import { customAlphabet } from "nanoid";

export const reservedSlugs = new Set([
  "admin",
  "api",
  "login",
  "logout",
  "register",
  "dashboard",
  "settings",
  "links",
  "qr-codes",
  "analytics",
  "profile",
  "assets",
  "favicon.ico",
  "robots.txt"
]);

const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const nanoid = customAlphabet(alphabet, 6);

export function generateSlug() {
  return nanoid();
}

export function normalizeSlug(slug: string) {
  return slug.trim();
}

export function isReservedSlug(slug: string) {
  return reservedSlugs.has(slug.toLowerCase());
}
