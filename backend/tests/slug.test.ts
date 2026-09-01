import { describe, expect, it } from "vitest";
import { isReservedSlug } from "../src/utils/slug.js";
import { normalizeDestinationUrl } from "../src/utils/url.js";

describe("slug and URL safety", () => {
  it("blocks reserved slugs case-insensitively", () => {
    expect(isReservedSlug("admin")).toBe(true);
    expect(isReservedSlug("API")).toBe(true);
    expect(isReservedSlug("promo2026")).toBe(false);
  });

  it("allows only http and https destination URLs", () => {
    expect(normalizeDestinationUrl("https://example.com/a")).toBe("https://example.com/a");
    expect(() => normalizeDestinationUrl("javascript:alert(1)")).toThrow();
    expect(() => normalizeDestinationUrl("http://localhost:3000")).toThrow();
  });
});
