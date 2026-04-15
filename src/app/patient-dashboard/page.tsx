"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Briefcase, LogOut, Loader2, Pill, Plus, Check, Trash2, User, CalendarPlus,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/auth-context";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";

type Medication = { id: string; name: string; taken: boolean; created_at: string };

export default function PatientDashboardPage() {
  const { user, isSignedIn, isLoaded, signOut } = useAuth();
  const router = useRouter();
  const { t } = useI18n();
  const l = t("patientDashboard");
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMed, setNewMed] = useState("");
  const [adding, setAdding] = useState(false);
  const [patientName, setPatientName] = useState("");

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.replace("/login");
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();

    supabase.from("profiles").select("role, name").eq("id", user.id).single().then(({ data }) => {
      if (!data) { router.replace("/choose-role"); return; }
      if (data.role !== "patient") { router.replace("/doctor-dashboard"); return; }
      setPatientName(data.name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Patient");
    });

    async function loadMedications() {
      const { data } = await supabase.from("medications").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      setMedications(data || []);
      setLoading(false);
    }
    void loadMedications();
  }, [user, router]);

  async function addMedication(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !newMed.trim()) return;
    setAdding(true);
    const supabase = createClient();
    const { data, error } = await supabase.from("medications").insert({ user_id: user.id, name: newMed.trim() }).select().single();
    if (!error && data) { setMedications((prev) => [data, ...prev]); setNewMed(""); }
    setAdding(false);
  }

  async function toggleTaken(id: string, currentValue: boolean) {
    const supabase = createClient();
    await supabase.from("medications").update({ taken: !currentValue }).eq("id", id);
    setMedications((prev) => prev.map((m) => (m.id === id ? { ...m, taken: !currentValue } : m)));
  }

  async function deleteMedication(id: string) {
    const supabase = createClient();
    await supabase.from("medications").delete().eq("id", id);
    setMedications((prev) => prev.filter((m) => m.id !== id));
  }

  if (!isLoaded || !isSignedIn) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const takenCount = medications.filter((m) => m.taken).length;
  const totalCount = medications.length;

  return (
    <div className="min-h-screen bg-gray-bg-light">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20"><Briefcase className="w-5 h-5 text-white" /></div>
            <div><h1 className="text-lg font-bold text-gray-900">Clinica</h1><p className="text-xs text-gray-400">{l.title}</p></div>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center"><User className="w-4 h-4 text-green-600" /></div>
              <span className="hidden sm:block text-sm font-medium text-gray-700">{patientName}</span>
              <button type="button" onClick={signOut} className="ml-1 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer" title="Sign out">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">{l.welcome}, {patientName.split(" ")[0]}!</h2>
          <p className="text-gray-500 mt-1">{l.subtitle}</p>
        </div>

        <Link href="/book-appointment" className="mb-6 block bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 group-hover:bg-primary rounded-xl flex items-center justify-center transition-colors">
              <CalendarPlus className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{t("booking").title}</p>
              <p className="text-xs text-gray-400">{t("booking").subtitle}</p>
            </div>
          </div>
        </Link>

        {totalCount > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">{l.progress}</span>
              <span className="text-sm font-bold text-primary">{takenCount}/{totalCount}</span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-linear-to-r from-primary to-blue-400 rounded-full transition-all duration-500" style={{ width: `${totalCount > 0 ? (takenCount / totalCount) * 100 : 0}%` }} />
            </div>
          </div>
        )}

        <form onSubmit={addMedication} className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 shadow-sm flex gap-3">
          <div className="flex-1 relative">
            <Pill className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={newMed} onChange={(e) => setNewMed(e.target.value)} placeholder={l.addPlaceholder}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
          </div>
          <button type="submit" disabled={adding || !newMed.trim()}
            className="px-5 py-3 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-semibold rounded-xl flex items-center gap-2 transition-all hover:shadow-lg hover:shadow-primary/30 active:scale-95 cursor-pointer">
            {adding ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-5 h-5" /><span className="hidden sm:inline">{l.addBtn}</span></>}
          </button>
        </form>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-6 py-5 border-b border-gray-50">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Pill className="w-5 h-5 text-primary" />{l.medList}</h3>
          </div>
          {loading ? (
            <div className="p-12 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : medications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl mx-auto mb-4 flex items-center justify-center"><Pill className="w-8 h-8 text-gray-300" /></div>
              <p className="text-gray-500 font-medium">{l.noMeds}</p>
              <p className="text-sm text-gray-400 mt-1">{l.noMedsDesc}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {medications.map((med) => (
                <div key={med.id} className={`px-6 py-4 flex items-center gap-4 transition-colors ${med.taken ? "bg-green-50/30" : "hover:bg-gray-50/50"}`}>
                  <button onClick={() => toggleTaken(med.id, med.taken)}
                    className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer ${med.taken ? "bg-green-500 border-green-500 text-white" : "border-gray-200 hover:border-primary"}`}>
                    {med.taken && <Check className="w-4 h-4" />}
                  </button>
                  <span className={`flex-1 text-sm font-medium transition-all ${med.taken ? "text-gray-400 line-through" : "text-gray-900"}`}>{med.name}</span>
                  <button onClick={() => deleteMedication(med.id)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
