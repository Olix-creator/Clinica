"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  User,
  Phone,
  ArrowRight,
  CheckCircle2,
  Users,
  Clock,
  Shield,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/context";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";

type QueueState =
  | { step: "form" }
  | { step: "success"; queueNumber: number; name: string };

export default function QueuePage() {
  const [state, setState] = useState<QueueState>({ step: "form" });
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { t } = useI18n();
  const q = t("queuePage");

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();

      const { data: numData, error: numError } = await supabase
        .rpc("next_queue_number");

      if (numError) throw new Error(numError.message);

      const queueNumber = numData as number;

      const { error: insertError } = await supabase.from("queue").insert({
        name: name.trim(),
        phone: phone.trim(),
        queue_number: queueNumber,
        status: "waiting",
      });

      if (insertError) throw new Error(insertError.message);

      setState({ step: "success", queueNumber, name: name.trim() });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : q.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-gray-50 flex flex-col">
      {/* Header */}
      <header className="px-4 py-4 flex items-center justify-between max-w-4xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center group-hover:bg-primary-dark transition-colors">
            <Briefcase className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900">Clinica</span>
        </Link>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link
            href="/sign-in"
            className="text-sm text-gray-500 hover:text-primary transition-colors"
          >
            {q.staffLogin}
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {state.step === "form" ? (
            <div className="animate-fade-in-up">
              {/* Top icon */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4 shadow-lg shadow-primary/30">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">{q.joinQueue}</h1>
                <p className="text-gray-500 mt-1 text-sm">{q.enterDetails}</p>
              </div>

              {/* Live status bar */}
              <div className="flex items-center justify-center gap-2 mb-6 py-2.5 px-4 bg-green-50 border border-green-100 rounded-xl">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-green-700">{q.clinicOpen}</span>
              </div>

              {/* Form card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-7">
                <form onSubmit={handleJoin} className="space-y-5">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {q.fullName} <span className="text-danger">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ahmed Benali"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {q.phoneNumber} <span className="text-danger">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0555 123 456"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="text-sm text-danger bg-danger-light rounded-xl px-4 py-3">
                      {error}
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading || !name.trim() || !phone.trim()}
                    className="w-full py-3.5 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-primary/30 active:scale-95"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {q.addingToQueue}
                      </>
                    ) : (
                      <>
                        {q.joinQueueBtn}
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>

                {/* Privacy note */}
                <div className="flex items-center gap-2 mt-4 text-xs text-gray-400">
                  <Shield className="w-3.5 h-3.5" />
                  {q.privacyNote}
                </div>
              </div>

              {/* Info cards */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <Clock className="w-5 h-5 text-primary mb-2" />
                  <p className="text-xs font-medium text-gray-700">{q.averageWait}</p>
                  <p className="text-lg font-bold text-gray-900">~15 min</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <Users className="w-5 h-5 text-primary mb-2" />
                  <p className="text-xs font-medium text-gray-700">{q.queueSystem}</p>
                  <p className="text-lg font-bold text-gray-900">{q.live}</p>
                </div>
              </div>
            </div>
          ) : (
            /* ── SUCCESS STATE ── */
            <div className="animate-scale-in text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-primary rounded-3xl mb-6 shadow-2xl shadow-primary/40">
                <span className="text-4xl font-extrabold text-white">
                  {state.queueNumber}
                </span>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {q.youreInQueue}
                </h2>
                <p className="text-gray-500 mb-6 text-sm">
                  {q.welcome} <span className="font-semibold text-gray-800">{state.name}</span>
                </p>

                <div className="bg-primary/5 border border-primary/10 rounded-xl px-6 py-4 mb-6">
                  <p className="text-sm text-gray-500 mb-1">{q.yourQueueNumber}</p>
                  <p className="text-5xl font-extrabold text-primary">
                    #{state.queueNumber}
                  </p>
                </div>

                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center gap-2 justify-center">
                    <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                    {q.stayNearby}
                  </div>
                  <p>{q.doctorWillCall}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setName("");
                  setPhone("");
                  setState({ step: "form" });
                }}
                className="text-sm text-gray-400 hover:text-primary transition-colors"
              >
                {q.addAnother}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
