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
 * Properly manages WebSocket lifecycle, prevents duplicate channel joins,
 * and ensures all presence listeners are registered strictly BEFORE subscribe().
 */
export function useProjectPresence(
  projectId?: string,
  pageSlug?: string,
  isEditing: boolean = false
) {
  const { user, profile } = useAuth();
  const [activeUsers, setActiveUsers] = useState<ActivePresenceUser[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isSubscribedRef = useRef<boolean>(false);
  const currentPayloadRef = useRef<{ pageSlug?: string; isEditing: boolean }>({
    pageSlug,
    isEditing,
  });

  // Keep latest payload accessible without re-running channel setup
  currentPayloadRef.current = { pageSlug, isEditing };

  // 1. Channel connection & lifecycle management (tied strictly to projectId and user.id)
  useEffect(() => {
    if (!projectId || !user?.id) {
      setActiveUsers([]);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    const channelName = `presence:project:${projectId}`;
    const fullTopic = `realtime:${channelName}`;
    let isCancelled = false;

    // Guard Check: Avoid re-subscribing if a channel for the given project ID is already active or JOINING
    const existingChannels = supabase.getChannels();
    const existingChannel = existingChannels.find(
      (c) => c.topic === fullTopic || c.topic === channelName
    );

    if (existingChannel) {
      const channelState = (existingChannel as any).state;
      // If already active or in progress of joining, reuse and do NOT re-bind callbacks
      if (channelState === "joined" || channelState === "joining") {
        channelRef.current = existingChannel;
        isSubscribedRef.current = channelState === "joined";

        // If already joined, track our presence immediately
        if (channelState === "joined") {
          existingChannel
            .track({
              userId: user.id,
              email: user.email || "",
              fullName: profile?.full_name || user.email?.split("@")[0] || "User",
              avatarUrl: profile?.avatar_url || "",
              currentProject: projectId,
              currentPageSlug: currentPayloadRef.current.pageSlug || "",
              isEditing: currentPayloadRef.current.isEditing,
              onlineAt: new Date().toISOString(),
            })
            .catch((err) => console.warn("[Presence Track Existing]:", err));
        }

        return () => {
          // If leaving this project, untrack our presence
          try {
            existingChannel.untrack().catch(() => {});
          } catch {}
        };
      } else {
        // If channel is closed, errored, or leaving, clean it up before creating fresh
        try {
          supabase.removeChannel(existingChannel);
        } catch {}
      }
    }

    // Initialize fresh channel with presence config
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channelRef.current = channel;
    isSubscribedRef.current = false;

    const parsePresenceUsers = () => {
      try {
        const state = channel.presenceState();
        const usersList: ActivePresenceUser[] = [];

        Object.keys(state).forEach((key) => {
          const presenceArray = state[key] as any[];
          if (Array.isArray(presenceArray) && presenceArray.length > 0) {
            usersList.push(presenceArray[0]);
          }
        });

        if (!isCancelled) {
          setActiveUsers(usersList);
        }
      } catch (err) {
        console.warn("[Presence parse error]:", err);
      }
    };

    // Register all presence event handlers strictly BEFORE calling .subscribe()
    channel
      .on("presence", { event: "sync" }, () => {
        parsePresenceUsers();
      })
      .on("presence", { event: "join" }, () => {
        parsePresenceUsers();
      })
      .on("presence", { event: "leave" }, () => {
        parsePresenceUsers();
      });

    // Subscribe to channel with error boundary
    try {
      channel.subscribe(async (status) => {
        if (isCancelled) return;

        if (status === "SUBSCRIBED") {
          isSubscribedRef.current = true;
          try {
            await channel.track({
              userId: user.id,
              email: user.email || "",
              fullName: profile?.full_name || user.email?.split("@")[0] || "User",
              avatarUrl: profile?.avatar_url || "",
              currentProject: projectId,
              currentPageSlug: currentPayloadRef.current.pageSlug || "",
              isEditing: currentPayloadRef.current.isEditing,
              onlineAt: new Date().toISOString(),
            });
          } catch (trackErr) {
            console.warn("[Presence initial track error]:", trackErr);
          }
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          isSubscribedRef.current = false;
          console.warn(`[Presence Channel Status]: ${status} for ${channelName}`);
        }
      });
    } catch (subErr) {
      console.warn("[Presence subscribe exception]:", subErr);
    }

    // Clean unsubscription and channel removal on unmount or project ID switch
    return () => {
      isCancelled = true;
      isSubscribedRef.current = false;
      try {
        channel.untrack().catch(() => {});
        channel.unsubscribe();
        supabase.removeChannel(channel);
      } catch (cleanupErr) {
        console.warn("[Presence cleanup error]:", cleanupErr);
      }
      channelRef.current = null;
    };
  }, [projectId, user?.id, user?.email, profile?.full_name, profile?.avatar_url]);

  // 2. Dynamic presence state updates (when pageSlug or isEditing changes)
  // Calls channel.track() on the active channel without tearing down the WebSocket
  useEffect(() => {
    if (!channelRef.current || !isSubscribedRef.current || !user?.id || !projectId) {
      return;
    }

    channelRef.current
      .track({
        userId: user.id,
        email: user.email || "",
        fullName: profile?.full_name || user.email?.split("@")[0] || "User",
        avatarUrl: profile?.avatar_url || "",
        currentProject: projectId,
        currentPageSlug: pageSlug || "",
        isEditing: isEditing,
        onlineAt: new Date().toISOString(),
      })
      .catch((err) => {
        console.warn("[Presence dynamic track error]:", err);
      });
  }, [pageSlug, isEditing, user?.id, user?.email, projectId, profile?.full_name, profile?.avatar_url]);

  // Find other collaborators actively editing the same page
  const concurrentEditors = activeUsers.filter(
    (u) => u.userId !== user?.id && u.currentPageSlug === pageSlug && u.isEditing
  );

  return {
    activeUsers,
    concurrentEditors,
  };
}
