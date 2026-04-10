"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Calendar, Pill, FolderOpen } from "lucide-react";

const tabs = [
  { key: "visits", label: "Visits History", icon: Calendar },
  { key: "prescriptions", label: "Prescriptions", icon: Pill },
  { key: "files", label: "Clinical Files", icon: FolderOpen },
];

export default function PatientTabs({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const activeTab = searchParams.get("tab") || "visits";

  function setTab(tab: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div>
      <div className="flex items-center gap-6 border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setTab(tab.key)}
            className={`flex items-center gap-2 px-1 pb-3 text-sm font-medium border-b-2 transition-all ${
              activeTab === tab.key
                ? "text-primary border-primary"
                : "text-gray-500 border-transparent hover:text-gray-700"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>
      {children}
    </div>
  );
}

export function useActiveTab() {
  const searchParams = useSearchParams();
  return searchParams.get("tab") || "visits";
}
