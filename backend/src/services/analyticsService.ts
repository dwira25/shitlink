import type { Request } from "express";
import { createRequire } from "node:module";
import { UAParser } from "ua-parser-js";
import { prisma } from "../config/prisma.js";

const require = createRequire(import.meta.url);

type CountedLink = {
  id: number;
  title: string;
  slug: string;
  createdAt?: Date;
  _count: { clicks: number };
};

type NullableGroup = {
  ipAddress?: string | null;
  device?: string | null;
  browser?: string | null;
  os?: string | null;
  _count: number;
};

export class AnalyticsService {
  recordClick(linkId: number, req: Request) {
    const ip = this.extractIp(req);
    const userAgent = req.get("user-agent") || "";
    const parsed = new UAParser(userAgent).getResult();

    // Lazy-loaded: geoip-lite reads its data files on first require, which would
    // otherwise slow down server startup. The redirect path never waits on this.
    let country: string | null = null;
    if (ip) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const geoip = require("geoip-lite") as typeof import("geoip-lite");
        country = geoip.lookup(ip)?.country || null;
      } catch {
        country = null;
      }
    }

    void prisma.click.create({
      data: {
        linkId,
        ipAddress: ip,
        userAgent,
        referer: req.get("referer") || null,
        device: parsed.device.type || "desktop",
        browser: parsed.browser.name || "Unknown",
        os: parsed.os.name || "Unknown",
        country
      }
    }).catch((error: unknown) => {
      console.error("Failed to record click", error);
    });
  }

  async summary(userId: number) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const whereByUser = { link: { userId } };
    const [totalClicks, uniqueIps, clicksToday, clicksThisWeek, clicksThisMonth, topLinks, recentClicks] =
      await prisma.$transaction([
        prisma.click.count({ where: whereByUser }),
        prisma.click.groupBy({ by: ["ipAddress"], where: whereByUser }),
        prisma.click.count({ where: { ...whereByUser, clickedAt: { gte: startOfToday } } }),
        prisma.click.count({ where: { ...whereByUser, clickedAt: { gte: startOfWeek } } }),
        prisma.click.count({ where: { ...whereByUser, clickedAt: { gte: startOfMonth } } }),
        prisma.link.findMany({
          where: { userId },
          take: 10,
          include: { _count: { select: { clicks: true } } },
          orderBy: { clicks: { _count: "desc" } }
        }),
        prisma.click.findMany({
          where: whereByUser,
          take: 10,
          orderBy: { clickedAt: "desc" },
          include: { link: { select: { title: true, slug: true } } }
        })
      ]);

    const clicksPerDay = await this.clicksPerDay(userId, 30);
    const [deviceBreakdown, browserBreakdown, osBreakdown] = await Promise.all([
      this.breakdown(userId, "device"),
      this.breakdown(userId, "browser"),
      this.breakdown(userId, "os")
    ]);

    return {
      totalClicks,
      uniqueClicks: (uniqueIps as NullableGroup[]).filter((row: NullableGroup) => row.ipAddress).length,
      clicksToday,
      clicksThisWeek,
      clicksThisMonth,
      topLinks: (topLinks as CountedLink[]).map((link: CountedLink) => ({ id: link.id, title: link.title, slug: link.slug, clicks: link._count.clicks })),
      recentClicks,
      clicksPerDay,
      deviceBreakdown,
      browserBreakdown,
      osBreakdown
    };
  }

  async dashboard(userId: number) {
    const now = new Date();
    const [totalLinks, activeLinks, inactiveLinks, totalClicks, recentLinks, analytics] = await prisma.$transaction([
      prisma.link.count({ where: { userId } }),
      prisma.link.count({ where: { userId, status: "ACTIVE", OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] } }),
      prisma.link.count({ where: { userId, status: "INACTIVE" } }),
      prisma.click.count({ where: { link: { userId } } }),
      prisma.link.findMany({ where: { userId }, take: 8, orderBy: { createdAt: "desc" }, include: { _count: { select: { clicks: true } } } }),
      prisma.click.findMany({
        where: { link: { userId } },
        take: 8,
        orderBy: { clickedAt: "desc" },
        include: { link: { select: { title: true, slug: true } } }
      })
    ]);

    return {
      totalLinks,
      totalClicks,
      activeLinks,
      inactiveLinks,
      qrCodes: totalLinks,
      recentLinks: (recentLinks as CountedLink[]).map((link: CountedLink) => ({ id: link.id, title: link.title, slug: link.slug, clicks: link._count.clicks, createdAt: link.createdAt })),
      recentClicks: analytics,
      clicksPerDay: await this.clicksPerDay(userId, 14),
      topLinks: (await this.summary(userId)).topLinks
    };
  }

  async statsForLink(userId: number, linkId: number) {
    const link = await prisma.link.findFirst({ where: { id: linkId, userId } });
    if (!link) return null;

    const [totalClicks, uniqueIps, recentClicks] = await prisma.$transaction([
      prisma.click.count({ where: { linkId } }),
      prisma.click.groupBy({ by: ["ipAddress"], where: { linkId } }),
      prisma.click.findMany({ where: { linkId }, take: 50, orderBy: { clickedAt: "desc" } })
    ]);

    return {
      link,
      totalClicks,
      uniqueClicks: (uniqueIps as NullableGroup[]).filter((row: NullableGroup) => row.ipAddress).length,
      recentClicks,
      clicksPerDay: await this.clicksPerDay(userId, 30, linkId),
      deviceBreakdown: await this.breakdown(userId, "device", linkId),
      browserBreakdown: await this.breakdown(userId, "browser", linkId),
      osBreakdown: await this.breakdown(userId, "os", linkId)
    };
  }

  private async clicksPerDay(userId: number, days: number, linkId?: number) {
    const start = new Date();
    start.setDate(start.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);

    const clicks = await prisma.click.findMany({
      where: { link: { userId }, linkId, clickedAt: { gte: start } },
      select: { clickedAt: true }
    });

    const buckets = new Map<string, number>();
    for (let offset = 0; offset < days; offset += 1) {
      const date = new Date(start);
      date.setDate(start.getDate() + offset);
      buckets.set(date.toISOString().slice(0, 10), 0);
    }

    for (const click of clicks) {
      const key = click.clickedAt.toISOString().slice(0, 10);
      buckets.set(key, (buckets.get(key) || 0) + 1);
    }

    return Array.from(buckets.entries()).map(([date, clicks]) => ({ date, clicks }));
  }

  private async breakdown(userId: number, field: "device" | "browser" | "os", linkId?: number) {
    const rows = await prisma.click.groupBy({
      by: [field],
      where: { link: { userId }, linkId },
      _count: true,
      orderBy: { _count: { [field]: "desc" } },
      take: 10
    });

    return (rows as NullableGroup[])
      .map((row: NullableGroup) => ({ label: String(row[field] || "Unknown"), value: row._count }))
      .sort((a: { value: number }, b: { value: number }) => b.value - a.value);
  }

  private extractIp(req: Request) {
    const forwarded = req.headers["x-forwarded-for"];
    const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0];
    return (ip || req.socket.remoteAddress || "").replace("::ffff:", "") || null;
  }
}
