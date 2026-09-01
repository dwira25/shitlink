import { HttpError } from "./http.js";

const blockedProtocols = new Set(["file:", "ftp:", "gopher:", "data:", "javascript:"]);

export function normalizeDestinationUrl(value: string) {
  const url = new URL(value.trim());

  if (!["http:", "https:"].includes(url.protocol) || blockedProtocols.has(url.protocol)) {
    throw new HttpError(422, "Destination URL must use http or https");
  }

  const hostname = url.hostname.toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    throw new HttpError(422, "Localhost destination URLs are not allowed");
  }

  return url.toString();
}

export function buildShortUrl(baseUrl: string, slug: string) {
  return `${baseUrl.replace(/\/$/, "")}/${encodeURIComponent(slug)}`;
}

export function isGoogleMapsUrl(value: string) {
  try {
    const hostname = new URL(value).hostname.toLowerCase();
    return (
      hostname === "maps.google.com" ||
      hostname.endsWith(".maps.google.com") ||
      hostname === "goo.gl" ||
      hostname === "maps.app.goo.gl" ||
      (hostname === "google.com" && value.includes("/maps")) ||
      hostname.endsWith(".google.com") && value.includes("/maps")
    );
  } catch {
    return false;
  }
}
