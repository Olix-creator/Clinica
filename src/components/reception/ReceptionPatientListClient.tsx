"use client";

import { useState } from "react";
import { format, differenceInYears } from "date-fns";
import { Search, Phone, Mail, Calendar, User } from "lucide-react";
import Link from "next/link";

interface Patient {
  id: string;
  date_of_birth?: string;
  gender?: string;
  blood_type?: string;
  created_at?: string;
  users?: {
    full_name: string;
    email?: string;
    phone?: string;
  };
}

export default function ReceptionPatientListClient({
  patients,
}: {
  patients: Patient[];
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");

  const filtered = patients.filter((patient) => {
    if (genderFilter !== "all" && patient.gender !== genderFilter) return false;
    if (searchQuery) {
      const name = patient.users?.full_name?.toLowerCase() || "";
      const email = patient.users?.email?.toLowerCase() || "";
      const phone = patient.users?.phone?.toLowerCase() || "";
      const query = searchQuery.toLowerCase();
      if (!name.includes(query) && !email.includes(query) && !phone.includes(query)) return false;
    }
    return true;
  });

  function getAge(dateOfBirth?: string): string {
    if (!dateOfBirth) return "N/A";
    return String(differenceInYears(new Date(), new Date(dateOfBirth)));
  }

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="all">All Genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
      </div>

      {/* Patient Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((patient) => {
          const name = patient.users?.full_name || "Unknown";
          const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2);
          const age = getAge(patient.date_of_birth);

          return (
            <div
              key={patient.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-sm font-semibold text-teal-700">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{name}</h3>
                  <p className="text-xs text-gray-400">ID: #{patient.id.slice(0, 8)}</p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="w-4 h-4 text-gray-400" />
                  <span>
                    {age !== "N/A" ? `${age} years` : "Age N/A"} 
                    {patient.gender ? ` • ${patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}` : ""}
                  </span>
                </div>
                {patient.users?.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{patient.users.phone}</span>
                  </div>
                )}
                {patient.users?.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 truncate">
                    <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{patient.users.email}</span>
                  </div>
                )}
                {patient.blood_type && (
                  <div className="inline-flex items-center px-2 py-0.5 bg-red-50 text-red-700 text-xs font-semibold rounded-full">
                    {patient.blood_type}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  Registered {patient.created_at ? format(new Date(patient.created_at), "MMM dd, yyyy") : "N/A"}
                </span>
                <Link
                  href={`/reception/appointments`}
                  className="text-xs font-medium text-teal-600 hover:text-teal-700"
                >
                  Book Appointment
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No patients found</h3>
          <p className="text-sm text-gray-500">
            {searchQuery ? "Try a different search term" : "Register a new patient to get started"}
          </p>
        </div>
      )}
    </div>
  );
}
