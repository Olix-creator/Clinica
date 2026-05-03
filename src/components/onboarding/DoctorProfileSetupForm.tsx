"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Loader2 } from "lucide-react";
import { completeDoctorProfileAction } from "@/app/onboarding/doctor/actions";

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

/**
 * Doctor profile completion — client form for /onboarding/doctor.
 *
 * All fields except `description` are required. Submit calls the
 * server action; on success we send the doctor on to /doctor where
 * the gate now passes.
 */
export function DoctorProfileSetupForm({
  initialFullName = "",
  initialSpecialty = "",
  initialDiploma = "",
  initialSinceYear = "",
  initialDescription = "",
  hasDoctorRow = false,
}: {
  initialFullName?: string;
  initialSpecialty?: string;
  initialDiploma?: string;
  initialSinceYear?: string;
  initialDescription?: string;
  hasDoctorRow?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [fullName, setFullName] = useState(initialFullName);
  const [specialty, setSpecialty] = useState(
    initialSpecialty || "General Practice",
  );
  const [diploma, setDiploma] = useState(initialDiploma);
  const [sinceYear, setSinceYear] = useState(initialSinceYear);
  const [description, setDescription] = useState(initialDescription);

  const canSubmit =
    fullName.trim() && specialty.trim() && diploma.trim() && sinceYear.trim();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData();
    fd.set("fullName", fullName);
    fd.set("specialty", specialty);
    fd.set("diploma", diploma);
    fd.set("sinceYear", sinceYear);
    fd.set("description", description);
    startTransition(async () => {
      const res = await completeDoctorProfileAction(fd);
      if (!res.ok) {
        setError(res.error);
        toast.error(res.error);
        return;
      }
      toast.success("Profile saved");
      router.push("/doctor");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="card" style={{ padding: 24 }}>
      {!hasDoctorRow ? (
        <div
          style={{
            marginBottom: 14,
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid var(--primary-100)",
            background: "var(--primary-50)",
            color: "var(--primary-600)",
            fontSize: 13,
          }}
        >
          Heads up — you&apos;re not attached to a clinic yet. Fill in your
          profile so a receptionist can find you, then ask them to add you
          to their team.
        </div>
      ) : null}

      {error ? (
        <div
          style={{
            marginBottom: 14,
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

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label className="field-label">Full name</label>
          <input
            className="input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Dr. Amira Belkacem"
            required
            disabled={pending}
          />
        </div>

        <div className="resp-stack-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <label className="field-label">Specialty</label>
            <select
              className="select"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              required
              disabled={pending}
            >
              {SPECIALTIES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Practicing since</label>
            <input
              className="input"
              type="number"
              min={1900}
              max={new Date().getFullYear()}
              value={sinceYear}
              onChange={(e) => setSinceYear(e.target.value)}
              placeholder={`e.g. ${new Date().getFullYear() - 8}`}
              required
              disabled={pending}
            />
          </div>
        </div>

        <div>
          <label className="field-label">Diploma / qualification</label>
          <input
            className="input"
            value={diploma}
            onChange={(e) => setDiploma(e.target.value)}
            placeholder="MD — Université d'Alger · Board-certified Cardiology"
            required
            disabled={pending}
          />
          <div className="field-hint">
            Free text — degree, university, board certifications.
          </div>
        </div>

        <div>
          <label className="field-label">Short description (optional)</label>
          <textarea
            className="textarea"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Special interests, languages spoken, anything patients should know."
            disabled={pending}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={!canSubmit || pending}
        className="btn primary"
        style={{ width: "100%", padding: "12px 16px", marginTop: 20 }}
      >
        {pending ? <Loader2 size={14} className="animate-spin" /> : null}
        {pending ? "Saving…" : "Save and continue"} <ArrowRight size={14} />
      </button>
    </form>
  );
}
