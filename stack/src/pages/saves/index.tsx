import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, Trash2 } from "lucide-react";

import MainLayout from "@/layout/MainLayout";
import axiosInstance from "@/lib/axiosinstance";
import { useAuth } from "@/lib/AuthContext";
import translations from "@/lib/translations";

interface Answer {
  _id?: string;
  answerBody?: string;
}

interface Question {
  _id: string;
  title: string;
  body: string;
  tags: string[];
  votes: number;
  answers: Answer[];
  askedOn: string;
}

interface BookmarkItem {
  _id: string;
  questionId: Question;
  createdAt: string;
}

interface SubscriptionInfo {
  plan: string;
  unlimitedBookmarks: boolean;
  bookmarkLimit: number | null;
  bookmarkCount: number;
}

const localeMap: Record<string, string> = {
  english: "en-IN",
  spanish: "es-ES",
  hindi: "hi-IN",
  portuguese: "pt-PT",
  chinese: "zh-CN",
  french: "fr-FR",
};

const Saves = () => {
  const auth = useAuth() as any;

  const { user } = auth;

  const language = auth?.language || "english";

  const languageKey = language as keyof typeof translations;

  const t = translations[languageKey] || translations.english;

  const s = (t as any).savesPage || (translations.english as any).savesPage;

  const locale = localeMap[language] || "en-IN";

  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);

  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(
    null,
  );

  const [loading, setLoading] = useState(true);

  const [removingId, setRemovingId] = useState<string | null>(null);

  const [error, setError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Format Saved Date
  |--------------------------------------------------------------------------
  */

  const formatDate = (date: string) => {
    if (!date) {
      return s.unknownDate;
    }

    const savedDate = new Date(date);

    const now = new Date();

    const difference = now.getTime() - savedDate.getTime();

    const minutes = Math.floor(difference / (1000 * 60));

    const hours = Math.floor(difference / (1000 * 60 * 60));

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));

    if (minutes < 1) {
      return s.justNow;
    }

    if (minutes < 60) {
      return `${minutes} ${minutes === 1 ? s.minute : s.minutes} ${s.ago}`;
    }

    if (hours < 24) {
      return `${hours} ${hours === 1 ? s.hour : s.hours} ${s.ago}`;
    }

    if (days < 30) {
      return `${days} ${days === 1 ? s.day : s.days} ${s.ago}`;
    }

    return savedDate.toLocaleDateString(locale);
  };

  /*
  |--------------------------------------------------------------------------
  | Load Bookmarks
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const loadBookmarks = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await axiosInstance.get("/bookmark");

        setBookmarks(
          Array.isArray(response.data.data) ? response.data.data : [],
        );

        setSubscription(response.data.subscription || null);
      } catch (error: any) {
        console.log("Unable to load saved questions", error);

        setError(error.response?.data?.message || s.unableToLoad);
      } finally {
        setLoading(false);
      }
    };

    loadBookmarks();
  }, [user, language]);

  /*
  |--------------------------------------------------------------------------
  | Remove Bookmark
  |--------------------------------------------------------------------------
  */

  const removeBookmark = async (questionId: string) => {
    if (removingId) {
      return;
    }

    try {
      setRemovingId(questionId);

      await axiosInstance.delete(`/bookmark/remove/${questionId}`);

      setBookmarks((current) =>
        current.filter((item) => item.questionId?._id !== questionId),
      );
    } catch (error: any) {
      console.log("Unable to remove bookmark", error);

      alert(error.response?.data?.message || s.unableToRemove);
    } finally {
      setRemovingId(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Not Logged In
  |--------------------------------------------------------------------------
  */

  if (!user) {
    return (
      <MainLayout>
        <main className="w-full min-w-0">
          <div className="mx-auto w-full max-w-3xl rounded-lg border border-gray-200 bg-white p-5 text-center sm:p-8">
            <Bookmark size={40} className="mx-auto mb-4 text-gray-400" />

            <h1 className="break-words text-xl font-bold text-gray-800 sm:text-2xl">
              {s.heading}
            </h1>

            <p className="mx-auto mt-2 max-w-xl break-words text-sm leading-6 text-gray-600 sm:text-base">
              {s.loginDescription}
            </p>

            <Link href="/auth">
              <button className="mt-5 min-h-10 rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
                {t.logIn}
              </button>
            </Link>
          </div>
        </main>
      </MainLayout>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Main Page
  |--------------------------------------------------------------------------
  */

  return (
    <MainLayout>
      <main className="w-full min-w-0">
        {/* Header */}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-3">
              <Bookmark
                size={26}
                className="shrink-0 text-gray-700 sm:h-7 sm:w-7"
              />

              <h1 className="min-w-0 break-words text-xl font-bold text-gray-800 sm:text-2xl">
                {s.heading}
              </h1>
            </div>

            <p className="mt-1 break-words text-sm leading-5 text-gray-500">
              {s.description}
            </p>
          </div>

          {subscription && (
            <div className="w-full shrink-0 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm sm:w-auto">
              <div className="font-medium text-gray-800">
                {subscription.bookmarkCount}{" "}
                {subscription.bookmarkCount === 1
                  ? s.savedQuestion
                  : s.savedQuestions}{" "}
                {s.saved}
              </div>

              <div className="mt-1 break-words text-xs text-gray-500">
                {subscription.unlimitedBookmarks
                  ? s.unlimitedBookmarks
                  : `${subscription.bookmarkCount}/${subscription.bookmarkLimit} ${s.bookmarksUsed}`}
              </div>
            </div>
          )}
        </div>

        {/* Error */}

        {error && (
          <div className="mb-5 break-words rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700">
            {error}
          </div>
        )}

        {/* Loading */}

        {loading ? (
          <div className="py-10 text-center text-sm text-gray-600 sm:text-base">
            {s.loading}
          </div>
        ) : bookmarks.length === 0 ? (
          /* Empty State */

          <div className="rounded-lg border border-gray-200 bg-white p-6 text-center sm:p-10">
            <Bookmark size={44} className="mx-auto mb-4 text-gray-300" />

            <h2 className="break-words text-lg font-semibold text-gray-800 sm:text-xl">
              {s.emptyTitle}
            </h2>

            <p className="mx-auto mt-2 max-w-xl break-words text-sm leading-6 text-gray-500">
              {s.emptyDescription}
            </p>

            <Link href="/">
              <button className="mt-5 min-h-10 rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
                {s.browseQuestions}
              </button>
            </Link>
          </div>
        ) : (
          /* Saved Questions */

          <div className="border-t border-gray-200">
            {bookmarks.map((item) => {
              const question = item.questionId;

              if (!question) {
                return null;
              }

              return (
                <div
                  key={item._id}
                  className="flex min-w-0 flex-col gap-3 border-b border-gray-200 py-5 sm:flex-row sm:gap-4"
                >
                  {/* Stats */}

                  <div className="flex w-full shrink-0 items-center gap-4 text-left text-sm text-gray-600 sm:w-20 sm:flex-col sm:items-end sm:justify-start sm:gap-2 sm:text-right">
                    <div className="flex items-center gap-1 sm:block">
                      <div className="font-medium">{question.votes}</div>

                      <div className="text-xs sm:text-sm">{s.votes}</div>
                    </div>

                    <div
                      className={`flex items-center gap-1 rounded px-1 py-0.5 sm:block ${
                        question.answers?.length > 0
                          ? "border border-green-500 text-green-600"
                          : ""
                      }`}
                    >
                      <div>{question.answers?.length || 0}</div>

                      <div className="text-xs sm:text-sm">
                        {question.answers?.length === 1 ? s.answer : s.answers}
                      </div>
                    </div>
                  </div>

                  {/* Question */}

                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/questions/${question._id}`}
                      className="block break-words text-base leading-6 text-blue-600 hover:text-blue-800 sm:text-lg"
                    >
                      {question.title}
                    </Link>

                    <p className="mt-1 line-clamp-2 break-words text-sm leading-5 text-gray-700">
                      {question.body}
                    </p>

                    {/* Tags + Saved Date + Remove */}

                    <div className="mt-3 flex min-w-0 flex-col gap-3">
                      {/* Tags */}

                      <div className="flex min-w-0 flex-wrap gap-1">
                        {question.tags?.map((tag) => (
                          <span
                            key={tag}
                            className="max-w-full break-all rounded bg-blue-100 px-2 py-1 text-xs text-blue-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Saved Info */}

                      <div className="flex min-w-0 items-center justify-between gap-3">
                        <span className="min-w-0 break-words text-xs leading-5 text-gray-500">
                          {s.savedAt} {formatDate(item.createdAt)}
                        </span>

                        <button
                          type="button"
                          onClick={() => removeBookmark(question._id)}
                          disabled={removingId === question._id}
                          title={s.removeBookmark}
                          aria-label={s.removeBookmark}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </MainLayout>
  );
};

export default Saves;
