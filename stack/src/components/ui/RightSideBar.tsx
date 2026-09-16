"use client";

import React from "react";
import { useAuth } from "@/lib/AuthContext";
import translations from "@/lib/translations";

const RightSideBar = () => {
  const auth = useAuth() as any;

  const language = auth?.language || "english";

  const languageKey = language as keyof typeof translations;

  const t = translations[languageKey] || translations.english;

  return (
    <aside className="w-64 shrink-0 overflow-hidden bg-white p-4">
      {/* The Overflow Blog */}

      <div className="mb-4 rounded-lg border">
        <div className="border-b bg-yellow-50 p-4">
          <h3 className="mb-3 text-base font-bold">{t.overflowBlog}</h3>

          <div className="space-y-3 text-sm">
            <p className="flex gap-2 break-words">
              <span className="shrink-0">🖉</span>
              <span className="min-w-0">{t.overflowArticle1}</span>
            </p>

            <p className="flex gap-2 break-words">
              <span className="shrink-0">🖉</span>
              <span className="min-w-0">{t.overflowArticle2}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Featured on Meta */}

      <div className="mb-6 rounded-lg border">
        <div className="p-4">
          <h3 className="mb-3 text-base font-bold">{t.featuredMeta}</h3>

          <div className="space-y-3 text-sm">
            <p className="flex gap-2 break-words">
              <span className="shrink-0">💬</span>
              <span className="min-w-0">{t.meta1}</span>
            </p>

            <p className="flex gap-2 break-words">
              <span className="shrink-0">💬</span>
              <span className="min-w-0">{t.meta2}</span>
            </p>

            <p className="flex gap-2 break-words">
              <span className="shrink-0">📋</span>
              <span className="min-w-0">{t.meta3}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Custom Filters */}

      <div className="mb-6">
        <h3 className="mb-4 text-base font-bold">{t.customFilters}</h3>

        <button
          type="button"
          className="max-w-full rounded-md border border-blue-400 px-3 py-2 text-sm text-blue-600"
        >
          {t.createFilter}
        </button>
      </div>

      {/* Watched Tags */}

      <div>
        <h3 className="mb-8 text-base font-bold">{t.watchedTags}</h3>

        <div className="text-center text-gray-400">
          <div className="mb-4 text-5xl">◉</div>

          <p className="break-words text-sm">{t.watchedDescription}</p>

          <button
            type="button"
            className="mt-4 max-w-full rounded-md border border-blue-400 px-3 py-2 text-sm text-blue-600"
          >
            👁 {t.watchTag}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default RightSideBar;
