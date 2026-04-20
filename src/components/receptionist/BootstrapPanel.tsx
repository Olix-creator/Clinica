"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { addClinicAction, attachDoctorAction } from "@/app/(dashboard)/receptionist/actions";

type Clinic = { id: string; name: string };

const INPUT =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30";

export function BootstrapPanel({ clinics }: { clinics: Clinic[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function submit(
    action: (fd: FormData) => Promise<{ ok: true } | { ok: false; error: string }>,
    successMsg: string,
  ) {
    return (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const fd = new FormData(form);
      startTransition(async () => {
        const res = await action(fd);
        if (res.ok) {
          toast.success(successMsg);
          form.reset();
          router.refresh();
        } else {
          toast.error(res.error);
        }
      });
    };
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-base font-semibold text-gray-900">Clinic & doctor management</h2>
        <p className="text-sm text-gray-500 mt-0.5">Create clinics and attach doctors.</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <form
          onSubmit={submit(addClinicAction, "Clinic created")}
          className="flex flex-col sm:flex-row gap-2"
        >
          <input
            name="name"
            placeholder="New clinic name"
            className={INPUT}
            disabled={pending}
            required
          />
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create clinic"}
          </Button>
        </form>

        <form
          onSubmit={submit(attachDoctorAction, "Doctor attached to clinic")}
          className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]"
        >
          <select name="clinicId" className={INPUT} disabled={pending || clinics.length === 0} required>
            <option value="">Select clinic…</option>
            {clinics.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            name="doctorEmail"
            type="email"
            placeholder="doctor@example.com"
            className={INPUT}
            disabled={pending}
            required
          />
          <input
            name="specialty"
            placeholder="Specialty (optional)"
            className={INPUT}
            disabled={pending}
          />
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Attach"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
