import {useEffect} from "react";
import {useLocation, useNavigate} from "react-router-dom";


const OAuthCallback = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const token = params.get("token");

        if (!token) {
            navigate("/bookseller/login?error=oauth2_no_token", { replace: true });
            return;
        }

        // 1) Lưu access token
        localStorage.setItem("accessToken", token);

        // 2) Xóa token khỏi URL để tránh lộ qua history/log
        window.history.replaceState({}, document.title, "/api/login/oauth2/callback");

        // 3) Điều hướng về home
        navigate("/bookseller/home", { replace: true });
    }, [location.search, navigate]);

    return (
        <></>
    );
}

export default OAuthCallback;