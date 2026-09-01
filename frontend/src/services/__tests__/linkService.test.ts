import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchLinks, qrUrl } from "../linkService";

vi.mock("../api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}));

import { api } from "../api";

const mockedGet = vi.mocked(api.get);

beforeEach(() => {
  mockedGet.mockReset();
});

describe("fetchLinks", () => {
  it("sends search, filter, sort, and pagination params to the server", async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        success: true,
        data: [],
        meta: { page: 2, limit: 25, total: 0, pages: 1 }
      }
    });

    await fetchLinks({
      page: 2,
      limit: 25,
      search: "promo",
      filter: "active",
      sort: "most_clicks"
    });

    expect(mockedGet).toHaveBeenCalledWith("/links", {
      params: { page: 2, limit: 25, search: "promo", filter: "active", sort: "most_clicks" }
    });
  });
});

describe("qrUrl", () => {
  it("builds a preview URL for svg", () => {
    expect(qrUrl(7, "svg")).toBe("/api/links/7/qr?format=svg");
  });

  it("builds a download URL for png", () => {
    expect(qrUrl(7, "png")).toBe("/api/links/7/qr?format=png");
  });

  it("appends download=1 when requested", () => {
    expect(qrUrl(7, "svg", true)).toBe("/api/links/7/qr?format=svg&download=1");
  });
});
