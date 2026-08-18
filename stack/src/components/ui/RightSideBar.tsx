import React from "react";

const RightSideBar = () => {
    return (
        <aside className="w-64 shrink-0 p-4 bg-white">

            {/* The Overflow Blog */}
            <div className="border rounded-lg mb-4">
                <div className="bg-yellow-50 p-4 border-b">
                    <h3 className="font-bold text-base mb-3">
                        The Overflow Blog
                    </h3>

                    <div className="space-y-3 text-sm">
                        <p className="flex gap-2">
                            <span>🖉</span>
                            A new era of Stack Overflow
                        </p>

                        <p className="flex gap-2">
                            <span>🖉</span>
                            How your favorite movie is changing language learning
                            technology
                        </p>
                    </div>
                </div>
            </div>

            {/* Featured on Meta */}
            <div className="border rounded-lg mb-6">
                <div className="p-4">
                    <h3 className="font-bold text-base mb-3">
                        Featured on Meta
                    </h3>

                    <div className="space-y-3 text-sm">
                        <p className="flex gap-2">
                            <span>💬</span>
                            Results of the June 2025 Community Asks Sprint
                        </p>

                        <p className="flex gap-2">
                            <span>💬</span>
                            Will you help build our new visual identity?
                        </p>

                        <p className="flex gap-2">
                            <span>📋</span>
                            Policy: Generative AI (e.g., ChatGPT) is banned
                        </p>
                    </div>
                </div>
            </div>

            {/* Custom Filters */}
            <div className="mb-6">
                <h3 className="font-bold text-base mb-4">
                    Custom Filters
                </h3>

                <button className="border border-blue-400 text-blue-600 rounded-md px-3 py-2 text-sm">
                    Create a custom filter
                </button>
            </div>

            {/* Watched Tags */}
            <div>
                <h3 className="font-bold text-base mb-8">
                    Watched Tags
                </h3>

                <div className="text-center text-gray-400">
                    <div className="text-5xl mb-4">
                        ◉
                    </div>

                    <p className="text-sm">
                        Watch tags to curate your list of questions.
                    </p>

                    <button className="mt-4 border border-blue-400 text-blue-600 rounded-md px-3 py-2 text-sm">
                        👁 Watch a tag
                    </button>
                </div>
            </div>

        </aside>
    );
};

export default RightSideBar;