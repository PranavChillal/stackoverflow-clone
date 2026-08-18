import React, { useEffect, useState } from "react";
import MainLayout from "@/layout/MainLayout";
import Link from "next/link";
import axiosInstance from "@/lib/axiosinstance";

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

const Home = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getQuestions = async () => {
      try {
        const response = await axiosInstance.get(
          "/question/getallquestions"
        );

        setQuestions(response.data.data);
      } catch (error) {
        console.log("Unable to fetch questions", error);
      } finally {
        setLoading(false);
      }
    };

    getQuestions();
  }, []);

  return (
    <MainLayout>
      <main className="w-full">

        {/* Header */}
        <div className="mb-4 flex items-center justify-between">

          <h1 className="text-2xl font-bold text-gray-800">
            Top Questions
          </h1>

          <Link href="/ask">
            <button className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
              Ask Question
            </button>
          </Link>

        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm sm:gap-4">

          <span className="text-gray-600">
            {questions.length} questions
          </span>

          <button className="rounded bg-gray-200 px-3 py-1 text-gray-700">
            Newest
          </button>

          <button className="rounded px-3 py-1 text-gray-600 hover:bg-gray-100">
            Active
          </button>

          <button className="flex items-center rounded px-3 py-1 text-gray-600 hover:bg-gray-100">
            Bountied

            <span className="ml-1 rounded bg-gray-100 px-1 text-xs">
              25
            </span>
          </button>

          <button className="rounded px-3 py-1 text-gray-600 hover:bg-gray-100">
            Unanswered
          </button>

          <button className="rounded px-3 py-1 text-gray-600 hover:bg-gray-100">
            More ▼
          </button>

          <button className="rounded border border-gray-300 px-3 py-1 text-gray-600 hover:bg-gray-50">
            🔍 Filter
          </button>

        </div>

        {/* Questions */}
        <div className="border-t border-gray-200">

          {loading ? (

            <div className="py-8 text-center text-gray-600">
              Loading questions...
            </div>

          ) : questions.length === 0 ? (

            <div className="py-8 text-center text-gray-600">
              No questions found.
            </div>

          ) : (

            questions.map((question) => (

              <div
                key={question._id}
                className="flex gap-4 border-b border-gray-200 py-4"
              >

                {/* Stats */}
                <div className="w-20 shrink-0 text-right text-sm text-gray-600">

                  <div>
                    <div>{question.votes}</div>
                    <div>votes</div>
                  </div>

                  <div
                    className={`mt-2 rounded px-1 py-0.5 ${
                      question.answers?.length > 0
                        ? "border border-green-500 text-green-600"
                        : ""
                    }`}
                  >

                    <div>
                      {question.answers?.length || 0}
                    </div>

                    <div>
                      {question.answers?.length === 1
                        ? "answer"
                        : "answers"}
                    </div>

                  </div>

                </div>

                {/* Question Content */}
                <div className="min-w-0 flex-1">

                  <Link
                    href={`/questions/${question._id}`}
                    className="text-lg text-blue-600 hover:text-blue-800"
                  >
                    {question.title}
                  </Link>

                  <p className="mt-1 text-sm text-gray-700">
                    {question.body}
                  </p>

                  {/* Tags + Author */}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">

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

                    <div className="text-xs text-gray-500">

                      <span className="font-medium text-blue-600">
                        User
                      </span>{" "}

                      asked recently

                    </div>

                  </div>

                </div>

              </div>

            ))

          )}

        </div>

      </main>
    </MainLayout>
  );
};

export default Home;