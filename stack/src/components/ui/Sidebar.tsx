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
} from "lucide-react";
import Link from "next/link";
import React from "react";
import { Badge } from "./badge";

const Sidebar = ({ isOpen }: any) => {
    return (
        <aside
            className={`top-[53px] w-48 lg:w-64 max-h-full bg-white shadow-sm border-r transition-transform duration-200 ease-in-out md:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"
                }`}
        >
            <nav className="p-2 lg:p-4">
                <ul className="space-y-1">
                    <li>
                        <Link
                            href="/"
                            className="flex items-center px-2 py-2 text-gray-700 hover:bg-gray-100 rounded text-sm"
                        >
                            <Home className="w-4 h-4 mr-2 lg:mr-3" />
                            Home
                        </Link>
                    </li>

                    <li>
                        <Link
                            href="/questions"
                            className="flex items-center px-2 py-2 text-gray-700 hover:bg-gray-100 rounded text-sm"
                        >
                            <MessageSquare className="w-4 h-4 mr-2 lg:mr-3" />
                            Questions
                        </Link>
                    </li>

                    <li>
                        <Link
                            href="/"
                            className="flex items-center px-2 py-2 text-gray-700 hover:bg-gray-100 rounded text-sm">
                            <Bot className="w-4 h-4 mr-2 lg:mr-3" />
                            AI Assist
                            <Badge className="ml-auto">Labs</Badge>
                        </Link>
                    </li>

                    <li>
                        <Link
                            href="/"
                            className="flex items-center px-2 py-2 text-gray-700 hover:bg-gray-100 rounded text-sm"
                        >
                            <Tags className="w-4 h-4 mr-2 lg:mr-3" />
                            Tags
                        </Link>
                    </li>

                    <li>
                        <Link
                            href="/"
                            className="flex items-center px-2 py-2 text-gray-700 hover:bg-gray-100 rounded text-sm"
                        >
                            <Users className="w-4 h-4 mr-2 lg:mr-3" />
                            Users
                        </Link>
                    </li>

                    <li>
                        <Link
                            href="/"
                            className="flex items-center px-2 py-2 text-gray-700 hover:bg-gray-100 rounded text-sm"
                        >
                            <Bookmark className="w-4 h-4 mr-2 lg:mr-3" />
                            Saves
                        </Link>
                    </li>

                    <li>
                        <Link
                            href="/"
                            className="flex items-center px-2 py-2 text-gray-700 hover:bg-gray-100 rounded text-sm"
                        >
                            <Trophy className="w-4 h-4 mr-2 lg:mr-3" />
                            Challenges
                            <Badge className="ml-auto">NEW</Badge>
                        </Link>
                    </li>

                    <li>
                        <Link
                            href="/"
                            className="flex items-center px-2 py-2 text-gray-700 hover:bg-gray-100 rounded text-sm"
                        >
                            <MessageCircle className="w-4 h-4 mr-2 lg:mr-3" />
                            Chat
                        </Link>
                    </li>

                    <li>
                        <Link
                            href="/"
                            className="flex items-center px-2 py-2 text-gray-700 hover:bg-gray-100 rounded text-sm"
                        >
                            <FileText className="w-4 h-4 mr-2 lg:mr-3" />
                            Articles
                        </Link>
                    </li>

                    <li>
                        <Link
                            href="/"
                            className="flex items-center px-2 py-2 text-gray-700 hover:bg-gray-100 rounded text-sm"
                        >
                            <Building2 className="w-4 h-4 mr-2 lg:mr-3" />
                            Companies
                        </Link>
                    </li>
                </ul>
            </nav>
        </aside>
    );
};

export default Sidebar;