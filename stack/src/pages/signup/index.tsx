import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

import axiosInstance from "@/lib/axiosinstance";

export default function SignUpPage() {
    const router = useRouter();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSignup = async () => {
        if (!name || !email || !password) {
            alert("Please fill in all fields");
            return;
        }

        try {
            setLoading(true);

            const res = await axiosInstance.post("/user/signup", {
                name,
                email,
                password,
            });

            localStorage.setItem(
                "user",
                JSON.stringify(res.data.data)
            );

            alert("Signup successful!");

            router.push("/");
        } catch (error: any) {
            console.log(error);

            alert(
                error.response?.data?.message ||
                "Signup failed"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 text-gray-900">
            <div className="w-full max-w-md">

                <div className="text-center mb-6">
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center"
                    >
                        <img
                            src="/logo.png"
                            alt="CodeQuest"
                            className="h-10 w-auto"
                        />
                    </Link>
                </div>

                <Card className="bg-white text-gray-900">
                    <CardContent className="pt-6">

                        <div className="text-center mb-6">
                            <h1 className="text-2xl font-bold text-gray-900">
                                Create your account
                            </h1>

                            <p className="mt-2 text-gray-600">
                                Join the Stack Overflow Community
                            </p>
                        </div>

                        <Button
                            variant="outline"
                            className="w-full h-11 bg-white text-gray-900 border-gray-300"
                        >
                            <span className="mr-2 font-bold">
                                G
                            </span>
                            Log in with Google
                        </Button>

                        <Button
                            variant="outline"
                            className="w-full h-11 mt-3 bg-white text-gray-900 border-gray-300"
                        >
                            <span className="mr-2 font-bold">
                                GH
                            </span>
                            Log in with GitHub
                        </Button>

                        <div className="flex items-center gap-4 py-6">
                            <div className="h-px bg-gray-300 flex-1" />

                            <span className="text-sm text-gray-600">
                                OR CONTINUE WITH
                            </span>

                            <div className="h-px bg-gray-300 flex-1" />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-gray-900">
                                Display Name
                            </Label>

                            <Input
                                value={name}
                                onChange={(e) =>
                                    setName(e.target.value)
                                }
                                placeholder="demo"
                                className="h-11 bg-white text-gray-900 placeholder:text-gray-400 border-gray-300"
                            />
                        </div>

                        <div className="space-y-2 mt-4">
                            <Label className="text-gray-900">
                                Email
                            </Label>

                            <Input
                                type="email"
                                value={email}
                                onChange={(e) =>
                                    setEmail(e.target.value)
                                }
                                placeholder="you@example.com"
                                className="h-11 bg-white text-gray-900 placeholder:text-gray-400 border-gray-300"
                            />
                        </div>

                        <div className="space-y-2 mt-4">
                            <Label className="text-gray-900">
                                Password
                            </Label>

                            <Input
                                type="password"
                                value={password}
                                onChange={(e) =>
                                    setPassword(e.target.value)
                                }
                                placeholder="Password"
                                className="h-11 bg-white text-gray-900 placeholder:text-gray-400 border-gray-300"
                            />

                            <p className="text-xs text-gray-600">
                                Passwords must contain at least eight
                                characters, including at least 1 letter
                                and 1 number.
                            </p>
                        </div>

                        <div className="flex items-start gap-2 mt-4">
                            <input
                                type="checkbox"
                                id="terms"
                                className="mt-1 h-4 w-4"
                            />

                            <label
                                htmlFor="terms"
                                className="text-sm text-gray-700"
                            >
                                I agree to the{" "}
                                <span className="text-blue-600">
                                    Terms of Service
                                </span>{" "}
                                and{" "}
                                <span className="text-blue-600">
                                    Privacy Policy
                                </span>
                            </label>
                        </div>

                        <Button
                            onClick={handleSignup}
                            disabled={loading}
                            className="w-full h-11 mt-5 bg-blue-600 text-white hover:bg-blue-700"
                        >
                            {loading ? "Signing up..." : "Sign up"}
                        </Button>

                        <p className="text-center text-sm text-gray-600 mt-5">
                            Already have an account?{" "}
                            <Link
                                href="/auth"
                                className="text-blue-600 hover:underline"
                            >
                                Log in
                            </Link>
                        </p>

                    </CardContent>
                </Card>
            </div>
        </div>
    );
}