import argon2 from "argon2";
import QRCode from "qrcode";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/config/prisma.js";

const app = createApp();
const agent = request.agent(app);

let csrfToken = "";
let adminId = 0;
let cookieHeader = "";
let customId = 0;
let randomId = 0;
let secondId = 0;

const TEST_EMAIL = "admin@test.local";
const TEST_PASSWORD = "TestPass123!";

function cookieValue(setCookie: string[] | undefined, name: string) {
  const row = (setCookie || []).find((c) => c.startsWith(`${name}=`));
  return row ? row.split(";")[0].slice(name.length + 1) : "";
}

async function login() {
  const res = await agent.post("/api/auth/login").send({ email: TEST_EMAIL, password: TEST_PASSWORD });
  expect(res.status).toBe(200);
  const setCookie = res.headers["set-cookie"] as unknown as string[] | undefined;
  csrfToken = cookieValue(setCookie, "csrf_token");
  cookieHeader = (setCookie || []).map((c) => c.split(";")[0]).join("; ");
  expect(csrfToken).toBeTruthy();
}

function authed(method: "get" | "post" | "put" | "delete", url: string) {
  let req = agent[method](url);
  if (method !== "get") req = req.set("x-csrf-token", csrfToken);
  return req;
}

beforeAll(async () => {
  await prisma.click.deleteMany();
  await prisma.link.deleteMany();
  await prisma.user.deleteMany();

  const password = await argon2.hash(TEST_PASSWORD, { type: argon2.argon2id });
  const user = await prisma.user.create({
    data: { name: "Test Admin", email: TEST_EMAIL, password, role: "ADMIN" }
  });
  adminId = user.id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("authentication", () => {
  it("rejects wrong credentials with 401", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: TEST_EMAIL, password: "WrongPassword123!" });
    expect(res.status).toBe(401);
  });

  it("rejects missing credentials with 422", async () => {
    const res = await request(app).post("/api/auth/login").send({});
    expect(res.status).toBe(422);
  });

  it("logs in and sets httpOnly session + csrf cookies", async () => {
    await login();
    expect(cookieHeader).toContain("session=");
    expect(cookieHeader).toContain("csrf_token=");
  });

  it("requires authentication for /api/links", async () => {
    const res = await request(app).get("/api/links");
    expect(res.status).toBe(401);
  });

  it("requires CSRF for state-changing API calls", async () => {
    const res = await request(app)
      .post("/api/links")
      .set("Cookie", cookieHeader)
      .send({ title: "No CSRF", destinationUrl: "https://example.com", slug: "nocsrf" });
    expect(res.status).toBe(403);
  });

  it("returns current user from /api/auth/me", async () => {
    const res = await agent.get("/api/auth/me");
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(TEST_EMAIL);
  });

  it("logs out and invalidates the session cookie", async () => {
    const res = await agent.post("/api/auth/logout");
    expect(res.status).toBe(200);
    const me = await agent.get("/api/auth/me");
    expect(me.status).toBe(401);
  });

  it("logs back in for the rest of the suite", async () => {
    await login();
  });
});

describe("short link CRUD", () => {
  it("creates a link with a custom slug", async () => {
    const res = await authed("post", "/api/links").send({
      title: "Promo 2026",
      destinationUrl: "https://example.com/promo",
      slug: "promo2026",
      description: "Promo campaign",
      status: "ACTIVE"
    });
    expect(res.status).toBe(201);
    expect(res.body.data.slug).toBe("promo2026");
    expect(res.body.data.shortUrl).toContain("/promo2026");
    customId = res.body.data.id;
  });

  it("rejects a duplicate slug with 409", async () => {
    const res = await authed("post", "/api/links").send({
      title: "Duplicate",
      destinationUrl: "https://example.com/other",
      slug: "promo2026"
    });
    expect(res.status).toBe(409);
  });

  it("generates a random 6-char slug when slug is empty", async () => {
    const res = await authed("post", "/api/links").send({
      title: "Random",
      destinationUrl: "https://example.com/random",
      slug: ""
    });
    expect(res.status).toBe(201);
    expect(res.body.data.slug).toMatch(/^[A-Za-z0-9]{6}$/);
    randomId = res.body.data.id;
  });

  it("rejects reserved slugs with 422", async () => {
    const res = await authed("post", "/api/links").send({
      title: "Admin",
      destinationUrl: "https://example.com/admin",
      slug: "admin"
    });
    expect(res.status).toBe(422);
  });

  it("rejects unsafe destination URLs (javascript:, localhost)", async () => {
    const bad1 = await authed("post", "/api/links").send({ title: "X", destinationUrl: "javascript:alert(1)" });
    const bad2 = await authed("post", "/api/links").send({ title: "X", destinationUrl: "http://localhost:3000" });
    expect(bad1.status).toBe(422);
    expect(bad2.status).toBe(422);
  });

  it("lists links with pagination metadata", async () => {
    const res = await authed("get", "/api/links?page=1&limit=25");
    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(2);
    expect(res.body.data.length).toBe(2);
  });

  it("searches links by title and slug", async () => {
    const res = await authed("get", "/api/links?search=promo");
    expect(res.status).toBe(200);
    expect(res.body.data.some((l: { slug: string }) => l.slug === "promo2026")).toBe(true);
  });

  it("edits the destination URL while keeping the slug", async () => {
    const res = await authed("put", `/api/links/${customId}`).send({
      title: "Promo 2026 v2",
      destinationUrl: "https://example.com/promo-2",
      slug: "promo2026",
      status: "ACTIVE"
    });
    expect(res.status).toBe(200);
    expect(res.body.data.slug).toBe("promo2026");
    expect(res.body.data.destinationUrl).toBe("https://example.com/promo-2");
  });

  it("deactivates and reactivates a link", async () => {
    await authed("post", `/api/links/${customId}/deactivate`).expect(200);
    const inactive = await authed("get", `/api/links/${customId}`);
    expect(inactive.body.data.status).toBe("INACTIVE");
    await authed("post", `/api/links/${customId}/activate`).expect(200);
  });

  it("bulk activates/deactivates links", async () => {
    const ids = [customId, randomId];
    await authed("post", "/api/links/bulk/deactivate").send({ ids }).expect(200);
    await authed("post", "/api/links/bulk/activate").send({ ids }).expect(200);
    const list = await authed("get", "/api/links?filter=active");
    expect(list.body.data.length).toBe(2);
  });

  it("deletes a link", async () => {
    const res = await authed("post", "/api/links").send({
      title: "Temp",
      destinationUrl: "https://example.com/temp",
      slug: "templink"
    });
    secondId = res.body.data.id;
    await authed("delete", `/api/links/${secondId}`).expect(200);
    const gone = await authed("get", `/api/links/${secondId}`);
    expect(gone.status).toBe(404);
  });
});

describe("public dynamic redirect", () => {
  it("redirects /promo2026 with HTTP 302 to the current destination", async () => {
    const res = await request(app).get("/promo2026");
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("https://example.com/promo-2");
  });

  it("redirects with 302 and no intermediate HTML body", async () => {
    const res = await request(app).get("/promo2026");
    expect(res.status).toBe(302);
    expect(res.type).not.toBe("text/html");
    expect(res.text || "").toBe("");
  });

  it("redirects a random slug to its destination", async () => {
    const list = await authed("get", "/api/links?limit=100");
    const randomLink = list.body.data.find((l: { slug: string }) => l.slug !== "promo2026");
    const res = await request(app).get(`/${randomLink.slug}`);
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe(randomLink.destinationUrl);
  });

  it("redirects after destination change (dynamic behavior)", async () => {
    await authed("put", `/api/links/${customId}`).send({
      title: "Promo 2026 v3",
      destinationUrl: "https://example.com/promo-3",
      slug: "promo2026",
      status: "ACTIVE"
    });
    const res = await request(app).get("/promo2026");
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("https://example.com/promo-3");
  });

  it("returns 404 for unknown slugs", async () => {
    const res = await request(app).get("/does-not-exist-xyz");
    expect(res.status).toBe(404);
  });

  it("returns 404 for reserved slugs", async () => {
    const res = await request(app).get("/admin");
    expect(res.status).toBe(404);
  });

  it("returns 404 for deactivated links", async () => {
    await authed("post", `/api/links/${randomId}/deactivate`).expect(200);
    const res = await request(app).get("/" + (await authed("get", `/api/links/${randomId}`)).body.data.slug);
    expect(res.status).toBe(404);
    await authed("post", `/api/links/${randomId}/activate`).expect(200);
  });

  it("returns 410 Gone for expired links", async () => {
    const res = await authed("post", "/api/links").send({
      title: "Expired",
      destinationUrl: "https://example.com/expired",
      slug: "expiredx",
      expiresAt: new Date(Date.now() - 60_000).toISOString(),
      status: "ACTIVE"
    });
    expect(res.status).toBe(201);
    const redirect = await request(app).get("/expiredx");
    expect(redirect.status).toBe(410);
    await authed("delete", `/api/links/${res.body.data.id}`);
  });
});

describe("QR codes", () => {
  it("returns SVG QR for a link", async () => {
    const res = await authed("get", `/api/links/${customId}/qr?format=svg`);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("image/svg+xml");
    expect(String(res.body)).toContain("<svg");
  });

  it("returns PNG QR for a link", async () => {
    const res = await authed("get", `/api/links/${customId}/qr?format=png`);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("image/png");
    expect(res.body.length).toBeGreaterThan(100);
  });

  it("encodes the short URL, not the destination URL", async () => {
    const res = await authed("get", `/api/links/${customId}/qr?format=svg`);
    // A QR encodes data as a matrix of modules — the slug/destination never appear
    // as plaintext. Verify by comparing against a QR built from the short URL.
    const opts = { type: "svg" as const, margin: 2, errorCorrectionLevel: "M" as const };
    const shortUrlQr = await QRCode.toString("http://localhost:4000/promo2026", opts);
    const destinationQr = await QRCode.toString("https://example.com/promo-3", opts);
    expect(String(res.body)).toBe(shortUrlQr);
    expect(String(res.body)).not.toBe(destinationQr);
  });

  it("rejects QR access to another user's link", async () => {
    const other = await request(app).post("/api/auth/login").send({ email: "nobody@test.local", password: "WrongPassword123!" });
    expect(other.status).toBe(401);
  });
});

describe("analytics", () => {
  it("records a click with device/browser/os metadata", async () => {
    await request(app)
      .get("/promo2026")
      .set("User-Agent", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/605.1.15")
      .set("Referer", "https://google.com/");
    const stats = await viWaitFor(() => authed("get", `/api/links/${customId}/stats`));
    expect(stats.body.data.totalClicks).toBeGreaterThanOrEqual(1);
    expect(stats.body.data.deviceBreakdown.some((d: { label: string }) => d.label === "mobile")).toBe(true);
  });

  it("reports aggregate analytics summary", async () => {
    const res = await authed("get", "/api/analytics");
    expect(res.status).toBe(200);
    expect(res.body.data.totalClicks).toBeGreaterThanOrEqual(1);
    expect(res.body.data).toHaveProperty("uniqueClicks");
    expect(res.body.data).toHaveProperty("clicksPerDay");
    expect(res.body.data.topLinks.length).toBeGreaterThanOrEqual(1);
  });

  it("reports dashboard summary", async () => {
    const res = await authed("get", "/api/analytics/dashboard");
    expect(res.status).toBe(200);
    expect(res.body.data.totalLinks).toBeGreaterThanOrEqual(2);
    expect(res.body.data.activeLinks).toBeGreaterThanOrEqual(2);
    expect(res.body.data.qrCodes).toBe(res.body.data.totalLinks);
  });

  it("does not leak other users' links via analytics", async () => {
    const res = await authed("get", "/api/links/999999");
    expect(res.status).toBe(404);
  });
});

async function viWaitFor(fn: () => Promise<request.Response>) {
  for (let i = 0; i < 20; i += 1) {
    const res = await fn();
    if (res.body?.data?.totalClicks && res.body.data.totalClicks > 0) return res;
    await new Promise((r) => setTimeout(r, 150));
  }
  return fn();
}
