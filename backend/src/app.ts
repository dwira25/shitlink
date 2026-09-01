import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { randomBytes } from "node:crypto";
import { env } from "./config/env.js";
import { requireCsrf } from "./middleware/authMiddleware.js";
import { errorMiddleware, notFoundMiddleware } from "./middleware/errorMiddleware.js";
import { apiRateLimit } from "./middleware/rateLimit.js";
import { apiRoutes } from "./routes/index.js";
import { redirectSlug } from "./controllers/redirectController.js";
import { ratingHtmlPage } from "./controllers/ratingController.js";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);

  // Per-request nonce so the public rating page can run its inline script
  // under Helmet's CSP (script-src 'self') without weakening it to 'unsafe-inline'.
  app.use((_req, res, next) => {
    res.locals.nonce = randomBytes(16).toString("hex");
    next();
  });

  const csp = helmet.contentSecurityPolicy.getDefaultDirectives();
  csp["script-src"] = ["'self'", (_req, res) => `'nonce-${res.locals.nonce}'`];

  app.use(helmet({ contentSecurityPolicy: { directives: csp } }));
  app.use(cors({ origin: env.APP_ORIGIN, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(requireCsrf);

  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.use("/api", apiRateLimit, apiRoutes);
  app.get("/r/:slug", ratingHtmlPage);
  app.get("/:slug", redirectSlug);
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
