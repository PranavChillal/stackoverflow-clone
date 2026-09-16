import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  ArrowDown,
  ArrowUp,
  Bookmark,
  Clock3,
  Flag,
  History,
  Share2,
  Trash2,
  X,
} from "lucide-react";

import axiosInstance from "@/lib/axiosinstance";
import { useAuth } from "@/lib/AuthContext";
import translations from "@/lib/translations";

interface QuestionDetailProps {
  questionId: string | string[] | undefined;
}

interface Answer {
  _id?: string;
  answerBody?: string;
  userId?: string;
  answeredOn?: string;
  votes?: number;
}

interface Question {
  _id: string;
  title: string;
  body: string;
  tags: string[];
  userId: string;
  askedOn: string;
  votes: number;
  answers: Answer[];
}

interface User {
  _id: string;
  name: string;
}

interface HistoryItem {
  questionId: string;
  title: string;
  viewedAt: string;
}

const HISTORY_STORAGE_KEY = "codequest_question_history";
const MAX_HISTORY_ITEMS = 20;

const QuestionDetail = ({ questionId }: QuestionDetailProps) => {
  const router = useRouter();

  const auth = useAuth() as any;

  const language = auth?.language || "english";
  const languageKey = language as keyof typeof translations;

  const t = (translations[languageKey] || translations.english) as any;

  const qd = t.questionDetail || translations.english.questionDetail;

  const localeMap: Record<string, string> = {
    english: "en-IN",
    spanish: "es-ES",
    hindi: "hi-IN",
    portuguese: "pt-PT",
    chinese: "zh-CN",
    french: "fr-FR",
  };

  const locale = localeMap[language] || "en-IN";

  const formatDate = (date: string) => {
    if (!date) {
      return qd.unknownDate;
    }

    const questionDate = new Date(date);
    const now = new Date();

    const difference = now.getTime() - questionDate.getTime();

    const minutes = Math.floor(difference / (1000 * 60));

    const hours = Math.floor(difference / (1000 * 60 * 60));

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));

    if (minutes < 1) {
      return qd.justNow;
    }

    if (minutes < 60) {
      return `${minutes} ${minutes === 1 ? qd.minute : qd.minutes} ${qd.ago}`;
    }

    if (hours < 24) {
      return `${hours} ${hours === 1 ? qd.hour : qd.hours} ${qd.ago}`;
    }

    if (days < 30) {
      return `${days} ${days === 1 ? qd.day : qd.days} ${qd.ago}`;
    }

    return questionDate.toLocaleDateString(locale);
  };

  const [question, setQuestion] = useState<Question | null>(null);

  const [author, setAuthor] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [newanswer, setnewAnswer] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [toast, setToast] = useState("");

  const [isBookmarked, setIsBookmarked] = useState(false);

  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  const [reportLoading, setReportLoading] = useState(false);

  const [answerReportLoading, setAnswerReportLoading] = useState<string | null>(
    null,
  );

  const [historyOpen, setHistoryOpen] = useState(false);

  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);

  const currentQuestionId = Array.isArray(questionId)
    ? questionId[0]
    : questionId;

  /*
   * Load local question history.
   *
   * History is intentionally stored in the
   * browser because the current backend does
   * not provide a question-history endpoint.
   */
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);

      if (!storedHistory) {
        setHistoryItems([]);
        return;
      }

      const parsedHistory = JSON.parse(storedHistory);

      if (Array.isArray(parsedHistory)) {
        setHistoryItems(parsedHistory);
      }
    } catch (historyError) {
      console.log("Unable to load question history", historyError);

      setHistoryItems([]);
    }
  }, []);

  /*
   * Save the currently viewed question
   * into local browser history.
   */
  const recordQuestionHistory = (viewedQuestion: Question) => {
    if (typeof window === "undefined" || !viewedQuestion?._id) {
      return;
    }

    try {
      const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);

      let existingHistory: HistoryItem[] = [];

      if (storedHistory) {
        const parsedHistory = JSON.parse(storedHistory);

        if (Array.isArray(parsedHistory)) {
          existingHistory = parsedHistory;
        }
      }

      const newHistoryItem: HistoryItem = {
        questionId: viewedQuestion._id,
        title: viewedQuestion.title,
        viewedAt: new Date().toISOString(),
      };

      const filteredHistory = existingHistory.filter(
        (item) => String(item.questionId) !== String(viewedQuestion._id),
      );

      const updatedHistory = [newHistoryItem, ...filteredHistory].slice(
        0,
        MAX_HISTORY_ITEMS,
      );

      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));

      setHistoryItems(updatedHistory);
    } catch (historyError) {
      console.log("Unable to save question history", historyError);
    }
  };

  /*
   * Load question and author.
   */
  useEffect(() => {
    const id = Array.isArray(questionId) ? questionId[0] : questionId;

    if (!id) {
      return;
    }

    const loadQuestion = async () => {
      try {
        setLoading(true);
        setError("");

        const questionResponse = await axiosInstance.get(
          `/question/getquestion/${id}`,
        );

        const foundQuestion = questionResponse.data.data;

        setQuestion(foundQuestion);

        /*
         * Record every question that the
         * user opens in local history.
         */
        recordQuestionHistory(foundQuestion);

        try {
          const usersResponse = await axiosInstance.get("/user/getalluser");

          const users = usersResponse.data.data;

          const foundAuthor = users.find(
            (user: User) => user._id === foundQuestion.userId,
          );

          if (foundAuthor) {
            setAuthor(foundAuthor);
          }
        } catch (userError) {
          console.log("Unable to load question author", userError);
        }
      } catch (error: any) {
        console.log(error);

        setError(error.response?.data?.message || qd.unableLoadQuestion);
      } finally {
        setLoading(false);
      }
    };

    loadQuestion();
  }, [questionId, qd.unableLoadQuestion]);

  /*
   * Load bookmark status for the current
   * question.
   */
  useEffect(() => {
    const id = Array.isArray(questionId) ? questionId[0] : questionId;

    if (!id) {
      return;
    }

    const loadBookmarkStatus = async () => {
      try {
        const response = await axiosInstance.get(`/bookmark/status/${id}`);

        const bookmarked = Boolean(response.data?.data?.isBookmarked);

        setIsBookmarked(bookmarked);
      } catch (bookmarkError: any) {
        /*
         * A bookmark-status failure should
         * not prevent the question itself
         * from loading.
         */
        console.log("Unable to load bookmark status", bookmarkError);
      }
    };

    loadBookmarkStatus();
  }, [questionId]);

  const showToast = (message: string) => {
    setToast(message);

    setTimeout(() => {
      setToast("");
    }, 3000);
  };

  /*
   * Bookmark / Unbookmark
   */
  const handleBookmark = async () => {
    if (!question?._id || bookmarkLoading) {
      return;
    }

    try {
      setBookmarkLoading(true);

      if (isBookmarked) {
        await axiosInstance.delete(`/bookmark/remove/${question._id}`);

        setIsBookmarked(false);

        showToast("Bookmark removed successfully.");
      } else {
        await axiosInstance.post("/bookmark/add", {
          questionId: question._id,
        });

        setIsBookmarked(true);

        showToast("Question bookmarked successfully.");
      }
    } catch (error: any) {
      console.log("Bookmark error:", error);

      alert(error.response?.data?.message || "Unable to update bookmark.");
    } finally {
      setBookmarkLoading(false);
    }
  };

  /*
   * History panel
   */
  const handleHistory = () => {
    try {
      const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);

      if (storedHistory) {
        const parsedHistory = JSON.parse(storedHistory);

        if (Array.isArray(parsedHistory)) {
          setHistoryItems(parsedHistory);
        }
      }
    } catch (historyError) {
      console.log("Unable to refresh question history", historyError);
    }

    setHistoryOpen((current) => !current);
  };

  const clearHistory = () => {
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);

      setHistoryItems([]);
    } catch (historyError) {
      console.log("Unable to clear question history", historyError);
    }
  };

  const openHistoryQuestion = (id: string) => {
    setHistoryOpen(false);

    router.push(`/questions/${id}`);
  };

  /*
   * Share question
   */
  const handleShare = async () => {
    if (!question?._id) {
      return;
    }

    const shareUrl = `${window.location.origin}/questions/${question._id}`;

    try {
      /*
       * Use the native device share sheet
       * when the browser supports it.
       */
      if (navigator.share) {
        await navigator.share({
          title: question.title,
          text: question.title,
          url: shareUrl,
        });

        return;
      }

      /*
       * Desktop fallback.
       */
      await navigator.clipboard.writeText(shareUrl);

      showToast(qd.shareCopied || "Question link copied to clipboard.");
    } catch (shareError: any) {
      /*
       * Closing the native share dialog is
       * not an error.
       */
      if (shareError?.name === "AbortError") {
        return;
      }

      /*
       * Try clipboard one more time in case
       * the native share API failed.
       */
      try {
        await navigator.clipboard.writeText(shareUrl);

        showToast(qd.shareCopied || "Question link copied to clipboard.");
      } catch (clipboardError) {
        console.log("Unable to share question", clipboardError);

        /*
         * Final fallback. The URL is shown
         * so the user can still copy it.
         */
        alert(shareUrl);
      }
    }
  };

  /*
   * Report question
   */
  const handleReportQuestion = async () => {
    if (!question?._id || reportLoading) {
      return;
    }

    const reason = window.prompt(
      qd.reportReasonPrompt || "Why are you reporting this question?",
    );

    /*
     * User cancelled the prompt.
     */
    if (reason === null) {
      return;
    }

    const trimmedReason = reason.trim();

    if (!trimmedReason) {
      alert(qd.reportReasonRequired || "Please enter a reason for reporting.");

      return;
    }

    if (trimmedReason.length > 500) {
      alert(
        qd.reportReasonTooLong ||
          "Report reason must be 500 characters or less.",
      );

      return;
    }

    try {
      setReportLoading(true);

      await axiosInstance.post(`/question/report/${question._id}`, {
        reason: trimmedReason,
      });

      showToast(
        qd.reportSubmitted || "Thank you. Your report has been submitted.",
      );
    } catch (error: any) {
      console.log("Report error:", error);

      alert(
        error.response?.data?.message ||
          qd.unableToReport ||
          "Unable to submit report.",
      );
    } finally {
      setReportLoading(false);
    }
  };

  /*
   * Share answer
   */
  const handleShareAnswer = async (answer: Answer) => {
    if (!question?._id || !answer?._id) {
      return;
    }

    const shareUrl = `${window.location.origin}/questions/${question._id}#answer-${answer._id}`;

    try {
      /*
       * Use the native device share sheet
       * when the browser supports it.
       */
      if (navigator.share) {
        await navigator.share({
          title: question.title,
          text: answer.answerBody || question.title,
          url: shareUrl,
        });

        return;
      }

      /*
       * Desktop fallback.
       */
      await navigator.clipboard.writeText(shareUrl);

      showToast(qd.shareCopied || "Answer link copied to clipboard.");
    } catch (shareError: any) {
      /*
       * Closing the native share dialog is
       * not an error.
       */
      if (shareError?.name === "AbortError") {
        return;
      }

      /*
       * Try clipboard one more time in case
       * the native share API failed.
       */
      try {
        await navigator.clipboard.writeText(shareUrl);

        showToast(qd.shareCopied || "Answer link copied to clipboard.");
      } catch (clipboardError) {
        console.log("Unable to share answer", clipboardError);

        /*
         * Final fallback. The URL is shown
         * so the user can still copy it.
         */
        alert(shareUrl);
      }
    }
  };

  /*
   * Report answer
   */
  const handleReportAnswer = async (answerId: string) => {
    if (!question?._id || !answerId || answerReportLoading) {
      return;
    }

    const reason = window.prompt(
      qd.reportReasonPrompt || "Why are you reporting this answer?",
    );

    if (reason === null) {
      return;
    }

    const trimmedReason = reason.trim();

    if (!trimmedReason) {
      alert(qd.reportReasonRequired || "Please enter a reason for reporting.");

      return;
    }

    if (trimmedReason.length > 500) {
      alert(
        qd.reportReasonTooLong ||
          "Report reason must be 500 characters or less.",
      );

      return;
    }

    try {
      setAnswerReportLoading(answerId);

      await axiosInstance.post(
        `/question/answer/report/${question._id}/${answerId}`,
        {
          reason: trimmedReason,
        },
      );

      showToast(
        qd.reportSubmitted || "Thank you. Your report has been submitted.",
      );
    } catch (error: any) {
      console.log("Report answer error:", error);

      alert(
        error.response?.data?.message ||
          qd.unableToReport ||
          "Unable to submit report.",
      );
    } finally {
      setAnswerReportLoading(null);
    }
  };

  /*
   * Voting
   */
  const handleVote = async (value: 1 | -1) => {
    if (!question?._id) {
      return;
    }

    try {
      const response = await axiosInstance.patch(
        `/question/vote/${question._id}`,
        {
          value,
        },
      );

      setQuestion(response.data.data);

      showToast(qd.voteUpdated);
    } catch (error: any) {
      console.log(error);

      alert(error.response?.data?.message || qd.unableUpdateVote);
    }
  };

  /*
   * Submit Answer
   */
  const handleSubmitanswer = async () => {
    if (!newanswer.trim()) {
      return;
    }

    const id = Array.isArray(questionId) ? questionId[0] : questionId;

    if (!id) {
      return;
    }

    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      alert(qd.loginToAnswer);
      return;
    }

    try {
      setIsSubmitting(true);

      const currentUser = JSON.parse(storedUser);

      const response = await axiosInstance.post("/question/answer", {
        questionId: id,
        answerBody: newanswer,
        userId: currentUser._id || currentUser.id,
      });

      setQuestion(response.data.data);

      setnewAnswer("");

      showToast(qd.answerUploaded);
    } catch (error: any) {
      console.log(error);

      alert(error.response?.data?.message || qd.unableUploadAnswer);
    } finally {
      setIsSubmitting(false);
    }
  };

  /*
   * Delete Question
   */
  const handleDeleteQuestion = async () => {
    if (!question?._id) {
      return;
    }

    const confirmed = window.confirm(qd.confirmDeleteQuestion);

    if (!confirmed) {
      return;
    }

    try {
      await axiosInstance.delete(`/question/deletequestion/${question._id}`);

      showToast(qd.deletedSuccessfully);

      setTimeout(() => {
        router.push("/");
      }, 1000);
    } catch (error: any) {
      console.log(error);

      alert(error.response?.data?.message || qd.unableDeleteQuestion);
    }
  };

  /*
   * Delete Answer
   */
  const handleDeleteAnswer = async (answerId: string) => {
    if (!question?._id) {
      return;
    }

    const confirmed = window.confirm(qd.confirmDeleteAnswer);

    if (!confirmed) {
      return;
    }

    try {
      const response = await axiosInstance.delete(
        `/question/answer/${question._id}/${answerId}`,
      );

      setQuestion(response.data.data);

      showToast(qd.deletedSuccessfully);
    } catch (error: any) {
      console.log(error);

      alert(error.response?.data?.message || qd.unableDeleteAnswer);
    }
  };

  if (loading) {
    return (
      <div className="w-full px-2 py-8 sm:px-0 sm:py-10">
        <p className="break-words text-gray-600">{qd.loadingQuestion}</p>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="w-full px-2 py-8 sm:px-0 sm:py-10">
        <p className="break-words text-red-600">
          {error || qd.questionNotFound}
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full min-w-0 overflow-hidden">
      {/* Toast */}
      {toast && (
        <div className="fixed left-2 right-2 top-3 z-50 flex items-center gap-3 rounded-md border border-green-300 bg-white px-3 py-3 shadow-lg sm:left-auto sm:right-5 sm:top-5 sm:min-w-[300px] sm:px-4 sm:py-4">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
            ✓
          </div>

          <span className="min-w-0 break-words text-sm font-medium text-gray-700">
            {toast}
          </span>

          <button
            type="button"
            onClick={() => setToast("")}
            className="ml-auto shrink-0 px-1 text-xl leading-none text-gray-400 hover:text-gray-700"
            aria-label="Close"
          >
            ×
          </button>
        </div>
      )}

      {/* History Panel */}
      {historyOpen && (
        <div className="fixed inset-0 z-40 bg-black/20">
          <div className="absolute right-2 top-2 max-h-[80vh] w-[calc(100vw-1rem)] max-w-md overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl sm:right-5 sm:top-5">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 sm:px-5">
              <div>
                <h3 className="text-base font-semibold text-gray-900 sm:text-lg">
                  {qd.history}
                </h3>

                <p className="mt-1 text-xs text-gray-500">
                  Recently viewed questions
                </p>
              </div>

              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                aria-label="Close history"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {historyItems.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-gray-500">
                  No question history yet.
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {historyItems.map((item) => (
                    <button
                      key={`${item.questionId}-${item.viewedAt}`}
                      type="button"
                      onClick={() => openHistoryQuestion(item.questionId)}
                      className="block w-full px-4 py-4 text-left hover:bg-gray-50 sm:px-5"
                    >
                      <p className="break-words text-sm font-medium text-blue-600">
                        {item.title}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {formatDate(item.viewedAt)}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {historyItems.length > 0 && (
              <div className="border-t border-gray-200 px-4 py-3 sm:px-5">
                <button
                  type="button"
                  onClick={clearHistory}
                  className="min-h-10 w-full rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Clear History
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Question Header */}
      <div className="border-b border-gray-200 pb-4 sm:pb-5">
        <h1 className="break-words text-2xl font-bold leading-tight text-gray-900 sm:text-3xl">
          {question.title}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-600 sm:mt-4">
          <Clock3 size={17} className="shrink-0" />

          <span className="break-words">
            {qd.asked} {formatDate(question.askedOn)}
          </span>
        </div>
      </div>

      {/* Question Card */}
      <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm sm:mt-6">
        <div className="flex min-w-0 flex-col sm:flex-row">
          {/* Voting */}
          <div className="flex shrink-0 flex-row items-center justify-start gap-1 border-b border-gray-100 px-3 py-2 sm:w-20 sm:flex-col sm:justify-start sm:border-b-0 sm:px-0 sm:pt-7">
            <button
              type="button"
              onClick={() => handleVote(1)}
              className="flex min-h-10 min-w-10 items-center justify-center rounded-full p-2 text-gray-600 hover:bg-gray-100"
              aria-label="Upvote"
            >
              <ArrowUp size={25} />
            </button>

            <span className="mx-1 min-w-8 text-center text-lg font-medium text-gray-900 sm:my-2">
              {question.votes}
            </span>

            <button
              type="button"
              onClick={() => handleVote(-1)}
              className="flex min-h-10 min-w-10 items-center justify-center rounded-full p-2 text-gray-600 hover:bg-gray-100"
              aria-label="Downvote"
            >
              <ArrowDown size={25} />
            </button>

            <div className="ml-2 flex flex-row gap-2 sm:ml-0 sm:mt-4 sm:flex-col">
              {/* Bookmark */}
              <button
                type="button"
                onClick={handleBookmark}
                disabled={bookmarkLoading}
                className={`flex min-h-10 min-w-10 items-center justify-center rounded-lg p-2 transition-colors ${
                  isBookmarked
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-900 text-white hover:bg-gray-700"
                } ${bookmarkLoading ? "cursor-wait opacity-60" : ""}`}
                title={isBookmarked ? "Remove bookmark" : qd.bookmark}
                aria-label={isBookmarked ? "Remove bookmark" : qd.bookmark}
              >
                <Bookmark
                  size={18}
                  fill={isBookmarked ? "currentColor" : "none"}
                />
              </button>

              {/* History */}
              <button
                type="button"
                onClick={handleHistory}
                className="flex min-h-10 min-w-10 items-center justify-center rounded-lg bg-gray-900 p-2 text-white hover:bg-gray-700"
                title={qd.history}
                aria-label={qd.history}
              >
                <History size={18} />
              </button>
            </div>
          </div>

          {/* Question Content */}
          <div className="min-w-0 flex-1 p-4 text-base leading-7 text-gray-800 sm:p-6">
            <p className="mb-4 break-words whitespace-pre-wrap">
              {question.body}
            </p>

            {/* Tags */}
            <div className="mt-5 flex flex-wrap gap-2 sm:mt-6">
              {question.tags.map((tag) => (
                <span
                  key={tag}
                  className="max-w-full break-all rounded bg-blue-100 px-2 py-1 text-sm text-blue-700"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Question Footer */}
            <div className="mt-6 flex flex-col gap-5 sm:mt-8">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-3 text-sm text-gray-600 sm:gap-x-5">
                {/* Share */}
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex min-h-10 items-center gap-1 hover:text-gray-900"
                >
                  <Share2 size={16} />
                  {qd.share}
                </button>

                {/* Flag */}
                <button
                  type="button"
                  onClick={handleReportQuestion}
                  disabled={reportLoading}
                  className={`flex min-h-10 items-center gap-1 hover:text-gray-900 ${
                    reportLoading ? "cursor-wait opacity-60" : ""
                  }`}
                >
                  <Flag size={16} />
                  {qd.flag}
                </button>

                {/* Delete Question */}
                <button
                  type="button"
                  onClick={handleDeleteQuestion}
                  className="flex min-h-10 items-center gap-1 text-red-600 hover:text-red-700"
                >
                  <Trash2 size={16} />
                  {qd.delete}
                </button>
              </div>

              <div className="flex min-w-0 flex-col items-start gap-3 text-sm text-gray-600 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                <span className="break-words">
                  {qd.asked} {formatDate(question.askedOn)}
                </span>

                <div className="flex min-w-0 max-w-full items-center gap-2 rounded bg-blue-50 px-3 py-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 font-medium text-gray-700">
                    {author?.name?.charAt(0).toUpperCase() || "U"}
                  </div>

                  <span className="min-w-0 break-words font-medium text-blue-600">
                    {author?.name || qd.user}
                  </span>
                </div>
              </div>
            </div>

            {/* Question ID */}
            <div className="mt-4 break-all text-xs text-gray-400">
              {qd.questionId}:{" "}
              {Array.isArray(questionId) ? questionId[0] : questionId}
            </div>
          </div>
        </div>
      </div>

      {/* Answers */}
      <div className="mt-6 sm:mt-8">
        <h2 className="mb-4 break-words text-xl font-semibold text-gray-900 sm:mb-6">
          {question.answers.length}{" "}
          {question.answers.length === 1 ? qd.answer : qd.answers}
        </h2>

        <div className="space-y-4 sm:space-y-6">
          {question.answers.map((answer, index) => (
            <div
              key={answer._id || index}
              className="min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
            >
              <div className="p-4 sm:p-6">
                <p className="break-words whitespace-pre-wrap leading-relaxed text-gray-800">
                  {answer.answerBody}
                </p>

                <div className="mt-5 flex flex-col gap-4 sm:mt-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {/* Answer Share */}
                    <button
                      type="button"
                      onClick={() => handleShareAnswer(answer)}
                      className="flex min-h-10 items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                    >
                      <Share2 size={15} />
                      {qd.share}
                    </button>

                    {/* Answer Flag */}
                    {answer._id && (
                      <button
                        type="button"
                        onClick={() => handleReportAnswer(answer._id!)}
                        disabled={answerReportLoading === answer._id}
                        className={`flex min-h-10 items-center gap-1 text-sm text-gray-600 hover:text-gray-900 ${
                          answerReportLoading === answer._id
                            ? "cursor-wait opacity-60"
                            : ""
                        }`}
                      >
                        <Flag size={15} />
                        {qd.flag}
                      </button>
                    )}

                    {/* Delete Answer */}
                    {answer._id && (
                      <button
                        type="button"
                        onClick={() => handleDeleteAnswer(answer._id!)}
                        className="flex min-h-10 items-center gap-1 text-sm text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={15} />
                        {qd.delete}
                      </button>
                    )}
                  </div>

                  <div className="break-words text-sm text-gray-600">
                    {qd.answered} {formatDate(answer.answeredOn || "")}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Your Answer */}
      <div className="mt-6 min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm sm:mt-8">
        <div className="p-4 sm:p-6">
          <h3 className="mb-4 break-words text-lg font-semibold text-gray-900">
            {qd.yourAnswer}
          </h3>

          <textarea
            value={newanswer}
            onChange={(e) => setnewAnswer(e.target.value)}
            placeholder={qd.answerPlaceholder}
            className="min-h-[130px] w-full resize-y rounded-lg border border-gray-300 p-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />

          <div className="mt-4 flex flex-col items-stretch gap-4 sm:flex-row sm:flex-wrap sm:items-center">
            <button
              type="button"
              onClick={handleSubmitanswer}
              disabled={!newanswer.trim() || isSubmitting}
              className="min-h-10 rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? qd.posting : qd.postYourAnswer}
            </button>

            <p className="min-w-0 break-words text-sm leading-6 text-gray-600">
              {qd.byPosting}{" "}
              <a href="/privacy" className="text-blue-600 hover:underline">
                {qd.privacyPolicy}
              </a>{" "}
              {qd.and}{" "}
              <a href="/terms" className="text-blue-600 hover:underline">
                {qd.termsOfService}
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionDetail;
