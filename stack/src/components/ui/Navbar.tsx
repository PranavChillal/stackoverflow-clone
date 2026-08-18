"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "./button";
import { useAuth } from "@/lib/AuthContext";

interface NavbarProps {
    handleslidein?: () => void;
}

const Navbar = ({ handleslidein: _handleslidein }: NavbarProps) => {
    const auth = useAuth() as any;

    const { user, Logout } = auth;

    const userId = user?._id ? String(user._id) : null;

    return (
        <nav className="h-[53px] border-b bg-white flex items-center px-4">

            {/* Logo */}
            <Link
                href="/"
                className="flex items-center gap-2 mr-8"
            >
                <img
                    src="/logo.png"
                    alt="CodeQuest"
                    className="h-8 w-auto"
                />

                <span className="font-bold text-lg">
                    CodeQuest
                </span>
            </Link>

            {/* Navigation */}
            <div className="hidden md:flex items-center gap-8">
                <Link href="/">About</Link>
                <Link href="/">Products</Link>
                <Link href="/">For Teams</Link>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-xl mx-8">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full h-9 border rounded-md pl-10 pr-3"
                    />

                    <Search
                        size={18}
                        className="absolute left-3 top-2"
                    />
                </div>
            </div>

            {/* Authentication */}
            <div className="flex items-center gap-3">

                {user ? (
                    <>
                        {/* Avatar */}
                        {userId ? (
                            <Link href={`/users/${userId}`}>
                                <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-semibold cursor-pointer">
                                    {user.name
                                        ?.charAt(0)
                                        .toUpperCase()}
                                </div>
                            </Link>
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-semibold">
                                {user.name
                                    ?.charAt(0)
                                    .toUpperCase()}
                            </div>
                        )}

                        {/* Logout */}
                        <Button
                            variant="outline"
                            onClick={Logout}
                        >
                            Log out
                        </Button>
                    </>
                ) : (
                    <Link href="/auth">
                        <Button variant="outline">
                            Log in
                        </Button>
                    </Link>
                )}

            </div>
        </nav>
    );
};

export default Navbar;