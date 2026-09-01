import { prisma } from "../config/prisma.js";
import { HttpError } from "../utils/http.js";
import { isGoogleMapsUrl } from "../utils/url.js";

type PublicLink = {
  id: number;
  slug: string;
  destinationUrl: string;
  status: "ACTIVE" | "INACTIVE";
  expiresAt: Date | null;
  ratingEnabled: boolean;
  minRatingEnabled: boolean;
  minRating: number;
};

export class RatingService {
  async getLinkForRating(slug: string): Promise<PublicLink> {
    const link = await prisma.link.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        destinationUrl: true,
        status: true,
        expiresAt: true,
        ratingEnabled: true,
        minRatingEnabled: true,
        minRating: true
      }
    });
    if (!link) throw new HttpError(404, "Short link not found");
    if (link.status !== "ACTIVE") throw new HttpError(410, "Short link is inactive");
    if (link.expiresAt && link.expiresAt.getTime() < Date.now()) {
      throw new HttpError(410, "Short link expired");
    }
    if (!link.ratingEnabled) throw new HttpError(400, "Rating is not enabled for this link");
    return link;
  }

  async submit(slug: string, score: number, comment?: string, ipAddress?: string) {
    const link = await this.getLinkForRating(slug);

    await prisma.rating.create({
      data: { linkId: link.id, score, comment: comment || null, ipAddress }
    });

    const passedMinimum = !link.minRatingEnabled || score >= link.minRating;

    return {
      passedMinimum,
      redirectUrl: passedMinimum ? link.destinationUrl : null,
      isGoogleMaps: isGoogleMapsUrl(link.destinationUrl)
    };
  }

  async listForLink(linkId: number, userId: number) {
    const link = await prisma.link.findFirst({ where: { id: linkId, userId }, select: { id: true } });
    if (!link) throw new HttpError(404, "Short link not found");
    return prisma.rating.findMany({
      where: { linkId },
      orderBy: { createdAt: "desc" },
      select: { id: true, score: true, comment: true, createdAt: true }
    });
  }
}
