import type { Request, Response } from "express";
import { LinkService } from "../services/linkService.js";
import { QrService } from "../services/qrService.js";
import { AnalyticsService } from "../services/analyticsService.js";
import { asyncHandler, HttpError, ok } from "../utils/http.js";
import { bulkActionSchema, linkMutationSchema, linkQuerySchema } from "../validators/linkValidators.js";

const links = new LinkService();
const qr = new QrService();
const analytics = new AnalyticsService();

function idParam(req: Request) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(422, "Invalid link id");
  return id;
}

export const listLinks = asyncHandler(async (req: Request, res: Response) => {
  const query = linkQuerySchema.parse(req.query);
  const result = await links.list(req.user!.id, { ...query, userId: req.user!.id });
  return ok(res, result.data, {
    page: query.page,
    limit: query.limit,
    total: result.total,
    pages: Math.ceil(result.total / query.limit)
  });
});

export const createLink = asyncHandler(async (req: Request, res: Response) => {
  const input = linkMutationSchema.parse(req.body);
  return ok(res.status(201), await links.create(req.user!.id, input));
});

export const getLink = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await links.get(idParam(req), req.user!.id));
});

export const updateLink = asyncHandler(async (req: Request, res: Response) => {
  const input = linkMutationSchema.parse(req.body);
  return ok(res, await links.update(idParam(req), req.user!.id, input));
});

export const deleteLink = asyncHandler(async (req: Request, res: Response) => {
  await links.delete(idParam(req), req.user!.id);
  return ok(res, { deleted: true });
});

export const activateLink = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await links.activate(idParam(req), req.user!.id));
});

export const deactivateLink = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await links.deactivate(idParam(req), req.user!.id));
});

export const bulkActivate = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = bulkActionSchema.parse(req.body);
  return ok(res, await links.bulkStatus(req.user!.id, ids, "ACTIVE"));
});

export const bulkDeactivate = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = bulkActionSchema.parse(req.body);
  return ok(res, await links.bulkStatus(req.user!.id, ids, "INACTIVE"));
});

export const bulkDelete = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = bulkActionSchema.parse(req.body);
  return ok(res, await links.bulkDelete(req.user!.id, ids));
});

export const getQr = asyncHandler(async (req: Request, res: Response) => {
  const link = await links.get(idParam(req), req.user!.id);
  const format = String(req.query.format || "svg");

  if (format === "png") {
    const png = await qr.png(link.slug);
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Disposition", `attachment; filename="${link.slug}.png"`);
    return res.send(png);
  }

  const svg = await qr.svg(link.slug);
  res.setHeader("Content-Type", "image/svg+xml");
  if (req.query.download === "1") {
    res.setHeader("Content-Disposition", `attachment; filename="${link.slug}.svg"`);
  }
  return res.send(svg);
});

export const getLinkStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await analytics.statsForLink(req.user!.id, idParam(req));
  if (!stats) throw new HttpError(404, "Short link not found");
  return ok(res, stats);
});
