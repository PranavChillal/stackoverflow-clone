import axios from "axios";

const axiosInstance = axios.create({
    baseURL:
        process.env.NEXT_PUBLIC_BACKEND_URL ||
        "http://localhost:5000",

    withCredentials: true,
});

/*
|--------------------------------------------------------------------------
| Handle Expired Sessions
|--------------------------------------------------------------------------
*/

axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },

    (error) => {
        if (
            error.response?.status === 401
        ) {
            /*
            |------------------------------------------------------------------
            | Clear Stored User
            |------------------------------------------------------------------
            */

            if (
                typeof window !==
                "undefined"
            ) {
                localStorage.removeItem(
                    "user"
                );

                /*
                |--------------------------------------------------------------
                | Redirect To Login
                |--------------------------------------------------------------
                */

                const currentPath =
                    window.location.pathname;

                if (
                    currentPath !==
                    "/auth"
                ) {
                    window.location.href =
                        "/auth";
                }
            }
        }

        return Promise.reject(
            error
        );
    }
);

export default axiosInstance;