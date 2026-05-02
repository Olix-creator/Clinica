"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { createClinicOnboardingAction } from "@/app/onboarding/clinic/actions";

const SPECIALTIES = [
  "General Practice",
  "Cardiology",
  "Dermatology",
  "Pediatrics",
  "Dentistry",
  "Ophthalmology",
  "Gynecology",
  "Orthopedics",
  "Psychiatry",
  "ENT",
];

const CITIES = ["Algiers", "Oran", "Constantine", "Annaba", "Blida", "Setif"];

const STEPS = ["Choose plan", "Clinic info", "Review"] as const;

type FormState = {
  name: string;
  specialty: string;
  city: string;
  address: string;
  latitude: string;
  longitude: string;
  phone: string;
  bio: string;
};

/**
 * 3-step onboarding wizard, mirroring the handoff design exactly:
 *   1. Choose plan (free / premium radio cards)
 *   2. Clinic info (name, specialty, city, address, phone, bio)
 *   3. Review summary then submit to the server action
 *
 * Only step 3's "Go to dashboard" actually inserts the row — that
 * matches the handoff's "Step 3 = review then submit" pattern.
 */
export function ClinicSetupForm({ plan: initialPlan }: { plan: "free" | "premium" }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState(0);
  const [plan, setPlan] = useState<"free" | "premium">(initialPlan);
  const [error, setError] = useState("");
  const [form, setForm] = useState<FormState>({
    name: "",
    specialty: "General Practice",
    city: "Algiers",
    address: "",
    latitude: "",
    longitude: "",
    phone: "",
    bio: "",
  });

  function update<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const canNext =
    step === 0
      ? true
      : step === 1
        ? form.name.trim() && form.address.trim() && form.phone.trim()
        : true;

  function submit() {
    setError("");
    const fd = new FormData();
    fd.set("name", form.name);
    fd.set("phone", form.phone);
    fd.set("address", form.address);
    fd.set("latitude", form.latitude);
    fd.set("longitude", form.longitude);
    fd.set("specialty", form.specialty);
    fd.set("city", form.city);
    fd.set("description", form.bio);
    fd.set("plan", plan);

    startTransition(async () => {
      const res = await createClinicOnboardingAction(fd);
      if (!res.ok) {
        setError(res.error);
        toast.error(res.error);
        return;
      }
      toast.success("Clinic created — welcome!");
      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <>
      <div style={{ fontSize: 13, color: "var(--text-subtle)", marginBottom: 14 }}>
        Step {step + 1} of {STEPS.length}
      </div>

      {/* Progress bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 40 }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ flex: 1 }}>
            <div
              style={{
                height: 4,
                borderRadius: 999,
                background:
                  i <= step ? "var(--primary)" : "var(--outline-variant)",
                transition: "background .2s",
              }}
            />
            <div
              style={{
                marginTop: 10,
                fontSize: 12,
                fontWeight: i === step ? 600 : 500,
                color:
                  i <= step ? "var(--on-surface)" : "var(--text-subtle)",
              }}
            >
              {i + 1}. {s}
            </div>
          </div>
        ))}
      </div>

      {error ? (
        <div
          style={{
            marginBottom: 16,
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #fecaca",
            background: "var(--danger-50)",
            color: "var(--danger)",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      ) : null}

      {/* Step 0: plan */}
      {step === 0 && (
        <div className="anim-fade">
          <h1 className="t-h2" style={{ marginBottom: 8 }}>
            Start free or go premium.
          </h1>
          <p className="t-body" style={{ marginBottom: 32 }}>
            Both unlock the full product. Premium removes limits.
          </p>
          <div className="resp-stack-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {[
              { v: "free" as const, t: "Free trial", p: "€0", d: "30 days or 50 appointments" },
              { v: "premium" as const, t: "Premium", p: "€12/mo", d: "Unlimited everything" },
            ].map((o) => (
              <button
                key={o.v}
                type="button"
                onClick={() => setPlan(o.v)}
                style={{
                  textAlign: "left",
                  padding: 24,
                  borderRadius: 14,
                  cursor: "pointer",
                  background: "var(--surface-bright)",
                  border:
                    plan === o.v
                      ? "1.5px solid var(--primary)"
                      : "1px solid var(--outline-variant)",
                  boxShadow:
                    plan === o.v ? "0 0 0 3px var(--primary-tint)" : "none",
                  transition: "all .12s ease",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{o.t}</div>
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 999,
                      border: "1.5px solid",
                      borderColor:
                        plan === o.v ? "var(--primary)" : "var(--border-strong)",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    {plan === o.v && (
                      <div
                        style={{
                          width: 9,
                          height: 9,
                          borderRadius: 999,
                          background: "var(--primary)",
                        }}
                      />
                    )}
                  </div>
                </div>
                <div style={{ fontSize: 26, fontWeight: 600, marginTop: 10 }}>
                  {o.p}
                </div>
                <div className="t-small" style={{ marginTop: 4 }}>
                  {o.d}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 1: clinic info */}
      {step === 1 && (
        <div className="anim-fade">
          <h1 className="t-h2" style={{ marginBottom: 8 }}>
            Tell us about your clinic.
          </h1>
          <p className="t-body" style={{ marginBottom: 32 }}>
            This is what patients will see on your public page.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label className="field-label">Clinic name</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="e.g. Clinique El Djazair"
              />
            </div>
            <div className="resp-stack-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label className="field-label">Specialty</label>
                <select
                  className="select"
                  value={form.specialty}
                  onChange={(e) => update("specialty", e.target.value)}
                >
                  {SPECIALTIES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label">City</label>
                <select
                  className="select"
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                >
                  {CITIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="field-label">Address</label>
              <input
                className="input"
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                placeholder="Street, district"
              />
            </div>
            <div className="resp-stack-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label className="field-label">Latitude (optional)</label>
                <input
                  className="input"
                  value={form.latitude}
                  onChange={(e) => update("latitude", e.target.value)}
                  placeholder="36.7538"
                />
              </div>
              <div>
                <label className="field-label">Longitude (optional)</label>
                <input
                  className="input"
                  value={form.longitude}
                  onChange={(e) => update("longitude", e.target.value)}
                  placeholder="3.0588"
                />
              </div>
            </div>
            <div>
              <label className="field-label">Phone</label>
              <input
                className="input"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="+213 21 00 00 00"
              />
            </div>
            <div>
              <label className="field-label">Short description</label>
              <textarea
                className="textarea"
                rows={4}
                value={form.bio}
                onChange={(e) => update("bio", e.target.value)}
                placeholder="What makes your clinic a good choice for patients?"
              />
              <div className="field-hint">
                A sentence or two. Shown on your public clinic page.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: review */}
      {step === 2 && (
        <div className="anim-fade">
          <h1 className="t-h2" style={{ marginBottom: 8 }}>
            You&apos;re all set.
          </h1>
          <p className="t-body" style={{ marginBottom: 32 }}>
            Review the details below. You can change anything from Settings.
          </p>
          <div className="card" style={{ padding: 24 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 18,
              }}
            >
              <span className="chip primary">
                {plan === "premium" ? "Premium" : "Free trial"}
              </span>
              <span className="chip warn">Verification pending</span>
            </div>
            {(
              [
                ["Clinic", form.name || "—"],
                ["Specialty", form.specialty],
                ["City", form.city],
                ["Address", form.address || "—"],
                [
                  "Coordinates",
                  form.latitude && form.longitude
                    ? `${form.latitude}, ${form.longitude}`
                    : "Auto from address",
                ],
                ["Phone", form.phone || "—"],
                ["Description", form.bio || "Not set"],
              ] as [string, string][]
            ).map(([k, v]) => (
              <div
                key={k}
                style={{
                  display: "grid",
                  gridTemplateColumns: "140px 1fr",
                  gap: 12,
                  padding: "12px 0",
                  borderTop: "1px solid var(--outline-variant)",
                  fontSize: 14,
                }}
              >
                <div style={{ color: "var(--text-subtle)" }}>{k}</div>
                <div
                  style={{
                    color:
                      v === "—" || v === "Not set"
                        ? "var(--text-faint)"
                        : "var(--on-surface)",
                  }}
                >
                  {v}
                </div>
              </div>
            ))}
          </div>
          <p className="t-small" style={{ marginTop: 20, lineHeight: 1.6 }}>
            We&apos;ll review your clinic within 24 hours. Until then, you can
            set up your schedule and add doctors — patients will see you once
            approved.
          </p>
        </div>
      )}

      {/* Footer nav */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 40,
          gap: 12,
        }}
      >
        <button
          type="button"
          className="btn ghost"
          disabled={step === 0 || pending}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
        >
          <ArrowLeft size={14} /> Back
        </button>
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            className="btn primary"
            disabled={!canNext || pending}
            onClick={() => setStep((s) => s + 1)}
          >
            Continue <ArrowRight size={14} />
          </button>
        ) : (
          <button
            type="button"
            className="btn primary"
            disabled={pending}
            onClick={submit}
          >
            {pending ? <Loader2 size={14} className="animate-spin" /> : null}
            {pending ? "Submitting…" : "Go to dashboard"}{" "}
            <ArrowRight size={14} />
          </button>
        )}
      </div>
    </>
  );
}
