"use client";

import { useState } from "react";
import { useLanguageStore } from "@/stores/language-store";
import { languageNames, Language } from "@/lib/translations";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

export function LanguageSelector() {
  const { language, setLanguage } = useLanguageStore();

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-neutral-400" />
      <Select
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
        options={Object.entries(languageNames).map(([value, label]) => ({
          value,
          label,
        }))}
        className="w-32"
      />
    </div>
  );
}
