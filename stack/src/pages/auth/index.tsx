import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/lib/AuthContext";

const Index = () => {
    const router = useRouter();

    const auth = useAuth() as any;
const { Login, loading } = auth;

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const success = await Login({
            email,
            password,
        });

        if (success) {
            router.push("/");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md">

                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <Link href="/">
                        <img
                            src="/logo.png"
                            alt="CodeQuest"
                            className="h-10 w-auto"
                        />
                    </Link>
                </div>

                {/* Login Card */}
                <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                    <div className="p-6">

                        {/* Heading */}
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">
                                Log in to your account
                            </h2>

                            <p className="text-sm text-gray-600 mt-2">
                                Enter your email and password to access CodeQuest
                            </p>
                        </div>

                        {/* Google */}
                        <button
                            type="button"
                            className="w-full h-10 mb-3 rounded-md border border-gray-300 bg-white text-gray-800 text-sm font-medium hover:bg-gray-50"
                        >
                            <span className="font-bold mr-2">
                                G
                            </span>
                            Log in with Google
                        </button>

                        {/* GitHub */}
                        <button
                            type="button"
                            className="w-full h-10 rounded-md border border-gray-300 bg-white text-gray-800 text-sm font-medium hover:bg-gray-50"
                        >
                            <span className="font-bold mr-2">
                                GH
                            </span>
                            Log in with GitHub
                        </button>

                        {/* Divider */}
                        <div className="flex items-center gap-3 my-6">
                            <div className="flex-1 border-t border-gray-300" />

                            <span className="text-xs text-gray-500 whitespace-nowrap">
                                OR CONTINUE WITH
                            </span>

                            <div className="flex-1 border-t border-gray-300" />
                        </div>

                        {/* Login Form */}
                        <form
                            onSubmit={handleLogin}
                            className="space-y-5"
                        >

                            {/* Email */}
                            <div>
                                <label
                                    htmlFor="email"
                                    className="block text-sm font-semibold text-gray-900 mb-2"
                                >
                                    Email
                                </label>

                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) =>
                                        setEmail(e.target.value)
                                    }
                                    placeholder="m@example.com"
                                    required
                                    className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label
                                    htmlFor="password"
                                    className="block text-sm font-semibold text-gray-900 mb-2"
                                >
                                    Password
                                </label>

                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    placeholder="••••••••"
                                    required
                                    className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                />
                            </div>

                            {/* Login Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-10 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {loading
                                    ? "Logging in..."
                                    : "Log in"}
                            </button>

                        </form>

                        {/* Forgot Password */}
                        <div className="text-center mt-5">
                            <Link
                                href="/auth"
                                className="text-sm text-blue-600 hover:text-blue-800"
                            >
                                Forgot your password?
                            </Link>
                        </div>

                        {/* Sign Up */}
                        <div className="text-center text-sm mt-3">
                            <span className="text-gray-700">
                                Don't have an account?{" "}
                            </span>

                            <Link
                                href="/signup"
                                className="text-blue-600 hover:text-blue-800"
                            >
                                Sign up
                            </Link>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
};

export default Index;