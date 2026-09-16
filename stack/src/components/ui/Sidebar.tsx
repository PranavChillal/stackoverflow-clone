"use client";

import {
  Home,
  MessageSquare,
  Bot,
  Tags,
  Users,
  Bookmark,
  Trophy,
  MessageCircle,
  FileText,
  Building2,
  X,
} from "lucide-react";
import Link from "next/link";
import React from "react";
import { Badge } from "./badge";
import LanguageSelector from "./LanguageSelector";
import { useAuth } from "@/lib/AuthContext";
import translations from "@/lib/translations";

interface SidebarProps {
  isOpen?: boolean;
  onclose?: () => void;
}

const Sidebar = ({ isOpen = false, onclose }: SidebarProps) => {
  const auth = useAuth() as any;

  const language = auth?.language || "english";

  const languageKey = language as keyof typeof translations;

  const t = translations[languageKey] || translations.english;

  const handleLinkClick = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      onclose?.();
    }
  };

  return (
    <>
      {/* Mobile / Tablet Overlay */}

      {isOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={onclose}
          className="fixed inset-0 top-[53px] z-40 bg-black/30 lg:hidden"
        />
      )}

      <aside
        className={`
          fixed
          left-0
          top-[53px]
          z-50
          h-[calc(100vh-53px)]
          w-64
          max-w-[85vw]
          overflow-y-auto
          border-r
          bg-white
          shadow-sm
          transition-transform
          duration-200
          ease-in-out

          lg:sticky
          lg:top-[53px]
          lg:z-30
          lg:h-[calc(100vh-53px)]
          lg:w-48
          lg:max-w-none
          lg:translate-x-0
          lg:shadow-sm

          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Mobile / Tablet Header */}

        <div className="flex items-center justify-between border-b px-4 py-3 lg:hidden">
          <span className="font-semibold text-gray-900">{t.home}</span>

          <button
            type="button"
            onClick={onclose}
            aria-label="Close navigation menu"
            className="flex h-9 w-9 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="p-2 lg:p-4">
          <ul className="space-y-1">
            {/* Home */}

            <li>
              <Link
                href="/"
                onClick={handleLinkClick}
                className="flex min-h-10 items-center rounded px-2 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Home className="mr-2 h-4 w-4 shrink-0 lg:mr-3" />
                {t.home}
              </Link>
            </li>

            {/* Questions */}

            <li>
              <Link
                href="/questions"
                onClick={handleLinkClick}
                className="flex min-h-10 items-center rounded px-2 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <MessageSquare className="mr-2 h-4 w-4 shrink-0 lg:mr-3" />
                {t.questions}
              </Link>
            </li>

            {/* Community */}

            <li>
              <Link
                href="/community"
                onClick={handleLinkClick}
                className="flex min-h-10 items-center rounded px-2 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <MessageCircle className="mr-2 h-4 w-4 shrink-0 lg:mr-3" />
                {(t as any).community}
              </Link>
            </li>

            {/* AI Assist */}

            <li>
              <Link
                href="/"
                onClick={handleLinkClick}
                className="flex min-h-10 items-center rounded px-2 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Bot className="mr-2 h-4 w-4 shrink-0 lg:mr-3" />

                <span className="min-w-0 truncate">{t.aiAssist}</span>

                <Badge className="ml-auto shrink-0">{t.labs}</Badge>
              </Link>
            </li>

            {/* Tags */}

            <li>
              <Link
                href="/"
                onClick={handleLinkClick}
                className="flex min-h-10 items-center rounded px-2 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Tags className="mr-2 h-4 w-4 shrink-0 lg:mr-3" />
                {t.tags}
              </Link>
            </li>

            {/* Users */}

            <li>
              <Link
                href="/users"
                onClick={handleLinkClick}
                className="flex min-h-10 items-center rounded px-2 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Users className="mr-2 h-4 w-4 shrink-0 lg:mr-3" />
                {t.users}
              </Link>
            </li>

            {/* Saves */}

            <li>
              <Link
                href="/"
                onClick={handleLinkClick}
                className="flex min-h-10 items-center rounded px-2 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Bookmark className="mr-2 h-4 w-4 shrink-0 lg:mr-3" />
                {t.saves}
              </Link>
            </li>

            {/* Challenges */}

            <li>
              <Link
                href="/"
                onClick={handleLinkClick}
                className="flex min-h-10 items-center rounded px-2 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Trophy className="mr-2 h-4 w-4 shrink-0 lg:mr-3" />

                <span className="min-w-0 truncate">{t.challenges}</span>

                <Badge className="ml-auto shrink-0">{t.new}</Badge>
              </Link>
            </li>

            {/* Chat */}

            <li>
              <Link
                href="/"
                onClick={handleLinkClick}
                className="flex min-h-10 items-center rounded px-2 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <MessageCircle className="mr-2 h-4 w-4 shrink-0 lg:mr-3" />
                {t.chat}
              </Link>
            </li>

            {/* Articles */}

            <li>
              <Link
                href="/"
                onClick={handleLinkClick}
                className="flex min-h-10 items-center rounded px-2 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <FileText className="mr-2 h-4 w-4 shrink-0 lg:mr-3" />
                {t.articles}
              </Link>
            </li>

            {/* Companies */}

            <li>
              <Link
                href="/"
                onClick={handleLinkClick}
                className="flex min-h-10 items-center rounded px-2 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Building2 className="mr-2 h-4 w-4 shrink-0 lg:mr-3" />
                {t.companies}
              </Link>
            </li>
          </ul>

          <div className="mt-4 border-t pt-4">
            <LanguageSelector />
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
