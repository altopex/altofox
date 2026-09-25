"use client";

import { useEffect, useState, useRef } from "react";
import { getSupabaseBrowserClient } from "./client";
import { useAuth } from "@/lib/auth/AuthContext";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface ActivePresenceUser {
  userId: string;
  email?: string;
  fullName: string;
  avatarUrl?: string;
  currentProject?: string;
  currentPageSlug?: string;
  isEditing?: boolean;
  onlineAt: string;
}

/**
 * Realtime presence hook to track who is viewing and editing in a project.
 */
export function useProjectPresence(projectId?: string, pageSlug?: string, isEditing: boolean = false) {
  const { user, profile } = useAuth();
  const [activeUsers, setActiveUsers] = useState<ActivePresenceUser[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!projectId || !user) return;

    const supabase = getSupabaseBrowserClient();
    const channelName = `presence:project:${projectId}`;
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const usersList: ActivePresenceUser[] = [];

        Object.keys(state).forEach((key) => {
          const presenceArray = state[key] as any[];
          if (presenceArray && presenceArray.length > 0) {
            usersList.push(presenceArray[0]);
          }
        });

        setActiveUsers(usersList);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            userId: user.id,
            email: user.email || "",
            fullName: profile?.full_name || user.email?.split("@")[0] || "User",
            avatarUrl: profile?.avatar_url || "",
            currentProject: projectId,
            currentPageSlug: pageSlug || "",
            isEditing: isEditing,
            onlineAt: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [projectId, pageSlug, isEditing, user, profile]);

  // Find who else is editing the same page
  const concurrentEditors = activeUsers.filter(
    (u) => u.userId !== user?.id && u.currentPageSlug === pageSlug && u.isEditing
  );

  return {
    activeUsers,
    concurrentEditors,
  };
}
