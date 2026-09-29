import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { SavedProject } from "./project-types";
import { logActivity } from "@/lib/supabase/activity";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function toValidUUID(id?: string): string {
  if (id && UUID_REGEX.test(id)) return id;
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback UUID v4 generator
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Saves a project and its pages/versions to Supabase.
 */
export async function saveProjectToSupabase(project: SavedProject): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData?.session?.user;

  const projectId = toValidUUID(project.id);
  project.id = projectId; // ensure consistent UUID

  const bizDetails = project.businessDetails || {};
  
  // Category B: Lightweight project metadata only.
  // Full website files (Category C) stay in ephemeral tempStorage or local IndexedDB.
  const settings = {
    theme: project.theme,
    serviceAreaCities: project.serviceAreaCities || [],
    keywordMap: project.keywordMap || [],
    mustIncludeText: project.mustIncludeText || "",
    customContentInstructions: project.customContentInstructions || project.formData?.customContentInstructions || "",
    redirects: project.redirects || [],
    optimizationCycles: project.optimizationCycles || [],
    lastDownloadedAt: project.lastDownloadedAt,
    originalId: project.id,
  };

  // Upsert project metadata
  const { error: projErr } = await supabase.from("projects").upsert(
    {
      id: projectId,
      name: project.name || "Static Website",
      domain: bizDetails.websiteDomain || project.formData?.websiteDomain || null,
      niche: project.nicheId || project.formData?.nicheId || null,
      main_city: bizDetails.city || project.formData?.city || null,
      state: bizDetails.stateRegion || project.formData?.stateRegion || null,
      theme_id: project.theme?.id || null,
      settings,
      business_details: bizDetails,
      wizard_inputs: project.formData || {},
      status: "active",
      updated_by: user?.id || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (projErr) {
    console.error("[SupabaseStore] Project upsert error:", projErr);
    throw new Error(`Failed to save project: ${projErr.message}`);
  }

  // Log activity
  await logActivity({
    projectId,
    action: "edit",
    entityType: "project",
    entityId: projectId,
    details: {
      description: `Saved project "${project.name}" metadata`,
      projectName: project.name,
      fileCount: project.files?.length || 0,
    },
  });

  return projectId;
}

/**
 * Fetches all active projects from Supabase.
 */
export async function getAllProjectsFromSupabase(): Promise<SavedProject[]> {
  const supabase = getSupabaseBrowserClient();

  const { data: rows, error } = await supabase
    .from("projects")
    .select(`
      id,
      name,
      domain,
      niche,
      main_city,
      state,
      theme_id,
      settings,
      business_details,
      wizard_inputs,
      status,
      created_at,
      updated_at
    `)
    .eq("status", "active")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[SupabaseStore] Error fetching projects:", error);
    return [];
  }

  return (rows || []).map((row: any) => {
    const settings = row.settings || {};

    const defaultTheme = {
      id: row.theme_id || "modern-indigo",
      name: "Modern Pro",
      primaryColor: "#4F46E5",
      accentColor: "#06B6D4",
    };

    return {
      id: row.id,
      name: row.name,
      createdAt: new Date(row.created_at).getTime(),
      lastEditedAt: new Date(row.updated_at).getTime(),
      lastDownloadedAt: settings.lastDownloadedAt,
      thumbnail: settings.thumbnail || undefined,
      formData: row.wizard_inputs || {},
      theme: (settings.theme || defaultTheme) as any,
      nicheId: row.niche || "general-contractor",
      schemaType: "LocalBusiness",
      businessDetails: (row.business_details || {}) as any,
      serviceAreaCities: settings.serviceAreaCities || [],
      keywordMap: settings.keywordMap || [],
      customBlocks: settings.customBlocks || [],
      mustIncludeText: settings.mustIncludeText || "",
      customContentInstructions: settings.customContentInstructions || row.wizard_inputs?.customContentInstructions || "",
      pageContentMap: settings.pageContentMap || {},
      blogPosts: settings.blogPosts || [],
      files: settings.files || [],
      changeLog: settings.changeLog || [],
      redirects: settings.redirects || [],
      optimizationCycles: settings.optimizationCycles || [],
    };
  });
}

/**
 * Fetches a single project by ID from Supabase.
 */
export async function getProjectByIdFromSupabase(id: string): Promise<SavedProject | null> {
  const supabase = getSupabaseBrowserClient();
  const validId = toValidUUID(id);

  const { data: row, error } = await supabase
    .from("projects")
    .select(`
      id,
      name,
      domain,
      niche,
      main_city,
      state,
      theme_id,
      settings,
      business_details,
      wizard_inputs,
      status,
      created_at,
      updated_at
    `)
    .eq("id", validId)
    .single();

  if (error || !row) {
    return null;
  }

  const settings = row.settings || {};

  const defaultTheme = {
    id: row.theme_id || "modern-indigo",
    name: "Modern Pro",
    primaryColor: "#4F46E5",
    accentColor: "#06B6D4",
  };

  return {
    id: row.id,
    name: row.name,
    createdAt: new Date(row.created_at).getTime(),
    lastEditedAt: new Date(row.updated_at).getTime(),
    lastDownloadedAt: settings.lastDownloadedAt,
    thumbnail: settings.thumbnail || undefined,
    formData: row.wizard_inputs || {},
    theme: (settings.theme || defaultTheme) as any,
    nicheId: row.niche || "general-contractor",
    schemaType: "LocalBusiness",
    businessDetails: (row.business_details || {}) as any,
    serviceAreaCities: settings.serviceAreaCities || [],
    keywordMap: settings.keywordMap || [],
    customBlocks: settings.customBlocks || [],
    mustIncludeText: settings.mustIncludeText || "",
    customContentInstructions: settings.customContentInstructions || row.wizard_inputs?.customContentInstructions || "",
    pageContentMap: settings.pageContentMap || {},
    blogPosts: settings.blogPosts || [],
    files: settings.files || [],
    changeLog: settings.changeLog || [],
    redirects: settings.redirects || [],
    optimizationCycles: settings.optimizationCycles || [],
  };
}

/**
 * Moves a project to 30-day trash or deletes permanently (owner only).
 */
export async function deleteProjectFromSupabase(id: string, permanent: boolean = false): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const validId = toValidUUID(id);

  if (permanent) {
    const { error } = await supabase.from("projects").delete().eq("id", validId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("projects")
      .update({
        status: "archived",
        deleted_at: new Date().toISOString(),
      })
      .eq("id", validId);

    if (error) throw error;
  }

  await logActivity({
    projectId: validId,
    action: "delete",
    entityType: "project",
    entityId: validId,
    details: {
      description: permanent ? "Permanently deleted project" : "Moved project to archive / trash",
      permanent,
    },
  });
}
