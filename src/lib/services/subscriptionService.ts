import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type PlanTier = Database["public"]["Enums"]["plan_tier"];
export type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];

export const PLAN_LABEL: Record<PlanTier, string> = {
  free: "Free",
  pro: "Pro",
  enterprise: "Enterprise",
};

export const PLAN_SEATS: Record<PlanTier, number> = {
  free: 3,
  pro: 15,
  enterprise: 100,
};

async function fetchSubscription(clinicId: string): Promise<Subscription | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("clinic_id", clinicId)
    .maybeSingle();
  if (error) {
    console.error("[clinica] fetchSubscription:", error.message);
    return null;
  }
  return data;
}

export const subscriptionService = {
  get: fetchSubscription,
  async getMany(clinicIds: string[]): Promise<Record<string, Subscription>> {
    if (clinicIds.length === 0) return {};
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .in("clinic_id", clinicIds);
    if (error) {
      console.error("[clinica] subscriptionService.getMany:", error.message);
      return {};
    }
    const map: Record<string, Subscription> = {};
    for (const row of data ?? []) map[row.clinic_id] = row;
    return map;
  },
  label(plan: PlanTier | null | undefined): string {
    return plan ? PLAN_LABEL[plan] : "Free";
  },
  seatLimit(plan: PlanTier | null | undefined): number {
    return plan ? PLAN_SEATS[plan] : PLAN_SEATS.free;
  },
};
