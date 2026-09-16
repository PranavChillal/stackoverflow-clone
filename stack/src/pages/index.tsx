import React, { useEffect, useMemo, useState } from "react";
import MainLayout from "@/layout/MainLayout";
import Link from "next/link";
import { useRouter } from "next/router";
import axiosInstance from "@/lib/axiosinstance";
import { useAuth } from "@/lib/AuthContext";
import translations from "@/lib/translations";

interface Question {
  _id: string;
  votes: number;
  answers: any[];
  title: string;
  body: string;
  tags: string[];
  userId: string;
  askedOn: string;
}

type SubscriptionPlan = "free" | "bronze" | "silver" | "gold";

const Home = () => {
  const router = useRouter();

  const auth = useAuth() as any;
  const user = auth?.user;
  const language = auth?.language || "english";

  const languageKey = language as keyof typeof translations;
  const t = (translations[languageKey] || translations.english) as any;

  /*
   * AuthContext restores a saved user from localStorage after the
   * application mounts. We wait for that first check before rendering
   * the protected Home page.
   */
  const [authChecked, setAuthChecked] = useState(false);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const [subscriptionPlan, setSubscriptionPlan] =
    useState<SubscriptionPlan>("free");

  const [subscriptionLoading, setSubscriptionLoading] = useState(true);

  const [showFilters, setShowFilters] = useState(false);

  /*
   * Draft filter values.
   *
   * These are changed while the filter panel is open.
   * They are NOT sent to the backend until Apply is clicked.
   */
  const [selectedTag, setSelectedTag] = useState("");
  const [unansweredOnly, setUnansweredOnly] = useState(false);
  const [minimumVotes, setMinimumVotes] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  /*
   * Applied filter values.
   *
   * These are the values actually being used by the API.
   */
  const [appliedTag, setAppliedTag] = useState("");
  const [appliedUnansweredOnly, setAppliedUnansweredOnly] = useState(false);
  const [appliedMinimumVotes, setAppliedMinimumVotes] = useState("");
  const [appliedSortBy, setAppliedSortBy] = useState("newest");

  const searchQuery =
    typeof router.query.search === "string" ? router.query.search.trim() : "";

  const hasAdvancedSearch =
    subscriptionPlan === "bronze" ||
    subscriptionPlan === "silver" ||
    subscriptionPlan === "gold";

  const hasHighestSearchPriority = subscriptionPlan === "gold";

  /*
   * Mark the authentication check as complete after the first client
   * render. AuthContext gets a chance to restore the saved user before
   * the protected page is allowed to continue.
   */
  useEffect(() => {
    setAuthChecked(true);
  }, []);

  /*
   * Protected-route check.
   *
   * If there is no logged-in user after authentication has been checked,
   * send the visitor directly to the login page.
   */
  useEffect(() => {
    if (!authChecked) {
      return;
    }

    if (!user) {
      router.replace("/auth");
    }
  }, [authChecked, user, router]);

  /*
   * Only fetch subscription information for authenticated users.
   */
  useEffect(() => {
    if (!authChecked || !user) {
      return;
    }

    const getSubscriptionStatus = async () => {
      try {
        const response = await axiosInstance.get("/subscription/status");

        const plan = response.data?.data?.plan;

        if (plan === "bronze" || plan === "silver" || plan === "gold") {
          setSubscriptionPlan(plan);
        } else {
          setSubscriptionPlan("free");
        }
      } catch (error) {
        console.log("Unable to fetch subscription status", error);

        setSubscriptionPlan("free");
      } finally {
        setSubscriptionLoading(false);
      }
    };

    getSubscriptionStatus();
  }, [authChecked, user]);

  /*
   * Fetch questions using ONLY the filters that have actually been
   * applied.
   *
   * This means changing a filter does not immediately fire a request.
   * The request happens when Apply filters updates the applied state.
   */
  useEffect(() => {
    if (!authChecked || !user || subscriptionLoading) {
      return;
    }

    const getQuestions = async () => {
      try {
        setLoading(true);

        const params: Record<string, string> = {};

        /*
         * Basic keyword search.
         *
         * The backend handles searching title, body and tags.
         */
        if (searchQuery) {
          params.search = searchQuery;
        }

        /*
         * Advanced filters are only sent for paid plans.
         */
        if (hasAdvancedSearch) {
          if (appliedTag) {
            params.tag = appliedTag;
          }

          if (appliedUnansweredOnly) {
            params.unanswered = "true";
          }

          if (appliedMinimumVotes) {
            params.minVotes = appliedMinimumVotes;
          }

          params.sort = appliedSortBy || "newest";
        } else {
          /*
           * Free users get basic search with newest sorting.
           */
          params.sort = "newest";
        }

        const response = await axiosInstance.get("/question/getallquestions", {
          params,
        });

        setQuestions(
          Array.isArray(response.data.data) ? response.data.data : [],
        );
      } catch (error) {
        console.log("Unable to fetch questions", error);

        setQuestions([]);
      } finally {
        setLoading(false);
      }
    };

    getQuestions();
  }, [
    authChecked,
    user,
    searchQuery,
    appliedTag,
    appliedUnansweredOnly,
    appliedMinimumVotes,
    appliedSortBy,
    hasAdvancedSearch,
    subscriptionLoading,
  ]);

  /*
   * The backend is the single source of truth.
   *
   * Do not re-filter the returned questions on the client because
   * that can make the frontend disagree with the API.
   */
  const filteredQuestions = questions;

  /*
   * Build the available tag list from the questions currently loaded.
   */
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();

    questions.forEach((question) => {
      question.tags?.forEach((tag) => {
        if (tag) {
          tagSet.add(tag);
        }
      });
    });

    return Array.from(tagSet).sort();
  }, [questions]);

  /*
   * Apply the filter panel values.
   *
   * We validate minimum votes before sending anything to the API.
   */
  const applyFilters = () => {
    const parsedVotes = minimumVotes.trim();

    if (
      parsedVotes &&
      (!/^\d+$/.test(parsedVotes) || Number(parsedVotes) < 0)
    ) {
      return;
    }

    setAppliedTag(selectedTag);
    setAppliedUnansweredOnly(unansweredOnly);
    setAppliedMinimumVotes(parsedVotes);
    setAppliedSortBy(sortBy || "newest");

    setShowFilters(false);
  };

  /*
   * Completely reset both the draft and applied filters.
   */
  const clearFilters = () => {
    setSelectedTag("");
    setUnansweredOnly(false);
    setMinimumVotes("");
    setSortBy("newest");

    setAppliedTag("");
    setAppliedUnansweredOnly(false);
    setAppliedMinimumVotes("");
    setAppliedSortBy("newest");
  };

  /*
   * Handle the top-level Newest / Active buttons.
   */
  const activateSort = (value: string) => {
    if (!hasAdvancedSearch && value !== "newest") {
      setShowFilters(true);
      return;
    }

    setSortBy(value);
    setAppliedSortBy(value);
  };

  /*
   * Handle the top-level Unanswered button.
   */
  const activateUnanswered = () => {
    if (!hasAdvancedSearch) {
      setShowFilters(true);
      return;
    }

    const nextValue = !appliedUnansweredOnly;

    setUnansweredOnly(nextValue);
    setAppliedUnansweredOnly(nextValue);
  };

  /*
   * Open / close the filter panel.
   *
   * Every time it is opened, draft values are synchronized with the
   * filters that are actually applied. This makes Cancel behave properly.
   */
  const handleFilterClick = () => {
    if (subscriptionLoading) {
      return;
    }

    if (!showFilters) {
      setSelectedTag(appliedTag);
      setUnansweredOnly(appliedUnansweredOnly);
      setMinimumVotes(appliedMinimumVotes);
      setSortBy(appliedSortBy);
    }

    setShowFilters((current) => !current);
  };

  /*
   * These sidebar sections use existing central translation keys only.
   */
  const overflowArticle1 = t.overflowBlog;

  const overflowArticle2 = t.overflowBlog;

  const featuredMeta = t.meta;

  const meta1 = t.meta;

  const meta2 = t.meta;

  const meta3 = t.meta;

  const createFilter = t.createCustomFilter;

  const watchedDescription = t.createCustomFilter;

  /*
   * Do not render the protected Home page until authentication has
   * been checked and a user exists.
   */
  if (!authChecked || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="text-center text-sm text-gray-500">
          {t.loading || "Loading..."}
        </div>
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="grid w-full min-w-0 grid-cols-1 items-start gap-5 lg:gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-8">
        <main className="w-full min-w-0">
          {/* Header */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="break-words text-xl font-bold text-gray-800 sm:text-2xl">
                {searchQuery
                  ? `${t.searchResultsFor} "${searchQuery}"`
                  : t.topQuestions}
              </h1>

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="mt-1 text-sm text-blue-600 hover:text-blue-800"
                >
                  {t.clearSearch}
                </button>
              )}
            </div>

            <Link href="/ask" className="w-full sm:w-auto">
              <button
                type="button"
                className="w-full rounded bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 sm:w-auto"
              >
                {t.askQuestion}
              </button>
            </Link>
          </div>

          {/* Filter Tabs */}
          <div className="mb-4 overflow-x-auto">
            <div className="flex min-w-max items-center gap-1.5 text-sm sm:gap-2 md:gap-3">
              <span className="mr-1 whitespace-nowrap text-gray-600">
                {filteredQuestions.length}{" "}
                {filteredQuestions.length === 1
                  ? t.question
                  : t.questionsPlural}
              </span>
              {/* Newest */}
              <button
                type="button"
                onClick={() => activateSort("newest")}
                className={`whitespace-nowrap rounded px-2.5 py-1.5 sm:px-3 ${
                  appliedSortBy === "newest"
                    ? "bg-gray-200 text-gray-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {t.newest}
              </button>
              {/* Active */}
              <button
                type="button"
                onClick={() => activateSort("active")}
                className={`whitespace-nowrap rounded px-2.5 py-1.5 sm:px-3 ${
                  appliedSortBy === "active"
                    ? "bg-gray-200 text-gray-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {t.active}
              </button>
              {/*
               * Bountied is intentionally not pretending to work yet.
               * The current question model/controller does not contain
               * bounty functionality.
               */}
              <button
                type="button"
                disabled
                title="Bounties are not available yet"
                className="flex cursor-not-allowed items-center whitespace-nowrap rounded px-2.5 py-1.5 text-gray-400 sm:px-3"
              >
                {t.bountied}
              </button>
              {/* Unanswered */}
              <button
                type="button"
                onClick={activateUnanswered}
                className={`whitespace-nowrap rounded px-2.5 py-1.5 sm:px-3 ${
                  appliedUnansweredOnly
                    ? "bg-gray-200 text-gray-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {t.unanswered}
              </button>
              {/* More */}
              <button
                type="button"
                onClick={handleFilterClick}
                className="whitespace-nowrap rounded px-2.5 py-1.5 text-gray-600 hover:bg-gray-100 sm:px-3"
              >
                {t.more} ▼
              </button>
              {/* Filter */}
              <button
                type="button"
                onClick={handleFilterClick}
                className={`whitespace-nowrap rounded border px-2.5 py-1.5 sm:px-3 ${
                  showFilters
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                🔍 {t.filter}
              </button>
            </div>
          </div>

          {/* Subscription Notice */}
          {!subscriptionLoading && hasHighestSearchPriority && (
            <div className="mb-4 rounded-md border border-yellow-300 bg-yellow-50 px-3 py-3 text-sm text-yellow-800 sm:px-4">
              {t.goldSearchPriority}
            </div>
          )}

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mb-5 rounded-lg border border-gray-200 bg-gray-50 p-3 sm:p-4">
              {!hasAdvancedSearch ? (
                <div>
                  <div className="font-semibold text-gray-800">
                    {t.advancedFiltersAvailable}
                  </div>

                  <p className="mt-1 text-sm text-gray-600">
                    {t.upgradeSubscription}
                  </p>

                  <Link href="/subscription">
                    <button
                      type="button"
                      className="mt-3 w-full rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 sm:w-auto"
                    >
                      {t.upgradePlan}
                    </button>
                  </Link>
                </div>
              ) : (
                <div>
                  <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="font-semibold text-gray-800">
                        {t.advancedSearch}
                      </h2>

                      <p className="text-xs text-gray-500">
                        {subscriptionPlan.charAt(0).toUpperCase() +
                          subscriptionPlan.slice(1)}{" "}
                        {t.plan}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={clearFilters}
                      className="self-start text-sm text-blue-600 hover:text-blue-800 sm:self-auto"
                    >
                      {t.clearFilters}
                    </button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    {/* Tag */}
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        {t.tag}
                      </label>

                      <select
                        value={selectedTag}
                        onChange={(event) => setSelectedTag(event.target.value)}
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm"
                      >
                        <option value="">{t.allTags}</option>

                        {availableTags.map((tag) => (
                          <option key={tag} value={tag}>
                            {tag}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Minimum Votes */}
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        {t.minimumVotes}
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={minimumVotes}
                        onChange={(event) =>
                          setMinimumVotes(event.target.value)
                        }
                        placeholder={t.minimumVotes}
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm"
                      />
                    </div>

                    {/* Sort */}
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        {t.sortBy}
                      </label>

                      <select
                        value={sortBy}
                        onChange={(event) => setSortBy(event.target.value)}
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm"
                      >
                        <option value="newest">{t.newest}</option>

                        <option value="active">{t.active}</option>

                        <option value="votes">{t.mostVotes}</option>
                      </select>
                    </div>
                  </div>

                  {/* Unanswered */}
                  <label className="mt-4 flex min-h-10 items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={unansweredOnly}
                      onChange={(event) =>
                        setUnansweredOnly(event.target.checked)
                      }
                      className="h-4 w-4"
                    />

                    {t.showOnlyUnanswered}
                  </label>

                  {/* Filter Actions */}
                  <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => setShowFilters(false)}
                      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      {t.cancel}
                    </button>

                    <button
                      type="button"
                      onClick={applyFilters}
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      {t.filter}
                    </button>
                  </div>

                  {/* Gold Message */}
                  {subscriptionPlan === "gold" && (
                    <div className="mt-4 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
                      {t.goldMembersPriority}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Active Filter Summary */}
          {(appliedTag ||
            appliedUnansweredOnly ||
            appliedMinimumVotes ||
            appliedSortBy !== "newest") && (
            <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-gray-600">
              {appliedTag && (
                <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700">
                  {t.tag}: {appliedTag}
                </span>
              )}

              {appliedUnansweredOnly && (
                <span className="rounded-full bg-green-100 px-3 py-1 text-green-700">
                  {t.unanswered}
                </span>
              )}

              {appliedMinimumVotes && (
                <span className="rounded-full bg-gray-100 px-3 py-1">
                  {t.minimumVotes}: {appliedMinimumVotes}
                </span>
              )}

              {appliedSortBy !== "newest" && (
                <span className="rounded-full bg-gray-100 px-3 py-1">
                  {t.sortBy}:{" "}
                  {appliedSortBy === "active" ? t.active : t.mostVotes}
                </span>
              )}

              <button
                type="button"
                onClick={clearFilters}
                className="px-1 py-1 font-medium text-blue-600 hover:text-blue-800"
              >
                {t.clearFilters}
              </button>
            </div>
          )}

          {/* Questions */}
          <div className="border-t border-gray-200">
            {loading ? (
              <div className="py-8 text-center text-gray-600">
                {t.loadingQuestions}
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="px-2 py-8 text-center text-gray-600">
                {searchQuery ? (
                  <>
                    {t.noQuestionsFoundFor}{" "}
                    <span className="font-medium">"{searchQuery}"</span>.
                  </>
                ) : (
                  t.noQuestionsFound
                )}
              </div>
            ) : (
              filteredQuestions.map((question) => (
                <div
                  key={question._id}
                  className="flex gap-2.5 border-b border-gray-200 py-4 sm:gap-4"
                >
                  {/* Stats */}
                  <div className="w-12 shrink-0 text-right text-xs text-gray-600 sm:w-20 sm:text-sm">
                    <div>
                      <div>{question.votes}</div>

                      <div>{t.votes}</div>
                    </div>

                    <div
                      className={`mt-2 rounded px-1 py-0.5 ${
                        question.answers?.length > 0
                          ? "border border-green-500 text-green-600"
                          : ""
                      }`}
                    >
                      <div>{question.answers?.length || 0}</div>

                      <div className="break-words">
                        {question.answers?.length === 1 ? t.answer : t.answers}
                      </div>
                    </div>
                  </div>

                  {/* Question Content */}
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/questions/${question._id}`}
                      className="block break-words text-base text-blue-600 hover:text-blue-800 sm:text-lg"
                    >
                      {question.title}
                    </Link>

                    <p className="mt-1 break-words text-sm leading-6 text-gray-700">
                      {question.body}
                    </p>

                    {/* Tags + Author */}
                    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                      <div className="flex flex-wrap gap-1">
                        {question.tags?.map((tag) => (
                          <span
                            key={tag}
                            className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="break-words text-xs text-gray-500 sm:text-right">
                        <span className="font-medium text-blue-600">
                          {t.user}
                        </span>{" "}
                        {t.askedRecently}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="hidden w-full min-w-0 space-y-5 xl:block">
          {/* Overflow Blog */}
          <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-800">
                {t.overflowBlog}
              </h2>
            </div>

            <div className="space-y-4 p-4 text-sm">
              <Link
                href="/"
                className="block break-words text-blue-600 hover:text-blue-800"
              >
                {overflowArticle1}
              </Link>

              <Link
                href="/"
                className="block break-words text-blue-600 hover:text-blue-800"
              >
                {overflowArticle2}
              </Link>
            </div>
          </section>

          {/* Featured on Meta */}
          <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-800">
                {featuredMeta}
              </h2>
            </div>

            <div className="space-y-4 p-4 text-sm">
              <Link
                href="/"
                className="block break-words text-blue-600 hover:text-blue-800"
              >
                {meta1}
              </Link>

              <Link
                href="/"
                className="block break-words text-blue-600 hover:text-blue-800"
              >
                {meta2}
              </Link>

              <Link
                href="/"
                className="block break-words text-blue-600 hover:text-blue-800"
              >
                {meta3}
              </Link>
            </div>
          </section>

          {/* Custom Filters */}
          <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-800">
              {t.customFilters}
            </h2>

            <p className="mt-2 break-words text-sm leading-6 text-gray-600">
              {watchedDescription}
            </p>

            <button
              type="button"
              onClick={handleFilterClick}
              className="mt-4 rounded-md border border-blue-600 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
            >
              {createFilter}
            </button>
          </section>

          {/* Watched Tags */}
          <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-800">
              {t.watchedTags}
            </h2>

            <p className="mt-2 break-words text-sm leading-6 text-gray-600">
              {watchedDescription}
            </p>

            <button
              type="button"
              onClick={handleFilterClick}
              className="mt-4 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {t.watchTag}
            </button>
          </section>
        </aside>
      </div>
    </MainLayout>
  );
};

export default Home;
