import { api } from "./api";
import type { ApiEnvelope, LinkForm, LinkRating, ShortLink } from "../types";

export type LinkQuery = {
  page: number;
  limit: number;
  search: string;
  filter: "all" | "active" | "inactive" | "expired";
  sort: "newest" | "oldest" | "most_clicks" | "least_clicks" | "recently_updated";
};

export async function fetchLinks(query: LinkQuery) {
  const { data } = await api.get<ApiEnvelope<ShortLink[]>>("/links", { params: query });
  return data;
}

export async function createLink(payload: LinkForm) {
  const { data } = await api.post<ApiEnvelope<ShortLink>>("/links", payload);
  return data.data;
}

export async function updateLink(id: number, payload: LinkForm) {
  const { data } = await api.put<ApiEnvelope<ShortLink>>(`/links/${id}`, payload);
  return data.data;
}

export async function deleteLink(id: number) {
  await api.delete(`/links/${id}`);
}

export async function bulkLinks(action: "activate" | "deactivate" | "delete", ids: number[]) {
  await api.post(`/links/bulk/${action}`, { ids });
}

export function qrUrl(id: number, format: "svg" | "png", download = false) {
  const suffix = download ? "&download=1" : "";
  return `/api/links/${id}/qr?format=${format}${suffix}`;
}

export async function fetchRatings(id: number) {
  const { data } = await api.get<ApiEnvelope<LinkRating[]>>(`/links/${id}/ratings`);
  return data.data;
}
