import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ToastContainer } from "react-toastify";
import { AuthProvider } from "@/lib/AuthContext";

import "react-toastify/dist/ReactToastify.css";

export default function App({
    Component,
    pageProps,
}: AppProps) {
    return (
        <AuthProvider>
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                pauseOnHover
            />

            <Component {...pageProps} />
        </AuthProvider>
    );
}