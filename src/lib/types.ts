export type BillingCycle = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export type SubscriptionStatus = 'active' | 'paused' | 'cancelled';

export type SubscriptionSource = 'manual' | 'detected';

export type Category =
  | 'streaming'
  | 'music'
  | 'telecom'
  | 'food'
  | 'fitness'
  | 'productivity'
  | 'ai'
  | 'shopping'
  | 'news'
  | 'gaming'
  | 'education'
  | 'finance'
  | 'other';

export interface CatalogPlan {
  name: string;
  price_inr: number;
  billing_cycle: BillingCycle;
}

export interface CatalogService {
  id: string;
  name: string;
  slug: string;
  category: Category;
  plans: CatalogPlan[];
  /** Regex source strings matched against transaction text / merchant names. */
  detection_patterns: string[];
  logo_color: string;
  website: string;
  /** 1-based rank among onboarding quick-add grid; null = not featured. */
  popular_rank: number | null;
}

export interface Subscription {
  id: string;
  user_id: string;
  service_name: string;
  catalog_service_id: string | null;
  plan_name: string;
  price_inr: number;
  billing_cycle: BillingCycle;
  category: Category;
  status: SubscriptionStatus;
  /** ISO date (YYYY-MM-DD) in IST calendar. */
  start_date: string;
  /** ISO date (YYYY-MM-DD) in IST calendar. */
  next_renewal_date: string;
  notes: string;
  source: SubscriptionSource;
  created_at: string;
  updated_at: string;
  paused_at: string | null;
  cancelled_at: string | null;
}

export interface PriceHistoryEntry {
  id: string;
  subscription_id: string;
  price_inr: number;
  /** ISO date the price took effect. */
  effective_from: string;
  created_at: string;
}

export interface RenewalLogEntry {
  id: string;
  subscription_id: string;
  /** ISO date the renewal was charged. */
  renewed_on: string;
  amount_inr: number;
  created_at: string;
}

export type ConsentType =
  | 'local_notifications'
  | 'whatsapp_alerts'
  | 'sms_ingestion'
  | 'notification_listener'
  | 'analytics';

export interface ConsentRecord {
  id: string;
  user_id: string;
  consent_type: ConsentType;
  granted: boolean;
  granted_at: string | null;
  revoked_at: string | null;
  version: number;
}

export interface AlertPrefs {
  enabled: boolean;
  days_before: number;
}

export interface Profile {
  id: string;
  email: string | null;
  phone: string | null;
  full_name: string | null;
  plan: 'free' | 'pro';
  created_at: string;
}

export const FREE_PLAN_SUB_CAP = 5;

export const CATEGORY_LABELS: Record<Category, string> = {
  streaming: 'Streaming',
  music: 'Music',
  telecom: 'Telecom',
  food: 'Food & Delivery',
  fitness: 'Fitness',
  productivity: 'Productivity',
  ai: 'AI',
  shopping: 'Shopping',
  news: 'News',
  gaming: 'Gaming',
  education: 'Education',
  finance: 'Finance',
  other: 'Other',
};

export const CYCLE_LABELS: Record<BillingCycle, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
};
