"use client";

import { useState } from "react";
import { MapPin, Star, CheckCircle2, Search, ChevronRight, Clock, Phone } from "lucide-react";

/* ── Mock Data ─────────────────────────────────────────── */
const CLINICS = [
  {
    id: "1",
    name: "Clinica Central",
    address: "12 Rue Didouche Mourad, Algiers",
    specialty: "General & Specialist",
    rating: 4.8,
    reviews: 124,
    waitTime: "~15 min",
    phone: "+213 21 654 321",
    open: true,
    tags: ["General", "Cardiology", "Pediatrics"],
    selected: true,
  },
  {
    id: "2",
    name: "MedPlus Clinic",
    address: "45 Boulevard Krim Belkacem, Oran",
    specialty: "Cardiology & Internal Medicine",
    rating: 4.6,
    reviews: 89,
    waitTime: "~25 min",
    phone: "+213 41 234 567",
    open: true,
    tags: ["Cardiology", "Internal Medicine"],
    selected: false,
  },
  {
    id: "3",
    name: "HealthFirst Center",
    address: "8 Rue Larbi Ben M'Hidi, Constantine",
    specialty: "Pediatrics & Surgery",
    rating: 4.5,
    reviews: 67,
    waitTime: "~40 min",
    phone: "+213 31 765 432",
    open: false,
    tags: ["Pediatrics", "Surgery", "ENT"],
    selected: false,
  },
  {
    id: "4",
    name: "Al Shifa Medical",
    address: "22 Avenue de l'ALN, Annaba",
    specialty: "Orthopedics & Rehabilitation",
    rating: 4.4,
    reviews: 45,
    waitTime: "~30 min",
    phone: "+213 38 456 789",
    open: true,
    tags: ["Orthopedics", "Rehab", "Sports"],
    selected: false,
  },
];

export default function ClinicsPage() {
  const [selectedId, setSelectedId] = useState("1");
  const [search, setSearch]         = useState("");

  const filtered = CLINICS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.specialty.toLowerCase().includes(search.toLowerCase()) ||
    c.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-4 sticky top-0 z-30 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900 mb-4">Select Clinic</h1>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search clinics..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {/* Currently selected banner */}
        {(() => {
          const current = CLINICS.find(c => c.id === selectedId);
          return current ? (
            <div className="bg-linear-to-r from-primary to-blue-600 rounded-2xl p-4 text-white shadow-lg shadow-primary/25 animate-fade-in-up">
              <p className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-1">Currently Selected</p>
              <p className="text-base font-bold">{current.name}</p>
              <p className="text-xs text-white/70 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{current.address}</p>
            </div>
          ) : null;
        })()}

        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-sm text-gray-500">No clinics found for &ldquo;{search}&rdquo;</p>
          </div>
        ) : (
          filtered.map(clinic => {
            const isSelected = selectedId === clinic.id;
            return (
              <div
                key={clinic.id}
                className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden transition-all ${
                  isSelected ? "border-primary shadow-md shadow-primary/10" : "border-gray-100 hover:border-gray-200"
                }`}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold text-gray-900">{clinic.name}</h3>
                        {isSelected && (
                          <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            SELECTED
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 shrink-0" />{clinic.address}
                      </p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      isSelected ? "border-primary bg-primary" : "border-gray-200"
                    }`}>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                  </div>

                  {/* Specialty */}
                  <p className="text-xs font-medium text-gray-600 mb-3">{clinic.specialty}</p>

                  {/* Stats row */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="font-bold text-gray-900">{clinic.rating}</span>
                      <span className="text-gray-400">({clinic.reviews})</span>
                    </div>
                    <div className="w-1 h-1 bg-gray-200 rounded-full" />
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {clinic.waitTime}
                    </div>
                    <div className="w-1 h-1 bg-gray-200 rounded-full" />
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      clinic.open ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"
                    }`}>
                      {clinic.open ? "Open" : "Closed"}
                    </span>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {clinic.tags.map(tag => (
                      <span key={tag} className="text-[10px] font-semibold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedId(clinic.id)}
                      className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all active:scale-95 ${
                        isSelected
                          ? "bg-primary text-white shadow-sm shadow-primary/25"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-100"
                      }`}
                    >
                      {isSelected ? "✓ Selected" : "Select Clinic"}
                    </button>
                    <button className="px-3 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors border border-gray-100">
                      <Phone className="w-4 h-4 text-gray-500" />
                    </button>
                    <button className="px-3 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors border border-gray-100">
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
