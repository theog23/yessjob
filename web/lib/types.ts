export type Platform = "workana" | "freelancer";

export type Plan = {
  id: string;
  slug: string;
  name: string;
  price_usd: number;
  max_platforms: number;
  max_sectors: number;
  max_keywords: number;
  min_scrape_interval_min: number;
  max_proposals_per_day: number;
};

export type Sector = {
  id: string;
  slug: string;
  name: string;
  workana_category: string | null;
  freelancer_skill_ids: number[];
  sort_order: number;
};

export type Subscription = {
  id: string;
  user_id: string;
  plan_id: string;
  status: "active" | "paused" | "expired" | "canceled";
  starts_at: string;
  expires_at: string | null;
};

export type UserPlatform = {
  id: string;
  user_id: string;
  platform: Platform;
  sector_id: string;
  keywords: string[];
  excluded_keywords: string[];
  min_budget_usd: number;
  is_active: boolean;
  created_at: string;
};

export type TelegramLink = {
  user_id: string;
  chat_id: number;
  username: string | null;
  linked_at: string;
};

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
};
