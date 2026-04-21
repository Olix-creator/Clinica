"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

/**
 * Subscribes to realtime changes on the `appointments` table and triggers
 * a router refresh so any server-rendered dashboard stays in sync without
 * a manual reload.
 *
 * `channelKey` should be unique per page (and ideally per user) to avoid
 * channel collisions when a user has multiple tabs open.
 */
export default function DashboardRealtime({
  channelKey,
  quiet = false,
}: {
  channelKey: string;
  quiet?: boolean;
}) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`dashboard:${channelKey}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        (payload) => {
          if (!quiet) {
            if (payload.eventType === "INSERT") toast("New appointment in the schedule.");
            if (payload.eventType === "UPDATE") toast("An appointment was updated.");
          }
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelKey, quiet, router]);

  return null;
}
