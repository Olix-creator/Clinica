"use client";

import Link from "next/link";
import {
  User, Phone, Building2, Bell, Shield, HelpCircle,
  ChevronRight, LogOut, Edit3, CalendarDays, Activity,
  Star, Settings,
} from "lucide-react";

/* ── Mock Data ────────────────────────��────────────────── */
const PATIENT = {
  name: "Ahmed Benali",
  phone: "+213 555 123 456",
  email: "ahmed.benali@email.com",
  clinic: "Clinica Central",
  initials: "AB",
  memberSince: "January 2025",
  totalVisits: 7,
  nextAppointment: "Apr 20, 10:30 AM",
};

const MENU_SECTIONS = [
  {
    title: "Account",
    items: [
      { icon: User,         label: "Personal Information",  desc: "Name, email, date of birth",  href: "#" },
      { icon: Phone,        label: "Contact Details",       desc: "Phone, address",               href: "#" },
      { icon: Building2,    label: "My Clinic",             desc: PATIENT.clinic,                 href: "/patient-portal/clinics" },
      { icon: CalendarDays, label: "Appointment History",   desc: "7 total visits",               href: "/patient-portal/appointments" },
    ],
  },
  {
    title: "Preferences",
    items: [
      { icon: Bell,    label: "Notifications",  desc: "Reminders, updates",   href: "#" },
      { icon: Settings, label: "App Settings",   desc: "Language, theme",      href: "#" },
    ],
  },
  {
    title: "Support",
    items: [
      { icon: Shield,     label: "Privacy & Security", desc: "Passwords, data",    href: "#" },
      { icon: HelpCircle, label: "Help & Support",      desc: "FAQs, contact us",   href: "#" },
    ],
  },
];

export default function ProfilePage() {
  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-5 border-b border-gray-100">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
          <button className="w-9 h-9 bg-gray-50 hover:bg-gray-100 rounded-xl flex items-center justify-center transition-colors">
            <Edit3 className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Avatar + Info */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-primary via-blue-600 to-indigo-700 flex items-center justify-center shadow-xl shadow-primary/30">
              <span className="text-2xl font-black text-white">{PATIENT.initials}</span>
            </div>
            <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border-2 border-gray-100 rounded-lg flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors">
              <Edit3 className="w-3 h-3 text-gray-500" />
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-900">{PATIENT.name}</h2>
            <p className="text-sm text-gray-500 truncate">{PATIENT.email}</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-xs font-semibold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
                Patient
              </span>
              <span className="text-xs text-gray-400">Since {PATIENT.memberSince}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          {[
            { label: "Total Visits",   value: PATIENT.totalVisits,   icon: Activity,     color: "text-primary",  bg: "bg-primary/10" },
            { label: "Next Appt",      value: "Apr 20",               icon: CalendarDays, color: "text-green-600", bg: "bg-green-50"  },
            { label: "Rating",         value: "4.9",                  icon: Star,         color: "text-amber-500", bg: "bg-amber-50"  },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-gray-50 rounded-2xl p-3 text-center">
              <div className={`w-8 h-8 ${bg} rounded-xl flex items-center justify-center mx-auto mb-1.5`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <p className="text-base font-bold text-gray-900 leading-tight">{value}</p>
              <p className="text-[10px] text-gray-400 font-medium leading-tight mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Menu Sections */}
      <div className="px-4 pt-4 pb-6 space-y-4">
        {MENU_SECTIONS.map(section => (
          <div key={section.title}>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1 mb-2">
              {section.title}
            </p>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
              {section.items.map(item => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center gap-4 px-4 py-3.5 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="w-9 h-9 bg-gray-50 group-hover:bg-primary/5 rounded-xl flex items-center justify-center transition-colors shrink-0">
                      <Icon className="w-4.5 h-4.5 text-gray-500 group-hover:text-primary transition-colors" strokeWidth={1.8} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                      <p className="text-xs text-gray-400 truncate">{item.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 shrink-0 transition-colors" />
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Contact info card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Contact</p>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-sm text-gray-700">{PATIENT.phone}</span>
            </div>
            <div className="flex items-center gap-3">
              <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-sm text-gray-700">{PATIENT.clinic}</span>
            </div>
          </div>
        </div>

        {/* Logout */}
        <button className="w-full flex items-center justify-center gap-3 py-4 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-2xl border border-red-100 active:scale-95 transition-all">
          <LogOut className="w-4.5 h-4.5" strokeWidth={2} />
          <span>Sign Out</span>
        </button>

        <p className="text-center text-xs text-gray-300 pb-2">Clinica v1.0 · © 2026</p>
      </div>
    </div>
  );
}
