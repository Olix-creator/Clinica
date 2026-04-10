"use client";

import { useI18n } from "@/lib/i18n/context";
import { Globe } from "lucide-react";

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n();
  const common = t("common");

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-all">
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">{language === "en" ? "EN" : "FR"}</span>
      </button>
      <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[120px]">
        <button
          onClick={() => setLanguage("en")}
          className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 ${
            language === "en" ? "text-primary font-medium" : "text-gray-600"
          }`}
        >
          {common.english}
        </button>
        <button
          onClick={() => setLanguage("fr")}
          className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 ${
            language === "fr" ? "text-primary font-medium" : "text-gray-600"
          }`}
        >
          {common.french}
        </button>
      </div>
    </div>
  );
}
