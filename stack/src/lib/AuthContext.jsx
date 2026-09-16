"use client";

import {
    useState,
    useEffect,
    createContext,
    useContext,
} from "react";

import { toast } from "react-toastify";
import axiosInstance from "./axiosinstance";

const AuthContext = createContext(null);

export const AuthProvider = ({
    children,
}) => {
    const [user, setUser] =
        useState(null);

    const [language, setLanguageState] =
        useState("english");

    /*
    |--------------------------------------------------------------------------
    | Authentication Loading
    |--------------------------------------------------------------------------
    |
    | Start with loading = true because we need to check localStorage
    | before deciding whether the user is authenticated.
    |
    */

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState(null);

    /*
    |--------------------------------------------------------------------------
    | Restore Existing Login Session
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        const restoreUser = () => {
            try {
                const stored =
                    localStorage.getItem("user");

                if (stored) {
                    const parsedUser =
                        JSON.parse(stored);

                    setUser(parsedUser);

                    setLanguageState(
                        parsedUser.preferredLanguage ||
                            "english"
                    );
                }
            } catch (error) {
                console.log(
                    "Unable to read stored user"
                );

                localStorage.removeItem(
                    "user"
                );
            } finally {
                /*
                |--------------------------------------------------------------------------
                | Authentication initialization is now complete.
                |--------------------------------------------------------------------------
                */

                setLoading(false);
            }
        };

        restoreUser();
    }, []);

    /*
    |--------------------------------------------------------------------------
    | Signup
    |--------------------------------------------------------------------------
    */

    const Signup = async ({
        name,
        email,
        password,
    }) => {
        setLoading(true);
        setError(null);

        try {
            const res =
                await axiosInstance.post(
                    "/user/signup",
                    {
                        name,
                        email,
                        password,
                    }
                );

            const newUser =
                res.data.data;

            setUser(newUser);

            setLanguageState(
                newUser.preferredLanguage ||
                    "english"
            );

            localStorage.setItem(
                "user",
                JSON.stringify(
                    newUser
                )
            );

            toast.success(
                "Signup Successful"
            );

            return {
                success: true,
                requiresOtp: false,
            };
        } catch (error) {
            const msg =
                error.response?.data
                    ?.message ||
                "Signup failed";

            setError(msg);
            toast.error(msg);

            return {
                success: false,
                requiresOtp: false,
                message: msg,
            };
        } finally {
            setLoading(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Login
    |--------------------------------------------------------------------------
    */

    const Login = async ({
        email,
        password,
    }) => {
        setLoading(true);
        setError(null);

        try {
            const res =
                await axiosInstance.post(
                    "/user/login",
                    {
                        email,
                        password,
                    }
                );

            /*
            |--------------------------------------------------------------------------
            | New Device
            |--------------------------------------------------------------------------
            */

            if (
                res.data?.requiresOtp
            ) {
                return {
                    success: false,

                    requiresOtp: true,

                    sessionId:
                        res.data
                            .sessionId,

                    message:
                        res.data
                            .message ||
                        "Verification OTP sent to your email.",

                    /*
                    |--------------------------------------------------------------------------
                    | Development OTP
                    |--------------------------------------------------------------------------
                    |
                    | This is only returned by the
                    | backend during development.
                    |
                    */

                    developmentOtp:
                        res.data
                            .developmentOtp,
                };
            }

            /*
            |--------------------------------------------------------------------------
            | Normal Login
            |--------------------------------------------------------------------------
            */

            const loggedInUser =
                res.data.data;

            setUser(
                loggedInUser
            );

            setLanguageState(
                loggedInUser.preferredLanguage ||
                    "english"
            );

            localStorage.setItem(
                "user",
                JSON.stringify(
                    loggedInUser
                )
            );

            toast.success(
                "Login Successful"
            );

            return {
                success: true,
                requiresOtp: false,
            };
        } catch (error) {
            const msg =
                error.response?.data
                    ?.message ||
                "Login failed";

            setError(msg);
            toast.error(msg);

            return {
                success: false,
                requiresOtp: false,
                message: msg,
            };
        } finally {
            setLoading(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Verify Login OTP
    |--------------------------------------------------------------------------
    */

    const verifyLoginOTP =
        async ({
            sessionId,
            otp,
            rememberDevice,
        }) => {
            setLoading(true);
            setError(null);

            try {
                const res =
                    await axiosInstance.post(
                        "/user/login/verify-otp",
                        {
                            sessionId,
                            otp,
                            rememberDevice,
                        }
                    );

                const loggedInUser =
                    res.data.data;

                setUser(
                    loggedInUser
                );

                setLanguageState(
                    loggedInUser.preferredLanguage ||
                        "english"
                );

                localStorage.setItem(
                    "user",
                    JSON.stringify(
                        loggedInUser
                    )
                );

                toast.success(
                    "Login Successful"
                );

                return true;
            } catch (error) {
                const msg =
                    error.response?.data
                        ?.message ||
                    "OTP verification failed";

                setError(msg);
                toast.error(msg);

                return false;
            } finally {
                setLoading(false);
            }
        };

    /*
    |--------------------------------------------------------------------------
    | Resend Login OTP
    |--------------------------------------------------------------------------
    */

    const resendLoginOTP =
        async (
            sessionId
        ) => {
            setLoading(true);
            setError(null);

            try {
                const res =
                    await axiosInstance.post(
                        "/user/login/resend-otp",
                        {
                            sessionId,
                        }
                    );

                toast.success(
                    res.data?.message ||
                        "A new OTP has been sent."
                );

                /*
                |--------------------------------------------------------------------------
                | Return Development OTP
                |--------------------------------------------------------------------------
                */

                return {
                    success: true,

                    message:
                        res.data?.message,

                    developmentOtp:
                        res.data
                            ?.developmentOtp,
                };
            } catch (error) {
                const msg =
                    error.response?.data
                        ?.message ||
                    "Unable to resend OTP";

                setError(msg);
                toast.error(msg);

                return {
                    success: false,
                    message: msg,
                };
            } finally {
                setLoading(false);
            }
        };

    /*
    |--------------------------------------------------------------------------
    | Set Language
    |--------------------------------------------------------------------------
    */

    const setLanguage = (
        newLanguage
    ) => {
        setLanguageState(
            newLanguage
        );

        setUser(
            (currentUser) => {
                if (!currentUser) {
                    return currentUser;
                }

                const updatedUser = {
                    ...currentUser,

                    preferredLanguage:
                        newLanguage,
                };

                localStorage.setItem(
                    "user",
                    JSON.stringify(
                        updatedUser
                    )
                );

                return updatedUser;
            }
        );
    };

    /*
    |--------------------------------------------------------------------------
    | Logout
    |--------------------------------------------------------------------------
    */

    const Logout = () => {
        setUser(null);

        setLanguageState(
            "english"
        );

        localStorage.removeItem(
            "user"
        );

        toast.info(
            "Logged out"
        );
    };

    /*
    |--------------------------------------------------------------------------
    | Provider
    |--------------------------------------------------------------------------
    */

    return (
        <AuthContext.Provider
            value={{
                user,

                language,

                setLanguage,

                Signup,

                Login,

                verifyLoginOTP,

                resendLoginOTP,

                Logout,

                loading,

                error,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () =>
    useContext(AuthContext);