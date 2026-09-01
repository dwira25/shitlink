import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchAnalytics, fetchDashboard } from "../analyticsService";

vi.mock("../api", () => ({
  api: { get: vi.fn() }
}));

import { api } from "../api";

const mockedGet = vi.mocked(api.get);

beforeEach(() => {
  mockedGet.mockReset();
});

describe("analytics service", () => {
  it("fetches the analytics summary", async () => {
    mockedGet.mockResolvedValueOnce({
      data: { success: true, data: { totalClicks: 42 } }
    });
    const result = await fetchAnalytics();
    expect(mockedGet).toHaveBeenCalledWith("/analytics");
    expect(result.totalClicks).toBe(42);
  });

  it("fetches the dashboard summary", async () => {
    mockedGet.mockResolvedValueOnce({
      data: { success: true, data: { totalLinks: 3, qrCodes: 3 } }
    });
    const result = await fetchDashboard();
    expect(mockedGet).toHaveBeenCalledWith("/analytics/dashboard");
    expect(result.totalLinks).toBe(3);
  });
});
