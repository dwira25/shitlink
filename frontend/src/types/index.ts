export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    pages?: number;
  };
  error?: string;
};

export type LinkStatus = "ACTIVE" | "INACTIVE";

export type ShortLink = {
  id: number;
  userId: number;
  slug: string;
  destinationUrl: string;
  title: string;
  description?: string | null;
  status: LinkStatus;
  expiresAt?: string | null;
  ratingEnabled: boolean;
  minRatingEnabled: boolean;
  minRating: number;
  createdAt: string;
  updatedAt: string;
  clickCount?: number;
  shortUrl: string;
  expired: boolean;
};

export type LinkForm = {
  title: string;
  destinationUrl: string;
  slug?: string;
  description?: string;
  expiresAt?: string | null;
  status: LinkStatus;
  ratingEnabled: boolean;
  minRatingEnabled: boolean;
  minRating: number;
};

export type UserRole = "MASTER" | "ADMIN";

export type LinkRating = {
  id: number;
  score: number;
  comment: string | null;
  createdAt: string;
};

export type ManagedUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
};

export type UserForm = {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
};

export type Breakdown = {
  label: string;
  value: number;
};

export type AnalyticsSummary = {
  totalClicks: number;
  uniqueClicks: number;
  clicksToday: number;
  clicksThisWeek: number;
  clicksThisMonth: number;
  topLinks: Array<{ id: number; title: string; slug: string; clicks: number }>;
  clicksPerDay: Array<{ date: string; clicks: number }>;
  deviceBreakdown: Breakdown[];
  browserBreakdown: Breakdown[];
  osBreakdown: Breakdown[];
};

export type DashboardSummary = AnalyticsSummary & {
  totalLinks: number;
  activeLinks: number;
  inactiveLinks: number;
  qrCodes: number;
  recentLinks: Array<{ id: number; title: string; slug: string; clicks: number; createdAt: string }>;
  recentClicks: Array<{ id: number; clickedAt: string; link: { title: string; slug: string } }>;
};
