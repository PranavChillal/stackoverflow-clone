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
} from "lucide-react";

import axiosInstance from "@/lib/axiosinstance";

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

const formatDate = (date: string) => {
    if (!date) {
        return "Unknown date";
    }

    const questionDate = new Date(date);
    const now = new Date();

    const difference = now.getTime() - questionDate.getTime();

    const minutes = Math.floor(difference / (1000 * 60));
    const hours = Math.floor(difference / (1000 * 60 * 60));
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));

    if (minutes < 1) {
        return "just now";
    }

    if (minutes < 60) {
        return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    }

    if (hours < 24) {
        return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    }

    if (days < 30) {
        return `${days} day${days === 1 ? "" : "s"} ago`;
    }

    return questionDate.toLocaleDateString();
};

const QuestionDetail = ({ questionId }: QuestionDetailProps) => {
    const router = useRouter();

    const [question, setQuestion] = useState<Question | null>(null);
    const [author, setAuthor] = useState<User | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [newanswer, setnewAnswer] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [toast, setToast] = useState("");

    useEffect(() => {
        const id = Array.isArray(questionId)
            ? questionId[0]
            : questionId;

        if (!id) {
            return;
        }

        const loadQuestion = async () => {
            try {
                setLoading(true);
                setError("");

                const questionResponse = await axiosInstance.get(
                    `/question/getquestion/${id}`
                );

                const foundQuestion = questionResponse.data.data;

                setQuestion(foundQuestion);

                try {
                    const usersResponse = await axiosInstance.get(
                        "/user/getalluser"
                    );

                    const users = usersResponse.data.data;

                    const foundAuthor = users.find(
                        (user: User) =>
                            user._id === foundQuestion.userId
                    );

                    if (foundAuthor) {
                        setAuthor(foundAuthor);
                    }
                } catch (userError) {
                    console.log(
                        "Unable to load question author",
                        userError
                    );
                }
            } catch (error: any) {
                console.log(error);

                setError(
                    error.response?.data?.message ||
                    "Unable to load question"
                );
            } finally {
                setLoading(false);
            }
        };

        loadQuestion();
    }, [questionId]);

    const showToast = (message: string) => {
        setToast(message);

        setTimeout(() => {
            setToast("");
        }, 3000);
    };

    const handleVote = async (value: 1 | -1) => {
        if (!question?._id) {
            return;
        }

        try {
            const response = await axiosInstance.patch(
                `/question/vote/${question._id}`,
                {
                    value,
                }
            );

            setQuestion(response.data.data);

            showToast("Vote Updated");
        } catch (error: any) {
            console.log(error);

            alert(
                error.response?.data?.message ||
                "Unable to update vote"
            );
        }
    };

    const handleSubmitanswer = async () => {
        if (!newanswer.trim()) {
            return;
        }

        const id = Array.isArray(questionId)
            ? questionId[0]
            : questionId;

        if (!id) {
            return;
        }

        const storedUser = localStorage.getItem("user");

        if (!storedUser) {
            alert("Please log in to answer");
            return;
        }

        try {
            setIsSubmitting(true);

            const currentUser = JSON.parse(storedUser);

            const response = await axiosInstance.post(
                "/question/answer",
                {
                    questionId: id,
                    answerBody: newanswer,
                    userId: currentUser._id || currentUser.id,
                }
            );

            setQuestion(response.data.data);

            setnewAnswer("");

            showToast("Answer Uploaded");
        } catch (error: any) {
            console.log(error);

            alert(
                error.response?.data?.message ||
                "Unable to upload answer"
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteQuestion = async () => {
        if (!question?._id) {
            return;
        }

        const confirmed = window.confirm(
            "Are you sure you want to delete this question?"
        );

        if (!confirmed) {
            return;
        }

        try {
            await axiosInstance.delete(
                `/question/deletequestion/${question._id}`
            );

            showToast("deleted successfully");

            setTimeout(() => {
                router.push("/");
            }, 1000);
        } catch (error: any) {
            console.log(error);

            alert(
                error.response?.data?.message ||
                "Unable to delete question"
            );
        }
    };

    const handleDeleteAnswer = async (answerId: string) => {
        if (!question?._id) {
            return;
        }

        const confirmed = window.confirm(
            "Are you sure you want to delete this answer?"
        );

        if (!confirmed) {
            return;
        }

        try {
            const response = await axiosInstance.delete(
                `/question/answer/${question._id}/${answerId}`
            );

            setQuestion(response.data.data);

            showToast("deleted successfully");
        } catch (error: any) {
            console.log(error);

            alert(
                error.response?.data?.message ||
                "Unable to delete answer"
            );
        }
    };

    if (loading) {
        return (
            <div className="w-full py-10">
                <p className="text-gray-600">
                    Loading question...
                </p>
            </div>
        );
    }

    if (error || !question) {
        return (
            <div className="w-full py-10">
                <p className="text-red-600">
                    {error || "Question not found"}
                </p>
            </div>
        );
    }

    return (
        <div className="relative w-full">

            {/* Toast */}
            {toast && (
                <div className="fixed right-5 top-5 z-50 flex min-w-[300px] items-center gap-3 rounded-md border border-green-300 bg-white px-4 py-4 shadow-lg">

                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-500 text-white">
                        ✓
                    </div>

                    <span className="text-sm font-medium text-gray-700">
                        {toast}
                    </span>

                    <button
                        type="button"
                        onClick={() => setToast("")}
                        className="ml-auto text-gray-400 hover:text-gray-700"
                    >
                        ×
                    </button>

                </div>
            )}

            {/* Question Header */}
            <div className="border-b border-gray-200 pb-5">

                <h1 className="text-3xl font-bold text-gray-900">
                    {question.title}
                </h1>

                <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">

                    <Clock3 size={17} />

                    <span>
                        Asked {formatDate(question.askedOn)}
                    </span>

                </div>

            </div>

            {/* Question Card */}
            <div className="mt-6 rounded-xl border border-gray-200 bg-white shadow-sm">

                <div className="flex">

                    {/* Voting */}
                    <div className="flex w-20 shrink-0 flex-col items-center pt-7">

                        <button
                            type="button"
                            onClick={() => handleVote(1)}
                            className="rounded-full p-2 text-gray-600 hover:bg-gray-100"
                        >
                            <ArrowUp size={25} />
                        </button>

                        <span className="my-2 text-lg text-gray-900">
                            {question.votes}
                        </span>

                        <button
                            type="button"
                            onClick={() => handleVote(-1)}
                            className="rounded-full p-2 text-gray-600 hover:bg-gray-100"
                        >
                            <ArrowDown size={25} />
                        </button>

                        <div className="mt-4 flex flex-col gap-2">

                            <button
                                type="button"
                                className="rounded-lg bg-gray-900 p-2 text-white hover:bg-gray-700"
                            >
                                <Bookmark size={18} />
                            </button>

                            <button
                                type="button"
                                className="rounded-lg bg-gray-900 p-2 text-white hover:bg-gray-700"
                            >
                                <History size={18} />
                            </button>

                        </div>

                    </div>

                    {/* Question Content */}
                    <div className="min-w-0 flex-1 p-6 text-base leading-7 text-gray-800">

                        <p className="mb-4">
                            {question.body}
                        </p>

                        {/* Tags */}
                        <div className="mt-6 flex flex-wrap gap-2">

                            {question.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="rounded bg-blue-100 px-2 py-1 text-sm text-blue-700"
                                >
                                    {tag}
                                </span>
                            ))}

                        </div>

                        {/* Question Footer */}
                        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">

                            <div className="flex items-center gap-5 text-sm text-gray-600">

                                <button
                                    type="button"
                                    className="flex items-center gap-1 hover:text-gray-900"
                                >
                                    <Share2 size={16} />
                                    Share
                                </button>

                                <button
                                    type="button"
                                    className="flex items-center gap-1 hover:text-gray-900"
                                >
                                    <Flag size={16} />
                                    Flag
                                </button>

                                {/* Delete Question */}
                                <button
                                    type="button"
                                    onClick={handleDeleteQuestion}
                                    className="flex items-center gap-1 text-red-600 hover:text-red-700"
                                >
                                    <Trash2 size={16} />
                                    Delete
                                </button>

                            </div>

                            <div className="flex items-center gap-3 text-sm text-gray-600">

                                <span>
                                    asked {formatDate(question.askedOn)}
                                </span>

                                <div className="flex items-center gap-2 rounded bg-blue-50 px-3 py-2">

                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 font-medium text-gray-700">
                                        {author?.name
                                            ?.charAt(0)
                                            .toUpperCase() || "U"}
                                    </div>

                                    <span className="font-medium text-blue-600">
                                        {author?.name || "User"}
                                    </span>

                                </div>

                            </div>

                        </div>

                        {/* Question ID */}
                        <div className="mt-4 text-xs text-gray-400">
                            Question ID:{" "}
                            {Array.isArray(questionId)
                                ? questionId[0]
                                : questionId}
                        </div>

                    </div>

                </div>

            </div>

            {/* Answers */}
            <div className="mt-8">

                <h2 className="mb-6 text-xl font-semibold text-gray-900">
                    {question.answers.length}{" "}
                    Answer
                    {question.answers.length !== 1 ? "s" : ""}
                </h2>

                <div className="space-y-6">

                    {question.answers.map((answer, index) => (

                        <div
                            key={answer._id || index}
                            className="rounded-xl border border-gray-200 bg-white shadow-sm"
                        >

                            <div className="p-6">

                                <p className="text-gray-800 leading-relaxed">
                                    {answer.answerBody}
                                </p>

                                <div className="mt-6 flex items-center justify-between">

                                    <div className="flex gap-4">

                                        <button
                                            type="button"
                                            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                                        >
                                            <Share2 size={15} />
                                            Share
                                        </button>

                                        <button
                                            type="button"
                                            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                                        >
                                            <Flag size={15} />
                                            Flag
                                        </button>

                                        {/* Delete Answer */}
                                        {answer._id && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleDeleteAnswer(
                                                        answer._id!
                                                    )
                                                }
                                                className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 size={15} />
                                                Delete
                                            </button>
                                        )}

                                    </div>

                                    <div className="text-sm text-gray-600">
                                        answered{" "}
                                        {formatDate(
                                            answer.answeredOn || ""
                                        )}
                                    </div>

                                </div>

                            </div>

                        </div>

                    ))}

                </div>

            </div>

            {/* Your Answer */}
            <div className="mt-8 rounded-xl border border-gray-200 bg-white shadow-sm">

                <div className="p-6">

                    <h3 className="mb-4 text-lg font-semibold text-gray-900">
                        Your Answer
                    </h3>

                    <textarea
                        value={newanswer}
                        onChange={(e) =>
                            setnewAnswer(e.target.value)
                        }
                        placeholder="Write your answer here... You can use Markdown formatting."
                        className="min-h-[130px] w-full resize-y rounded-lg border border-gray-300 p-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />

                    <div className="mt-4 flex flex-wrap items-center gap-4">

                        <button
                            type="button"
                            onClick={handleSubmitanswer}
                            disabled={
                                !newanswer.trim() ||
                                isSubmitting
                            }
                            className="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSubmitting
                                ? "Posting..."
                                : "Post Your Answer"}
                        </button>

                        <p className="text-sm text-gray-600">
                            By posting your answer, you agree to the{" "}
                            <a
                                href="/privacy"
                                className="text-blue-600 hover:underline"
                            >
                                privacy policy
                            </a>{" "}
                            and{" "}
                            <a
                                href="/terms"
                                className="text-blue-600 hover:underline"
                            >
                                terms of service
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