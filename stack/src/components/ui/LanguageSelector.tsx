"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import axiosInstance from "@/lib/axiosinstance";
import { useAuth } from "@/lib/AuthContext";
import translations from "@/lib/translations";

type Language =
  | "english"
  | "spanish"
  | "hindi"
  | "portuguese"
  | "chinese"
  | "french";

const languages: {
  value: Language;
  label: string;
}[] = [
  {
    value: "english",
    label: "English",
  },
  {
    value: "spanish",
    label: "Español",
  },
  {
    value: "hindi",
    label: "हिन्दी",
  },
  {
    value: "portuguese",
    label: "Português",
  },
  {
    value: "chinese",
    label: "中文",
  },
  {
    value: "french",
    label: "Français",
  },
];

const LanguageSelector = () => {
  const auth = useAuth() as any;

  const language = auth?.language || "english";

  const setLanguage = auth?.setLanguage;

  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(
    null,
  );

  const [otp, setOtp] = useState("");

  const [showOtp, setShowOtp] = useState(false);

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  const [verificationMethod, setVerificationMethod] = useState<
    "email" | "mobile" | null
  >(null);

  const [developmentOtp, setDevelopmentOtp] = useState("");

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentLanguage = language as Language;

  const languageKey = currentLanguage as keyof typeof translations;

  const t = translations[languageKey] || translations.english;

  const handleLanguageChange = async (newLanguage: Language) => {
    setMessage("");
    setError("");
    setDevelopmentOtp("");

    if (newLanguage === currentLanguage) {
      setMessage(t.languageChanged);

      return;
    }

    setLoading(true);

    try {
      const response = await axiosInstance.post("/user/language/request", {
        language: newLanguage,
      });

      const data = response.data;

      if (data?.language === newLanguage && !data?.verificationMethod) {
        setLanguage(newLanguage);

        setMessage(data?.message || "Language changed successfully.");

        return;
      }

      setSelectedLanguage(newLanguage);

      if (data?.verificationMethod === "email") {
        setVerificationMethod("email");
      } else if (data?.verificationMethod === "mobile") {
        setVerificationMethod("mobile");
      } else {
        setVerificationMethod(null);
      }

      if (data?.developmentOtp) {
        setDevelopmentOtp(String(data.developmentOtp));
      }

      if (
        data?.verificationMethod === "email" ||
        data?.verificationMethod === "mobile"
      ) {
        setShowOtp(true);

        setMessage(data?.message || "A verification OTP has been sent.");
      } else {
        setError(data?.message || "Unable to start language verification.");
      }
    } catch (error: any) {
      console.log("Language change request error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to request language verification.",
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp.trim()) {
      setError("Please enter the OTP.");

      return;
    }

    if (otp.trim().length !== 6) {
      setError("Please enter the 6-digit OTP.");

      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await axiosInstance.post("/user/language/verify", {
        otp: otp.trim(),
      });

      const newLanguage = response.data?.language || selectedLanguage;

      if (newLanguage) {
        setLanguage(newLanguage);
      }

      setShowOtp(false);
      setOtp("");
      setSelectedLanguage(null);
      setVerificationMethod(null);
      setDevelopmentOtp("");

      setMessage(response.data?.message || "Language changed successfully.");
    } catch (error: any) {
      console.log("Language OTP verification error:", error);

      setError(error.response?.data?.message || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };

  const closeOtpModal = () => {
    setShowOtp(false);
    setOtp("");
    setError("");
    setMessage("");
    setSelectedLanguage(null);
    setVerificationMethod(null);
    setDevelopmentOtp("");
  };

  const otpModal =
    showOtp && mounted && typeof document !== "undefined"
      ? createPortal(
          <div
            className="
              fixed
              inset-0
              z-[99999]
              flex
              items-center
              justify-center
              bg-black/40
              p-4
            "
          >
            <div
              className="
                w-full
                max-w-sm
                max-h-[90vh]
                overflow-y-auto
                rounded-lg
                bg-white
                shadow-2xl
                p-6
              "
            >
              <h2 className="text-lg font-semibold text-gray-900">
                {t.verifyLanguage}
              </h2>

              <p className="text-sm text-gray-600 mt-2">
                {verificationMethod === "mobile"
                  ? "We generated a verification OTP for your registered mobile number."
                  : t.otpSent}
              </p>

              {verificationMethod === "mobile" && developmentOtp && (
                <div className="mt-4 rounded-md border border-yellow-300 bg-yellow-50 p-3">
                  <p className="text-xs font-semibold text-yellow-800">
                    Development Mode
                  </p>

                  <p className="text-sm text-yellow-900 mt-1">
                    Your mobile OTP is:
                  </p>

                  <p className="text-2xl font-bold tracking-widest text-yellow-900 mt-1">
                    {developmentOtp}
                  </p>

                  <p className="text-xs text-yellow-700 mt-1">
                    This is shown because an SMS provider has not been
                    configured yet.
                  </p>
                </div>
              )}

              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                autoFocus
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder={t.enterOtp}
                className="
                  w-full
                  h-10
                  px-3
                  mt-5
                  rounded-md
                  border
                  border-gray-300
                  bg-white
                  text-gray-900
                  placeholder:text-gray-400
                  outline-none
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-200
                "
              />

              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={closeOtpModal}
                  className="
                    flex-1
                    h-10
                    rounded-md
                    border
                    border-gray-300
                    bg-white
                    text-sm
                    text-gray-700
                    hover:bg-gray-50
                  "
                >
                  {t.cancel}
                </button>

                <button
                  type="button"
                  onClick={verifyOTP}
                  disabled={loading}
                  className="
                    flex-1
                    h-10
                    rounded-md
                    bg-blue-600
                    text-white
                    text-sm
                    hover:bg-blue-700
                    disabled:opacity-60
                  "
                >
                  {loading ? t.verifying : t.verify}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <div className="mt-4 border-t border-gray-200 pt-4">
        <label
          htmlFor="language"
          className="block px-2 mb-2 text-xs font-semibold text-gray-500 uppercase"
        >
          {t.language}
        </label>

        <select
          id="language"
          value={currentLanguage}
          disabled={loading}
          onChange={(e) => handleLanguageChange(e.target.value as Language)}
          className="
            w-full
            h-9
            px-2
            rounded-md
            border
            border-gray-300
            bg-white
            text-sm
            text-gray-700
            outline-none
            focus:border-blue-500
            focus:ring-2
            focus:ring-blue-200
            disabled:opacity-60
          "
        >
          {languages.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        {message && (
          <div className="mt-2 px-2 text-xs text-green-600">{message}</div>
        )}

        {error && !showOtp && (
          <div className="mt-2 px-2 text-xs text-red-600">{error}</div>
        )}
      </div>

      {otpModal}
    </>
  );
};

export default LanguageSelector;
