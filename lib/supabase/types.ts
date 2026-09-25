export type UserRole = "owner" | "editor";
export type UserStatus = "pending" | "approved" | "disabled";
export type SignupMode = "approval_required" | "invite_only" | "open";

export type PlanType = "starter" | "agency" | "unlimited";

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  status: UserStatus;
  company_name?: string | null;
  plan?: PlanType | null;
  website_limit?: number | null;
  last_active_at: string;
  created_at: string;
  updated_at: string;
  email?: string;
}

export interface Project {
  id: string;
  name: string;
  domain: string | null;
  niche: string | null;
  main_city: string | null;
  state: string | null;
  theme_id: string | null;
  settings: Record<string, any>;
  business_details: Record<string, any>;
  wizard_inputs: Record<string, any>;
  status: "active" | "archived" | "trash";
  deleted_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  // Computed / joined fields
  page_count?: number;
  creator?: Profile | null;
}

export type PageType =
  | "home"
  | "service"
  | "location"
  | "service_location"
  | "blog"
  | "project"
  | "about"
  | "contact"
  | "custom";

export interface PageRecord {
  id: string;
  project_id: string;
  type: PageType;
  slug: string;
  url_path: string;
  title: string;
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    h1?: string;
    canonical?: string;
    ogImage?: string;
    schemaType?: string;
    focusKeyword?: string;
    secondaryKeywords?: string[];
    [key: string]: any;
  };
  content: {
    sections?: any[];
    html?: string;
    rawText?: string;
    [key: string]: any;
  };
  keywords: string[];
  is_hidden: boolean;
  last_meaningful_update: string;
  sort_order: number;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  updater?: Profile | null;
}

export interface VersionRecord {
  id: string;
  project_id: string;
  page_id: string | null;
  snapshot: any;
  summary: string | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  creator?: Profile | null;
}

export interface AssetRecord {
  id: string;
  project_id: string;
  storage_path: string;
  filename: string;
  alt_text: string | null;
  width: number | null;
  height: number | null;
  source: "pexels" | "pixabay" | "upload" | "bing";
  credit: string | null;
  used_on: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityLogRecord {
  id: string;
  project_id: string | null;
  user_id: string | null;
  user_name: string | null;
  user_avatar: string | null;
  action:
    | "create"
    | "edit"
    | "delete"
    | "optimize"
    | "generate"
    | "export"
    | "import"
    | "restore"
    | "trash"
    | "recover"
    | "publish"
    | "cycle";
  entity_type:
    | "project"
    | "page"
    | "version"
    | "asset"
    | "settings"
    | "cycle"
    | "team";
  entity_id: string | null;
  details: {
    description?: string;
    pageSlug?: string;
    pageTitle?: string;
    projectName?: string;
    changedFields?: string[];
    diffCount?: number;
    [key: string]: any;
  };
  created_at: string;
}

export interface AppSettings {
  id: string;
  team_name: string;
  default_preferences: {
    country?: string;
    theme?: string;
    language?: string;
    qualityReview?: boolean;
    [key: string]: any;
  };
  api_keys: {
    openai?: string;
    gemini?: string;
    openrouter?: string;
    pexels?: string;
    pixabay?: string;
    serper?: string;
    dataforseo?: string;
    pagespeed?: string;
    [key: string]: any;
  };
  storage_stats: {
    used_bytes: number;
    limit_bytes: number;
  };
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  role: UserRole;
  status?: UserStatus;
  company_name?: string | null;
  plan?: PlanType | null;
  website_limit?: number | null;
  last_active_at: string;
  created_at: string;
}

export interface OptimizationCycleRecord {
  id: string;
  project_id: string;
  cycle_date: string;
  pages_changed: any[];
  notes: string | null;
  summary: Record<string, any>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RankCheckRecord {
  id: string;
  project_id: string;
  keyword: string;
  location: string | null;
  type: "organic" | "grid";
  results: Record<string, any>;
  checked_at: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
