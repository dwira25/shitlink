import { env } from "../config/env.js";
import { LinkRepository } from "../repositories/linkRepository.js";
import { HttpError } from "../utils/http.js";
import { buildShortUrl, normalizeDestinationUrl } from "../utils/url.js";
import { generateSlug, isReservedSlug, normalizeSlug } from "../utils/slug.js";

type LinkMutation = {
  title: string;
  destinationUrl: string;
  slug?: string;
  description?: string;
  expiresAt?: string | null;
  status: "ACTIVE" | "INACTIVE";
  ratingEnabled: boolean;
  minRatingEnabled: boolean;
  minRating: number;
};

export class LinkService {
  constructor(private readonly links = new LinkRepository()) {}

  async list(userId: number, query: Parameters<LinkRepository["list"]>[0]) {
    const result = await this.links.list({ ...query, userId });
    return {
      ...result,
      data: result.data.map((link: { slug: string; expiresAt: Date | null } & Record<string, unknown>) => this.present(link))
    };
  }

  async get(id: number, userId: number) {
    const link = await this.links.findByIdForUser(id, userId);
    if (!link) throw new HttpError(404, "Short link not found");
    return this.present({ ...link, clickCount: link._count.clicks });
  }

  async create(userId: number, input: LinkMutation) {
    const slug = await this.resolveSlug(input.slug);
    const link = await this.createWithUniqueSlug(userId, input, slug);
    return this.present({ ...link, clickCount: 0 });
  }

  async update(id: number, userId: number, input: LinkMutation) {
    await this.get(id, userId);
    const slug = input.slug ? normalizeSlug(input.slug) : undefined;
    if (slug) this.assertSlugAllowed(slug);

    try {
      const link = await this.links.update(id, userId, {
        title: input.title,
        slug,
        destinationUrl: normalizeDestinationUrl(input.destinationUrl),
        description: input.description || null,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        status: input.status,
        ratingEnabled: input.ratingEnabled,
        minRatingEnabled: input.minRatingEnabled,
        minRating: input.minRating
      });
      return this.present({ ...link, clickCount: undefined });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new HttpError(409, "Slug already exists");
      }
      throw error;
    }
  }

  async delete(id: number, userId: number) {
    await this.get(id, userId);
    await this.links.delete(id, userId);
  }

  activate(id: number, userId: number) {
    return this.setStatus(id, userId, "ACTIVE");
  }

  deactivate(id: number, userId: number) {
    return this.setStatus(id, userId, "INACTIVE");
  }

  async bulkStatus(userId: number, ids: number[], status: "ACTIVE" | "INACTIVE") {
    return this.links.updateMany(userId, ids, status);
  }

  async bulkDelete(userId: number, ids: number[]) {
    return this.links.deleteMany(userId, ids);
  }

  private async setStatus(id: number, userId: number, status: "ACTIVE" | "INACTIVE") {
    await this.get(id, userId);
    const link = await this.links.update(id, userId, { status });
    return this.present({ ...link, clickCount: undefined });
  }

  private async resolveSlug(customSlug?: string) {
    if (customSlug) {
      const slug = normalizeSlug(customSlug);
      this.assertSlugAllowed(slug);
      return slug;
    }

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const slug = generateSlug();
      if (!isReservedSlug(slug) && !(await this.links.findBySlug(slug))) {
        return slug;
      }
    }

    throw new HttpError(500, "Unable to generate a unique slug");
  }

  private async createWithUniqueSlug(userId: number, input: LinkMutation, slug: string) {
    try {
      return await this.links.create({
        userId,
        title: input.title,
        slug,
        destinationUrl: normalizeDestinationUrl(input.destinationUrl),
        description: input.description || null,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        status: input.status,
        ratingEnabled: input.ratingEnabled,
        minRatingEnabled: input.minRatingEnabled,
        minRating: input.minRating
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new HttpError(409, "Slug already exists");
      }
      throw error;
    }
  }

  private assertSlugAllowed(slug: string) {
    if (isReservedSlug(slug)) {
      throw new HttpError(422, "Slug is reserved for internal routes");
    }
  }

  private isUniqueConstraintError(error: unknown) {
    return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
  }

  private present<T extends { slug: string; expiresAt: Date | null } & Record<string, unknown>>(link: T) {
    const expired = Boolean(link.expiresAt && link.expiresAt <= new Date());
    return {
      ...link,
      expired,
      shortUrl: buildShortUrl(env.PUBLIC_BASE_URL, link.slug)
    };
  }
}
