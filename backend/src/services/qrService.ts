import QRCode from "qrcode";
import { env } from "../config/env.js";
import { buildShortUrl } from "../utils/url.js";

export class QrService {
  async svg(slug: string) {
    return QRCode.toString(buildShortUrl(env.PUBLIC_BASE_URL, slug), {
      type: "svg",
      margin: 2,
      errorCorrectionLevel: "M"
    });
  }

  async png(slug: string) {
    return QRCode.toBuffer(buildShortUrl(env.PUBLIC_BASE_URL, slug), {
      type: "png",
      margin: 2,
      width: 1024,
      errorCorrectionLevel: "M"
    });
  }
}
