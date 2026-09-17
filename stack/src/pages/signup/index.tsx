import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

import axiosInstance from "@/lib/axiosinstance";
import { useAuth } from "@/lib/AuthContext";
import translations from "@/lib/translations";

export default function SignUpPage() {
  const router = useRouter();
  const auth = useAuth() as any;

  const language = auth?.language || "english";
  const languageKey = language as keyof typeof translations;
  const t = translations[languageKey] || translations.english;

  const a = (t as any).auth || (translations.english as any).auth;
  const qd =
    (t as any).questionDetail || (translations.english as any).questionDetail;

  const displayNameLabel =
    (t as any).displayName || a.displayName || "Display Name";

  const displayNamePlaceholder =
    (t as any).displayNamePlaceholder ||
    a.displayNamePlaceholder ||
    "Enter your display name";

  const mobileNumberLabel =
    (t as any).mobileNumber || a.mobileNumber || "Mobile Number";

  const mobilePlaceholder =
    (t as any).mobilePlaceholder ||
    a.mobilePlaceholder ||
    "Enter your mobile number";

  const mobileLanguageVerification =
    (t as any).mobileLanguageVerification ||
    a.mobileLanguageVerification ||
    "Your mobile number is used for language verification.";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !phone || !password) {
      alert(a.pleaseFillAllFields);
      return;
    }

    if (!/^[0-9]{10}$/.test(phone)) {
      alert(a.validMobileNumber);
      return;
    }

    try {
      setLoading(true);

      const res = await axiosInstance.post("/user/signup", {
        name,
        email,
        phone,
        password,
      });

      localStorage.setItem("user", JSON.stringify(res.data.data));

      alert(a.signupSuccessful);

      router.push("/");
    } catch (error: any) {
      console.log(error);

      alert(error.response?.data?.message || a.signupFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-zinc-50 px-3 py-6 sm:px-4 sm:py-8 md:px-6">
      <Card className="w-full max-w-md overflow-hidden">
        <CardContent className="p-4 sm:p-6 md:p-7">
          {/* Heading */}
          <div className="mb-6 text-center">
            <h1 className="break-words text-xl font-bold text-zinc-900 sm:text-2xl">
              {a.createAccount}
            </h1>

            <p className="mt-2 break-words text-sm leading-5 text-zinc-600">
              {a.joinCommunity}
            </p>
          </div>

          {/* Signup Form */}
          <div className="space-y-5">
            {/* Display Name */}
            <div>
              <Label htmlFor="name">{displayNameLabel}</Label>

              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={displayNamePlaceholder}
                autoComplete="name"
                className="mt-1 h-11 w-full text-zinc-900 placeholder:text-zinc-400"
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email">{a.email || "Email"}</Label>

              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={a.email || "Enter your email"}
                autoComplete="email"
                className="mt-1 h-11 w-full text-zinc-900 placeholder:text-zinc-400"
              />
            </div>

            {/* Mobile Number */}
            <div>
              <Label htmlFor="phone">{mobileNumberLabel}</Label>

              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={mobilePlaceholder}
                autoComplete="tel"
                inputMode="numeric"
                maxLength={10}
                className="mt-1 h-11 w-full text-zinc-900 placeholder:text-zinc-400"
              />

              <p className="mt-1 break-words text-xs leading-5 text-zinc-500">
                {mobileLanguageVerification}
              </p>
            </div>

            {/* Password */}
            <div>
              <Label htmlFor="password">{a.password || "Password"}</Label>

              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={a.password || "Password"}
                autoComplete="new-password"
                className="mt-1 h-11 w-full text-zinc-900 placeholder:text-zinc-400"
              />

              <p className="mt-1 break-words text-xs leading-5 text-zinc-500">
                {a.passwordRequirements}
              </p>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2">
              <input
                id="terms"
                type="checkbox"
                className="mt-1 h-4 w-4 shrink-0 rounded border-zinc-300"
              />

              <label
                htmlFor="terms"
                className="break-words text-xs leading-5 text-zinc-600"
              >
                {a.agreeTo}{" "}
                <span className="text-blue-600">{qd.termsOfService}</span>{" "}
                {qd.and}{" "}
                <span className="text-blue-600">{qd.privacyPolicy}</span>
              </label>
            </div>

            {/* Signup */}
            <Button
              type="button"
              onClick={handleSignup}
              disabled={loading}
              className="min-h-11 w-full"
            >
              {loading ? a.signingUp : a.signUp}
            </Button>
          </div>

          {/* Login */}
          <div className="mt-6 text-center text-sm text-zinc-600">
            <span className="break-words">{a.alreadyHaveAccount} </span>

            <Link
              href="/auth"
              className="inline-block px-1 py-1 text-blue-600 hover:underline"
            >
              {a.logIn}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
