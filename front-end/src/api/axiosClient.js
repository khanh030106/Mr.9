import axios from "axios";

//-----------------------IMPORT MAIN API-------------------
const API_URL = import.meta.env.VITE_API_URL;
let refreshTokenPromise = null;

function refreshAccessTokenSingleFlight() {
    if (!refreshTokenPromise) {
        refreshTokenPromise = axios
            .post(`${API_URL}/auth/refresh`, {}, { withCredentials: true })
            .then((res) => {
                const newToken = res.data.accessToken;
                localStorage.setItem("accessToken", newToken);
                return newToken;
            })
            .finally(() => {
                refreshTokenPromise = null;
            });
    }
    return refreshTokenPromise;
}

//-------------------CREATE AXIOS API----------------------
const axiosClient = axios.create({
    baseURL: API_URL,
    withCredentials: true
});

axiosClient.interceptors.request.use(config => {
    const token = localStorage.getItem("accessToken");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

axiosClient.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;       //lấy request gốc

        if (!error.response) {                      // tránh crash nếu không có response
            return Promise.reject(error);           //mất mạng hoặc server down
        }
        if (error.response.status === 403) {        // chưa login → không crash
            return Promise.reject(error);
        }

        const url = originalRequest.url || "";
        const isAuthEndpoint =
            url.includes("/auth/login") ||
            url.includes("/auth/refresh") ||
            url.includes("/auth/logout") ||
            url.includes("/auth/me");

        if (error.response.status === 401 &&        // nếu 401 và chưa retry
            !originalRequest._retry &&
            !isAuthEndpoint
        ) {
            originalRequest._retry = true;

            try {
                const newToken = await refreshAccessTokenSingleFlight();
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return axiosClient(originalRequest);
            } catch (err) {
                localStorage.removeItem("accessToken");                     // refresh fail → logout
                return Promise.reject(err);
            }
        }
        return Promise.reject(error);
    }
);

export default axiosClient;
