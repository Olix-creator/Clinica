"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

type Notification = {
  id: string;
  user_id: string;
  type: string | null;
  message: string;
  appointment_id: string | null;
  read: boolean;
  created_at: string;
};

function relativeTime(iso: string) {
  const t = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - t);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function NotificationBell({ role }: { role: "patient" | "doctor" | "receptionist" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [tableMissing, setTableMissing] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  // Close on outside click
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Load notifications + subscribe
  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    async function init() {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return;
      if (cancelled) return;
      setUserId(uid);

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(25);

      if (cancelled) return;
      if (error) {
        // Likely the table doesn't exist yet — hide the bell gracefully.
        if (error.code === "42P01" || /does not exist/i.test(error.message)) {
          setTableMissing(true);
          return;
        }
        console.error("[lumina] notifications load:", error.message);
        return;
      }
      setItems((data ?? []) as Notification[]);

      channel = supabase
        .channel(`notifications:${uid}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${uid}` },
          (payload) => {
            const n = payload.new as Notification;
            setItems((prev) => [n, ...prev].slice(0, 25));
            toast(n.message, {
              description: "New notification",
            });
            router.refresh();
          }
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${uid}` },
          (payload) => {
            const n = payload.new as Notification;
            setItems((prev) => prev.map((it) => (it.id === n.id ? n : it)));
          }
        )
        .subscribe();
    }
    init();

    return () => {
      cancelled = true;
      if (channel) {
        const supabase = createClient();
        supabase.removeChannel(channel);
      }
    };
  }, [role, router]);

  if (tableMissing) return null;

  const unread = items.filter((i) => !i.read).length;

  async function markAllRead() {
    if (!userId) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);
    if (error) {
      toast.error("Could not mark notifications as read.");
      return;
    }
    setItems((prev) => prev.map((it) => ({ ...it, read: true })));
  }

  async function markOne(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
    if (error) return;
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, read: true } : it)));
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative w-10 h-10 rounded-xl bg-surface-container-highest hover:bg-surface-bright text-on-surface-variant hover:text-on-surface transition flex items-center justify-center"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-primary text-on-primary-fixed text-[10px] font-semibold flex items-center justify-center shadow-emerald">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-96 max-w-[calc(100vw-2rem)] rounded-2xl bg-surface-container-highest shadow-deep ring-1 ring-outline-variant/40 overflow-hidden animate-scale-in origin-top-right">
          <div className="px-5 py-4 flex items-center justify-between">
            <p className="font-semibold">Notifications</p>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                <CheckCheck className="w-3 h-3" />
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-auto">
            {items.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-on-surface-variant">
                You&apos;re all caught up.
              </div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => !n.read && markOne(n.id)}
                  className={`w-full text-left px-5 py-4 flex items-start gap-3 transition ${
                    n.read ? "opacity-70" : "bg-surface-container"
                  } hover:bg-surface-bright`}
                >
                  <span
                    className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
                      n.read ? "bg-outline-variant" : "bg-primary"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-on-surface">{n.message}</p>
                    <p className="text-xs text-on-surface-variant mt-1">{relativeTime(n.created_at)}</p>
                  </div>
                  {n.read && <Check className="w-3 h-3 text-on-surface-variant mt-1.5" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
