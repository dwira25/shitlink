import { api } from "./api";
import type { AnalyticsSummary, ApiEnvelope, DashboardSummary } from "../types";

export async function fetchAnalytics() {
  const { data } = await api.get<ApiEnvelope<AnalyticsSummary>>("/analytics");
  return data.data;
}

export async function fetchDashboard() {
  const { data } = await api.get<ApiEnvelope<DashboardSummary>>("/analytics/dashboard");
  return data.data;
}
