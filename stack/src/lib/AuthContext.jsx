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

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const stored = localStorage.getItem("user");

        if (stored) {
            try {
                setUser(JSON.parse(stored));
            } catch (error) {
                console.log("Unable to read stored user");
                localStorage.removeItem("user");
            }
        }
    }, []);

    const Signup = async ({ name, email, password }) => {
        setLoading(true);
        setError(null);

        try {
            const res = await axiosInstance.post("/user/signup", {
                name,
                email,
                password,
            });

            setUser(res.data.data);

            localStorage.setItem(
                "user",
                JSON.stringify(res.data.data)
            );

            toast.success("Signup Successful");

            return true;
        } catch (error) {
            const msg =
                error.response?.data?.message || "Signup failed";

            setError(msg);
            toast.error(msg);

            return false;
        } finally {
            setLoading(false);
        }
    };

    const Login = async ({ email, password }) => {
        setLoading(true);
        setError(null);

        try {
            const res = await axiosInstance.post("/user/login", {
                email,
                password,
            });

            setUser(res.data.data);

            localStorage.setItem(
                "user",
                JSON.stringify(res.data.data)
            );

            toast.success("Login Successful");

            return true;
        } catch (error) {
            const msg =
                error.response?.data?.message || "Login failed";

            setError(msg);
            toast.error(msg);

            return false;
        } finally {
            setLoading(false);
        }
    };

    const Logout = () => {
        setUser(null);
        localStorage.removeItem("user");

        toast.info("Logged out");
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                Signup,
                Login,
                Logout,
                loading,
                error,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);