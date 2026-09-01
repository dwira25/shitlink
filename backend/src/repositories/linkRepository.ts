import { prisma } from "../config/prisma.js";

type LinkStatus = "ACTIVE" | "INACTIVE";
type LinkWhereInput = Record<string, unknown>;
type LinkOrderByInput = Record<string, unknown>;
type LinkRow = {
  id: number;
  userId: number;
  slug: string;
  destinationUrl: string;
  title: string;
  description: string | null;
  status: LinkStatus;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  _count: { clicks: number };
};

export type LinkListOptions = {
  userId: number;
  page: number;
  limit: number;
  search?: string;
  filter: "all" | "active" | "inactive" | "expired";
  sort: "newest" | "oldest" | "most_clicks" | "least_clicks" | "recently_updated";
};

function buildWhere(options: LinkListOptions): LinkWhereInput {
  const now = new Date();
  const conditions: LinkWhereInput[] = [{ userId: options.userId }];

  if (options.search) {
    conditions.push({
      OR: [
        { title: { contains: options.search } },
        { slug: { contains: options.search } },
        { destinationUrl: { contains: options.search } }
      ]
    });
  }

  if (options.filter === "active") {
    conditions.push({ status: "ACTIVE", OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] });
  }
  if (options.filter === "inactive") {
    conditions.push({ status: "INACTIVE" });
  }
  if (options.filter === "expired") {
    conditions.push({ expiresAt: { lte: now } });
  }

  return { AND: conditions };
}

function buildOrderBy(sort: LinkListOptions["sort"]): LinkOrderByInput {
  if (sort === "oldest") return { createdAt: "asc" };
  if (sort === "recently_updated") return { updatedAt: "desc" };
  return { createdAt: "desc" };
}

export class LinkRepository {
  async list(options: LinkListOptions) {
    const where = buildWhere(options);
    const skip = (options.page - 1) * options.limit;
    const [total, rows] = await prisma.$transaction([
      prisma.link.count({ where }),
      prisma.link.findMany({
        where,
        skip,
        take: options.limit,
        orderBy: buildOrderBy(options.sort),
        include: { _count: { select: { clicks: true } } }
      })
    ]);

    const data = (rows as LinkRow[]).map((row: LinkRow) => ({
      ...row,
      clickCount: row._count.clicks
    }));

    if (options.sort === "most_clicks") {
      data.sort((a: LinkRow & { clickCount: number }, b: LinkRow & { clickCount: number }) => b.clickCount - a.clickCount);
    }
    if (options.sort === "least_clicks") {
      data.sort((a: LinkRow & { clickCount: number }, b: LinkRow & { clickCount: number }) => a.clickCount - b.clickCount);
    }

    return { data, total };
  }

  findByIdForUser(id: number, userId: number) {
    return prisma.link.findFirst({
      where: { id, userId },
      include: { _count: { select: { clicks: true } } }
    });
  }

  findBySlug(slug: string) {
    return prisma.link.findUnique({ where: { slug } });
  }

  create(data: {
    userId: number;
    title: string;
    slug: string;
    destinationUrl: string;
    description?: string | null;
    expiresAt?: Date | null;
    status: LinkStatus;
    ratingEnabled?: boolean;
    minRatingEnabled?: boolean;
    minRating?: number;
  }) {
    return prisma.link.create({ data });
  }

  update(id: number, _userId: number, data: Partial<{
    title: string;
    slug: string;
    destinationUrl: string;
    description: string | null;
    expiresAt: Date | null;
    status: LinkStatus;
    ratingEnabled: boolean;
    minRatingEnabled: boolean;
    minRating: number;
  }>) {
    return prisma.link.update({ where: { id }, data });
  }

  delete(id: number, _userId: number) {
    return prisma.link.delete({ where: { id } });
  }

  updateMany(userId: number, ids: number[], status: LinkStatus) {
    return prisma.link.updateMany({ where: { userId, id: { in: ids } }, data: { status } });
  }

  deleteMany(userId: number, ids: number[]) {
    return prisma.link.deleteMany({ where: { userId, id: { in: ids } } });
  }
}
