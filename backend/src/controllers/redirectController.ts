import type { Request, Response } from "express";
import { LinkRepository } from "../repositories/linkRepository.js";
import { AnalyticsService } from "../services/analyticsService.js";
import { asyncHandler, HttpError } from "../utils/http.js";
import { isReservedSlug } from "../utils/slug.js";

const links = new LinkRepository();
const analytics = new AnalyticsService();

export const redirectSlug = asyncHandler(async (req: Request, res: Response) => {
  const slugParam = req.params.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;

  // Never let browsers cache a redirect (or its error), otherwise a stale
  // "expired"/"not found" response can keep showing after the link is fixed.
  res.setHeader("Cache-Control", "no-store");

  if (!slug || isReservedSlug(slug) || slug.includes(".")) {
    throw new HttpError(404, "Short link not found");
  }

  const link = await links.findBySlug(slug);
  if (!link || link.status !== "ACTIVE") {
    throw new HttpError(404, "Short link not found");
  }

  if (link.expiresAt && link.expiresAt <= new Date()) {
    throw new HttpError(410, "Short link expired");
  }

  if (link.ratingEnabled) {
    res.status(302);
    res.setHeader("Location", `/r/${encodeURIComponent(slug)}`);
    return res.end();
  }

  analytics.recordClick(link.id, req);

  // Pure HTTP 302 — no body, no interstitial HTML (Express's res.redirect adds a
  // "Found. Redirecting..." text body, so set the header and end manually).
  res.status(302);
  res.setHeader("Location", link.destinationUrl);
  return res.end();
});
