"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Eye } from "lucide-react";
import { differenceInYears } from "date-fns";

interface PatientUser {
  id: string;
  user_id: string;
  date_of_birth: string | null;
  blood_type: string | null;
  allergies: string[] | null;
  chronic_conditions: string[] | null;
  users?: {
    full_name: string;
    phone: string | null;
    email: string;
  };
}

export default function PatientListClient({ patients }: { patients: PatientUser[] }) {
  const [search, setSearch] = useState("");

  const filtered = patients.filter((p) =>
    p.users?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search patients by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Patient Name</th>
                <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3 hidden md:table-cell">ID</th>
                <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3 hidden md:table-cell">Age</th>
                <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3 hidden lg:table-cell">Phone</th>
                <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3 hidden lg:table-cell">Blood Type</th>
                <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Status</th>
                <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((patient) => {
                const name = patient.users?.full_name || "Unknown";
                const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2);
                const age = patient.date_of_birth
                  ? differenceInYears(new Date(), new Date(patient.date_of_birth))
                  : "—";

                return (
                  <tr key={patient.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-xs font-semibold text-gray-600">
                          {initials}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{name}</p>
                          <p className="text-xs text-gray-400">{patient.users?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-sm text-gray-500">#{patient.id.slice(0, 8)}</span>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-sm text-gray-600">{age}</span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className="text-sm text-gray-600">{patient.users?.phone || "—"}</span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className="text-sm text-gray-600">{patient.blood_type || "—"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-50 text-green-700">
                        ACTIVE
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/doctor/patients/${patient.id}`} className="text-gray-400 hover:text-primary">
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-400">
                    No patients found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
