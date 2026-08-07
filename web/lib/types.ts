export type Platform = "workana" | "freelancer" | "upwork";

export type Plan = {
  id: string;
  slug: string;
  name: string;
  price_usd: number;
  max_platforms: number;
  max_sectors: number;
  max_keywords: number;
  min_scrape_interval_min: number;
  max_generations_per_month: number;
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
  current_period_start: string;
};

export type GenerationPurchase = {
  id: string;
  user_id: string;
  quantity: number;
  remaining: number;
  purchased_at: string;
  expires_at: string;
};

export type GenerationBalance = {
  base_limit: number;
  base_used: number;
  base_remaining: number;
  purchased_remaining: number;
  next_purchase_expiry: string | null;
  period_start: string;
  trial_expires_at: string | null;
  is_active: boolean;
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
  proposal_style: string | null;
};

export type ScrapedJob = {
  id: string;
  platform: Platform;
  title: string;
  description: string | null;
  url: string;
  budget_str: string | null;
  budget_usd: number | null;
  skills: string[] | null;
  posted_at: string | null;
};

export type NotifiedJob = ScrapedJob & { sent_at: string };

export type GeneratedProposal = {
  job_id: string;
  proposal_text: string;
  created_at: string;
};
