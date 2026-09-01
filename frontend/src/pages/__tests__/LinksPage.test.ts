import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LinksPage from "../LinksPage.vue";
import type { ShortLink } from "../../types";

const fetchLinksMock = vi.fn();
const createLinkMock = vi.fn();
const deleteLinkMock = vi.fn();
const bulkLinksMock = vi.fn();

vi.mock("../../services/linkService", () => ({
  fetchLinks: (...args: unknown[]) => fetchLinksMock(...args),
  createLink: (...args: unknown[]) => createLinkMock(...args),
  updateLink: vi.fn(),
  deleteLink: (...args: unknown[]) => deleteLinkMock(...args),
  bulkLinks: (...args: unknown[]) => bulkLinksMock(...args),
  qrUrl: (id: number, format: string, download = false) =>
    `/api/links/${id}/qr?format=${format}${download ? "&download=1" : ""}`
}));

const links: ShortLink[] = [
  {
    id: 1,
    userId: 1,
    slug: "promo2026",
    destinationUrl: "https://example.com/promo",
    title: "Promo 2026",
    status: "ACTIVE",
    expiresAt: null,
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    clickCount: 5420,
    shortUrl: "http://localhost:4000/promo2026",
    ratingEnabled: false,
    minRatingEnabled: false,
    minRating: 3,
    expired: false
  },
  {
    id: 2,
    userId: 1,
    slug: "X92kL",
    destinationUrl: "https://example.com/product-b",
    title: "Product B",
    status: "INACTIVE",
    expiresAt: null,
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    clickCount: 843,
    shortUrl: "http://localhost:4000/X92kL",
    ratingEnabled: false,
    minRatingEnabled: false,
    minRating: 3,
    expired: false
  }
];

function mockPage(result: { data: ShortLink[]; meta: Record<string, number> }) {
  fetchLinksMock.mockResolvedValue({
    success: true,
    data: result.data,
    meta: result.meta
  });
}

describe("LinksPage", () => {
  beforeEach(() => {
    fetchLinksMock.mockReset();
    createLinkMock.mockReset();
    deleteLinkMock.mockReset();
    bulkLinksMock.mockReset();
  });

  it("loads and renders links with click counts", async () => {
    mockPage({ data: links, meta: { page: 1, limit: 25, total: 2, pages: 1 } });
    const wrapper = mount(LinksPage, { global: { stubs: { LinkFormModal: true } } });
    await flushPromises();

    expect(wrapper.text()).toContain("Promo 2026");
    expect(wrapper.text()).toContain("Product B");
    expect(wrapper.text()).toContain("5,420");
    expect(wrapper.text()).toContain("843");
    expect(fetchLinksMock).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 25, filter: "all", sort: "newest" })
    );
  });

  it("re-fetches when search changes (server-side search)", async () => {
    mockPage({ data: [links[0]], meta: { page: 1, limit: 25, total: 1, pages: 1 } });
    const wrapper = mount(LinksPage, { global: { stubs: { LinkFormModal: true } } });
    await flushPromises();

    const input = wrapper.find('input[placeholder*="Search"]');
    await input.setValue("promo");
    await input.trigger("keyup.enter");
    await flushPromises();

    const lastCall = fetchLinksMock.mock.calls.at(-1)?.[0];
    expect(lastCall.search).toBe("promo");
  });

  it("bulk action buttons are disabled when nothing is selected", async () => {
    mockPage({ data: links, meta: { page: 1, limit: 25, total: 2, pages: 1 } });
    const wrapper = mount(LinksPage, { global: { stubs: { LinkFormModal: true } } });
    await flushPromises();

    const buttons = wrapper.findAll("button");
    const bulkDelete = buttons.find((b) => b.text().includes("Bulk Delete"));
    expect(bulkDelete?.attributes("disabled")).toBeDefined();
  });

  it("selecting rows enables bulk actions and calls bulk API", async () => {
    mockPage({ data: links, meta: { page: 1, limit: 25, total: 2, pages: 1 } });
    bulkLinksMock.mockResolvedValue({ data: { success: true } });
    const wrapper = mount(LinksPage, { global: { stubs: { LinkFormModal: true } } });
    await flushPromises();

    const checkboxes = wrapper.findAll('input[type="checkbox"]');
    await checkboxes[1].setValue(true); // row 1
    await checkboxes[2].setValue(true); // row 2

    const buttons = wrapper.findAll("button");
    const bulkDeactivate = buttons.find((b) => b.text().includes("Bulk Deactivate"));
    expect(bulkDeactivate?.attributes("disabled")).toBeUndefined();

    await bulkDeactivate?.trigger("click");
    await flushPromises();
    expect(bulkLinksMock).toHaveBeenCalledWith("deactivate", [1, 2]);
  });

  it("pagination buttons send the next page", async () => {
    mockPage({ data: links, meta: { page: 1, limit: 10, total: 30, pages: 3 } });
    const wrapper = mount(LinksPage, { global: { stubs: { LinkFormModal: true } } });
    await flushPromises();

    const buttons = wrapper.findAll("button");
    const next = buttons.find((b) => b.text().includes("Next"));
    await next?.trigger("click");
    await flushPromises();

    const lastCall = fetchLinksMock.mock.calls.at(-1)?.[0];
    expect(lastCall.page).toBe(2);
  });

  it("deletes a link after confirmation", async () => {
    mockPage({ data: links, meta: { page: 1, limit: 25, total: 2, pages: 1 } });
    deleteLinkMock.mockResolvedValue({});
    vi.spyOn(window, "confirm").mockReturnValue(true);

    const wrapper = mount(LinksPage, { global: { stubs: { LinkFormModal: true } } });
    await flushPromises();

    const deleteButtons = wrapper.findAll("button[title='Delete']");
    await deleteButtons[0].trigger("click");
    await flushPromises();

    expect(deleteLinkMock).toHaveBeenCalledWith(1);
    vi.restoreAllMocks();
  });
});
