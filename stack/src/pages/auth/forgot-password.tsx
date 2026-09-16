import React, { useState } from "react";
import Link from "next/link";

import axiosInstance from "@/lib/axiosinstance";
import { useAuth } from "@/lib/AuthContext";
import translations from "@/lib/translations";

const ForgotPassword = () => {
  const auth = useAuth() as any;

  const language = auth?.language || "english";
  const languageKey = language as keyof typeof translations;

  const t = translations[languageKey] || translations.english;

  const a = (t as any).auth || (translations.english as any).auth;

  const [method, setMethod] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setMessage("");
    setError("");
    setGeneratedPassword("");

    if (method === "email" && !email.trim()) {
      setError(a.registeredEmail);
      return;
    }

    if (method === "phone" && !phone.trim()) {
      setError(a.registeredPhone);
      return;
    }

    try {
      setLoading(true);

      const response = await axiosInstance.post(
        "/user/forgot-password",
        method === "email"
          ? {
              email: email.trim().toLowerCase(),
            }
          : {
              phone: phone.trim(),
            },
      );

      setMessage(response.data?.message || a.passwordResetSuccessful);

      setGeneratedPassword(response.data?.data?.password || "");
    } catch (error: any) {
      console.log(error);

      setError(error.response?.data?.message || a.unableToResetPassword);
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setMessage("");
    setError("");
    setGeneratedPassword("");
  };

  return (
    <div className="flex min-h-screen w-full min-w-0 items-center justify-center overflow-x-hidden bg-zinc-50 px-3 py-6 sm:px-4 sm:py-8 md:px-6">
      <div className="w-full max-w-md min-w-0">
        <div className="w-full min-w-0 overflow-hidden rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
          {/* Heading */}
          <div className="mb-6 text-center">
            <h1 className="break-words text-xl font-bold leading-tight text-zinc-900 sm:text-2xl">
              {a.forgotPassword}
            </h1>

            <p className="mt-2 break-words text-sm leading-6 text-zinc-600">
              {a.forgotPasswordDescription}
            </p>
          </div>

          {/* Reset Method */}
          <div className="mb-6 flex w-full min-w-0 overflow-hidden rounded-md border border-zinc-300">
            <button
              type="button"
              onClick={() => {
                setMethod("email");
                clearMessages();
              }}
              className={`min-h-11 min-w-0 flex-1 break-words px-2 py-2.5 text-sm font-medium transition sm:px-4 ${
                method === "email"
                  ? "bg-zinc-900 text-white"
                  : "bg-white text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              {a.email}
            </button>

            <button
              type="button"
              onClick={() => {
                setMethod("phone");
                clearMessages();
              }}
              className={`min-h-11 min-w-0 flex-1 break-words px-2 py-2.5 text-sm font-medium transition sm:px-4 ${
                method === "phone"
                  ? "bg-zinc-900 text-white"
                  : "bg-white text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              {a.phone}
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {method === "email" ? (
              <div className="min-w-0">
                <label
                  htmlFor="email"
                  className="mb-1 block break-words text-sm font-medium text-zinc-800"
                >
                  {a.registeredEmail}
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={a.email}
                  autoComplete="email"
                  className="h-11 w-full min-w-0 rounded-md border border-zinc-300 px-3 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-400"
                />
              </div>
            ) : (
              <div className="min-w-0">
                <label
                  htmlFor="phone"
                  className="mb-1 block break-words text-sm font-medium text-zinc-800"
                >
                  {a.registeredPhone}
                </label>

                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={a.registeredPhone}
                  autoComplete="tel"
                  inputMode="tel"
                  className="h-11 w-full min-w-0 rounded-md border border-zinc-300 px-3 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-400"
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="w-full min-w-0 break-words overflow-hidden rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm leading-5 text-red-700">
                {error}
              </div>
            )}

            {/* Success Message */}
            {message && (
              <div className="w-full min-w-0 break-words overflow-hidden rounded-md border border-green-200 bg-green-50 px-3 py-2.5 text-sm leading-5 text-green-700">
                {message}
              </div>
            )}

            {/* Generated Password */}
            {generatedPassword && (
              <div className="w-full min-w-0 overflow-hidden rounded-md border border-blue-200 bg-blue-50 p-3 sm:p-4">
                <p className="break-words text-sm font-medium text-blue-900">
                  {a.newPassword}
                </p>

                <div className="mt-2 w-full min-w-0 overflow-hidden rounded-md border border-blue-200 bg-white px-3 py-2 font-mono text-sm text-zinc-900">
                  <span className="block break-all">{generatedPassword}</span>
                </div>

                <p className="mt-2 break-words text-xs leading-5 text-blue-700">
                  {a.savePasswordSafely}
                </p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="min-h-11 w-full rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? a.resetting : a.resetPassword}
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link
              href="/auth"
              className="inline-flex min-h-10 max-w-full items-center justify-center break-words px-2 py-2 text-sm text-blue-600 hover:text-blue-700 hover:underline"
            >
              ← {a.backToLogin}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
