import { getSupabaseBrowserClient } from "./client";
import { ActivityLogRecord } from "./types";

export interface LogActivityParams {
  projectId?: string | null;
  action: ActivityLogRecord["action"];
  entityType: ActivityLogRecord["entity_type"];
  entityId?: string | null;
  details: ActivityLogRecord["details"];
  // Optional override if calling from server
  userId?: string;
  userName?: string;
  userAvatar?: string;
}

/**
 * Records a change action in the Supabase activity_log table.
 * Attaches the current user's profile info (name & avatar) automatically.
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const sessionUser = sessionData?.session?.user;

    let userId = params.userId || sessionUser?.id || null;
    let userName = params.userName || null;
    let userAvatar = params.userAvatar || null;

    if (!userName && userId) {
      // Look up profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", userId)
        .single();

      if (profile) {
        userName = profile.full_name;
        userAvatar = profile.avatar_url;
      } else if (sessionUser?.email) {
        userName = sessionUser.email.split("@")[0];
      }
    }

    const { error } = await supabase.from("activity_log").insert({
      project_id: params.projectId || null,
      user_id: userId,
      user_name: userName || "Team Member",
      user_avatar: userAvatar,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId ? String(params.entityId) : null,
      details: params.details || {},
    });

    if (error) {
      console.warn("[ActivityLog] Failed to log activity:", error.message);
    }
  } catch (err) {
    console.warn("[ActivityLog] Non-blocking log error:", err);
  }
}

/**
 * Fetches recent activity logs (optionally filtered by projectId, person, action, entity).
 */
export async function fetchActivityLogs(options?: {
  projectId?: string;
  userId?: string;
  action?: string;
  limit?: number;
}): Promise<ActivityLogRecord[]> {
  try {
    const supabase = getSupabaseBrowserClient();
    let query = supabase
      .from("activity_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(options?.limit || 50);

    if (options?.projectId) {
      query = query.eq("project_id", options.projectId);
    }
    if (options?.userId) {
      query = query.eq("user_id", options.userId);
    }
    if (options?.action) {
      query = query.eq("action", options.action);
    }

    const { data, error } = await query;
    if (error) {
      console.error("[ActivityLog] Query error:", error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("[ActivityLog] Fetch error:", err);
    return [];
  }
}
