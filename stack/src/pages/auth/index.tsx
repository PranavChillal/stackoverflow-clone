"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/lib/AuthContext";
import translations from "@/lib/translations";

const Index = () => {
  const router = useRouter();

  const auth = useAuth() as any;

  const { Login, verifyLoginOTP, resendLoginOTP, loading } = auth;

  const language = auth?.language || "english";
  const languageKey = language as keyof typeof translations;

  const t = translations[languageKey] || translations.english;

  const a = t.auth;

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [otp, setOtp] = useState("");

  const [sessionId, setSessionId] = useState<string | null>(null);

  const [showOtp, setShowOtp] = useState(false);

  const [rememberDevice, setRememberDevice] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const result = await Login({
      email,
      password,
    });

    if (result?.requiresOtp && result?.sessionId) {
      setSessionId(result.sessionId);

      setOtp("");

      setRememberDevice(false);

      setShowOtp(true);

      return;
    }

    if (result?.success) {
      router.push("/");
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!sessionId) {
      return;
    }

    const success = await verifyLoginOTP({
      sessionId,
      otp,
      rememberDevice,
    });

    if (success) {
      router.push("/");
    }
  };

  const handleResendOTP = async () => {
    if (!sessionId) {
      return;
    }

    await resendLoginOTP(sessionId);
  };

  const handleBackToLogin = () => {
    setShowOtp(false);
    setSessionId(null);
    setOtp("");
    setRememberDevice(false);
  };

  /*
   * OTP Verification Screen
   */
  if (showOtp) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 px-3 py-6 sm:px-4 sm:py-8 md:px-6">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-5 flex justify-center sm:mb-8">
            <Link href="/" className="inline-flex">
              <img
                src="/logo.png"
                alt="CodeQuest"
                className="h-9 w-auto sm:h-10"
              />
            </Link>
          </div>

          {/* OTP Card */}
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="p-4 sm:p-6 md:p-7">
              {/* Heading */}
              <div className="mb-6 text-center">
                <h2 className="break-words text-xl font-bold text-gray-900 sm:text-2xl">
                  {a.verifyLogin}
                </h2>

                <p className="mt-2 break-words text-sm leading-6 text-gray-600 sm:text-base">
                  {a.newDeviceLoginDescription}
                </p>
              </div>

              <form onSubmit={handleVerifyOTP} className="space-y-5">
                {/* OTP */}
                <div>
                  <label
                    htmlFor="login-otp"
                    className="mb-2 block text-sm font-semibold text-gray-900"
                  >
                    {a.verificationCode}
                  </label>

                  <input
                    id="login-otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={otp}
                    onChange={(e) => {
                      const value = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6);

                      setOtp(value);
                    }}
                    placeholder={a.enterSixDigitOtp}
                    maxLength={6}
                    required
                    className="h-12 w-full min-w-0 rounded-md border border-gray-300 bg-white px-3 text-center text-base tracking-[0.25em] text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:text-lg sm:tracking-[0.4em]"
                  />
                </div>

                {/* Remember Device */}
                <div className="flex items-start gap-2">
                  <input
                    id="remember-device"
                    type="checkbox"
                    checked={rememberDevice}
                    onChange={(e) => setRememberDevice(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />

                  <label
                    htmlFor="remember-device"
                    className="cursor-pointer break-words text-sm leading-5 text-gray-700"
                  >
                    {a.rememberDevice}
                  </label>
                </div>

                <p className="break-words text-xs leading-5 text-gray-500 sm:text-sm">
                  {a.rememberDeviceDescription}
                </p>

                {/* Verify */}
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="min-h-11 w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? a.verifying : a.verifyAndLogin}
                </button>
              </form>

              {/* Resend OTP */}
              <div className="mt-5 text-center">
                <p className="mb-2 break-words text-sm text-gray-600">
                  {a.didntReceiveCode}
                </p>

                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={loading}
                  className="min-h-10 px-2 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                >
                  {a.resendOtp}
                </button>
              </div>

              {/* Back */}
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="min-h-10 px-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  ← {a.backToLogin}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /*
   * Login Screen
   */
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 px-3 py-6 sm:px-4 sm:py-8 md:px-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-5 flex justify-center sm:mb-8">
          <Link href="/" className="inline-flex">
            <img
              src="/logo.png"
              alt="CodeQuest"
              className="h-9 w-auto sm:h-10"
            />
          </Link>
        </div>

        {/* Login Card */}
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="p-4 sm:p-6 md:p-7">
            {/* Heading */}
            <div className="mb-6 text-center">
              <h2 className="break-words text-xl font-bold text-gray-900 sm:text-2xl">
                {a.loginToAccount}
              </h2>

              <p className="mt-2 break-words text-sm leading-6 text-gray-600 sm:text-base">
                {a.loginDescription}
              </p>
            </div>

            {/* Google */}
            <button
              type="button"
              className="mb-3 flex min-h-11 w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 transition hover:bg-gray-50"
            >
              <span className="mr-2 font-bold">G</span>

              {a.loginWithGoogle}
            </button>

            {/* GitHub */}
            <button
              type="button"
              className="flex min-h-11 w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 transition hover:bg-gray-50"
            >
              <span className="mr-2 font-bold">GH</span>

              {a.loginWithGitHub}
            </button>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="flex-1 border-t border-gray-300" />

              <span className="whitespace-nowrap text-xs text-gray-500">
                {a.orContinueWith}
              </span>

              <div className="flex-1 border-t border-gray-300" />
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-gray-900"
                >
                  {a.email}
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="m@example.com"
                  autoComplete="email"
                  required
                  className="h-11 w-full min-w-0 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:h-12"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-gray-900"
                >
                  {a.password}
                </label>

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="h-11 w-full min-w-0 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:h-12"
                />
              </div>

              {/* Login */}
              <button
                type="submit"
                disabled={loading}
                className="min-h-11 w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? a.loggingIn : a.logIn}
              </button>
            </form>

            {/* Forgot Password */}
            <div className="mt-5 text-center">
              <Link
                href="/auth/forgot-password"
                className="inline-block px-2 py-2 text-sm text-blue-600 hover:text-blue-800"
              >
                {a.forgotPassword}
              </Link>
            </div>

            {/* Signup */}
            <div className="mt-2 text-center text-sm">
              <span className="text-gray-700">{a.dontHaveAccount} </span>

              <Link
                href="/signup"
                className="inline-block px-1 py-1 text-blue-600 hover:text-blue-800"
              >
                {a.signUp}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
