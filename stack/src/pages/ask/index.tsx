import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import MainLayout from "@/layout/MainLayout";
import axiosInstance from "@/lib/axiosinstance";
import { useAuth } from "@/lib/AuthContext";
import translations from "@/lib/translations";

const AskQuestion = () => {
  const router = useRouter();
  const auth = useAuth() as any;

  const language = auth?.language || "english";
  const languageKey = language as keyof typeof translations;

  const t = (translations[languageKey] || translations.english) as any;

  const q = t.askQuestionPage || translations.english.askQuestionPage;

  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [tags, setTags] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (error) {
        console.log("Unable to read stored user");
      }
    }
  }, []);

  const handleReview = async () => {
    if (!currentUser?._id) {
      alert(q.loginRequired);
      return;
    }

    if (!title.trim()) {
      alert(q.titleRequired);
      return;
    }

    if (!details.trim() || details.trim().length < 20) {
      alert(q.detailsRequired);
      return;
    }

    if (!tags.trim()) {
      alert(q.tagsRequired);
      return;
    }

    const tagList = tags
      .split(" ")
      .map((tag) => tag.trim())
      .filter((tag) => tag !== "")
      .slice(0, 5);

    try {
      setLoading(true);

      const res = await axiosInstance.post("/question/ask", {
        title: title.trim(),
        body: details.trim(),
        tags: tagList,
        userId: currentUser._id,
      });

      alert(q.questionPosted);

      const questionId = res.data.data._id;

      router.push(`/questions/${questionId}`);
    } catch (error: any) {
      console.log(error);

      alert(error.response?.data?.message || q.unableToPost);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <main className="w-full min-w-0 max-w-6xl">
        {/* Page Heading */}
        <h1 className="mb-5 break-words text-xl font-bold leading-tight text-gray-800 sm:mb-7 sm:text-2xl">
          {q.heading}
        </h1>

        {/* Question Form */}
        <div className="w-full min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6 md:p-7">
          {/* Writing a good question */}
          <h2 className="mb-6 break-words text-lg font-bold leading-tight text-gray-900 sm:mb-8 sm:text-xl">
            {q.writingGoodQuestion}
          </h2>

          {/* Title */}
          <div className="mb-6 sm:mb-7">
            <label
              htmlFor="title"
              className="block break-words text-base font-semibold text-gray-900"
            >
              {q.title}
            </label>

            <p className="mt-1 break-words text-sm leading-6 text-gray-600">
              {q.titleDescription}
            </p>

            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={q.titlePlaceholder}
              className="mt-2 h-11 w-full min-w-0 rounded-md border border-gray-300 px-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Details */}
          <div className="mb-6 sm:mb-7">
            <label
              htmlFor="details"
              className="block break-words text-base font-semibold text-gray-900"
            >
              {q.detailsTitle}
            </label>

            <p className="mt-1 break-words text-sm leading-6 text-gray-600">
              {q.detailsDescription}
            </p>

            <textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={q.detailsPlaceholder}
              className="mt-2 min-h-52 w-full min-w-0 resize-y rounded-md border border-gray-300 p-3 text-sm leading-6 text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:min-h-48"
            />
          </div>

          {/* Tags */}
          <div className="mb-6 sm:mb-7">
            <label
              htmlFor="tags"
              className="block break-words text-base font-semibold text-gray-900"
            >
              {q.tags}
            </label>

            <p className="mt-1 break-words text-sm leading-6 text-gray-600">
              {q.tagsDescription}
            </p>

            <input
              id="tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder={q.tagsPlaceholder}
              className="mt-2 h-11 w-full min-w-0 rounded-md border border-gray-300 px-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Review Button */}
          <button
            type="button"
            onClick={handleReview}
            disabled={loading}
            className="min-h-10 w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {loading ? q.postingQuestion : q.reviewQuestion}
          </button>
        </div>
      </main>
    </MainLayout>
  );
};

export default AskQuestion;
