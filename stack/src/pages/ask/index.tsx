import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import MainLayout from "@/layout/MainLayout";
import axiosInstance from "@/lib/axiosinstance";

const AskQuestion = () => {
    const router = useRouter();

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
            alert("Please log in before asking a question.");
            return;
        }

        if (!title.trim()) {
            alert("Please enter a title.");
            return;
        }

        if (!details.trim() || details.trim().length < 20) {
            alert("Please provide at least 20 characters in the details.");
            return;
        }

        if (!tags.trim()) {
            alert("Please add at least one tag.");
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

            alert("Question posted successfully!");

            const questionId = res.data.data._id;

            router.push(`/questions/${questionId}`);
        } catch (error: any) {
            console.log(error);

            alert(
                error.response?.data?.message ||
                "Unable to post question"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainLayout>
            <main className="min-w-0 w-full max-w-6xl">

                {/* Page Heading */}
                <h1 className="text-2xl font-bold text-gray-800 mb-7">
                    Ask a public question
                </h1>

                {/* Question Form */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

                    {/* Writing a good question */}
                    <h2 className="text-xl font-bold text-gray-900 mb-8">
                        Writing a good question
                    </h2>

                    {/* Title */}
                    <div className="mb-7">

                        <label
                            htmlFor="title"
                            className="block text-base font-semibold text-gray-900"
                        >
                            Title
                        </label>

                        <p className="mt-1 text-sm text-gray-600">
                            Be specific and imagine you're asking a question to another person.
                        </p>

                        <input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. How to center a div in CSS?"
                            className="mt-2 h-10 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />

                    </div>

                    {/* Details */}
                    <div className="mb-7">

                        <label
                            htmlFor="details"
                            className="block text-base font-semibold text-gray-900"
                        >
                            What are the details of your problem?
                        </label>

                        <p className="mt-1 text-sm text-gray-600">
                            Introduce the problem and expand on what you put in the title. Minimum 20 characters.
                        </p>

                        <textarea
                            id="details"
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            placeholder="Describe your problem in detail..."
                            className="mt-2 min-h-48 w-full resize-y rounded-md border border-gray-300 p-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />

                    </div>

                    {/* Tags */}
                    <div className="mb-7">

                        <label
                            htmlFor="tags"
                            className="block text-base font-semibold text-gray-900"
                        >
                            Tags
                        </label>

                        <p className="mt-1 text-sm text-gray-600">
                            Add up to 5 tags to describe what your question is about.
                        </p>

                        <input
                            id="tags"
                            type="text"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            placeholder="e.g. javascript react nextjs"
                            className="mt-2 h-10 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />

                    </div>

                    {/* Review Button */}
                    <button
                        type="button"
                        onClick={handleReview}
                        disabled={loading}
                        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading
                            ? "Posting question..."
                            : "Review your question"}
                    </button>

                </div>

            </main>
        </MainLayout>
    );
};

export default AskQuestion;